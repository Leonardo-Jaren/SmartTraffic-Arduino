import * as THREE from 'three'
import {
  ANCHO_VIA,
  ANCHO_TABLERO,
  FONDO_TABLERO,
  CRUCES,
  DISTANCIA_LINEA_CRUCE,
  NODOS,
  TRAMOS,
} from '../simulacion/mapa'
import { crearCiudad } from './ciudad'
import { crearSenalesCeda } from './senales'

// El tablero físico declarado mide 160 × 120 cm; el eje Y conserva la escala horizontal.
export const ESCALA_MAQUETA = { x: 1.6 / ANCHO_TABLERO, y: 1.6 / ANCHO_TABLERO, z: 1.2 / FONDO_TABLERO }

function caja(ancho: number, alto: number, fondo: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), new THREE.MeshStandardMaterial({ color }))
}

function crearBordes(tramo: (typeof TRAMOS)[number], escena: THREE.Group) {
  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const dx = (b.x - a.x) / tramo.longitud
  const dz = (b.z - a.z) / tramo.longitud
  const margenA = a.tipo === 'cruce' ? 1.4 : 0
  const margenB = b.tipo === 'cruce' ? 1.4 : 0
  const largo = Math.max(0.1, tramo.longitud - margenA - margenB)
  const centroX = a.x + dx * (margenA + largo / 2)
  const centroZ = a.z + dz * (margenA + largo / 2)
  for (const lado of [-1, 1]) {
    const acera = caja(
      tramo.eje === 'horizontal' ? largo : 0.25,
      0.07,
      tramo.eje === 'vertical' ? largo : 0.25,
      0xd0d8de,
    )
    acera.position.set(centroX - dz * lado * (ANCHO_VIA / 2 + 0.13), 0.19, centroZ + dx * lado * (ANCHO_VIA / 2 + 0.13))
    const borde = caja(
      tramo.eje === 'horizontal' ? largo : 0.045,
      0.012,
      tramo.eje === 'vertical' ? largo : 0.045,
      0xe4ebf0,
    )
    borde.position.set(centroX - dz * lado * (ANCHO_VIA / 2), 0.23, centroZ + dx * lado * (ANCHO_VIA / 2))
    escena.add(acera, borde)
  }
}

function pintarFlecha(tramo: (typeof TRAMOS)[number], escena: THREE.Group, desplazamiento: number) {
  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const dx = (b.x - a.x) / tramo.longitud
  const dz = (b.z - a.z) / tramo.longitud
  const centro = new THREE.Vector3((a.x + b.x) / 2 - dz * desplazamiento, 0.235, (a.z + b.z) / 2 + dx * desplazamiento)
  const forma = new THREE.Shape()
  forma.moveTo(0, 0.45)
  forma.lineTo(-0.25, 0.05)
  forma.lineTo(-0.08, 0.05)
  forma.lineTo(-0.08, -0.4)
  forma.lineTo(0.08, -0.4)
  forma.lineTo(0.08, 0.05)
  forma.lineTo(0.25, 0.05)
  forma.closePath()
  const flecha = new THREE.Mesh(
    new THREE.ShapeGeometry(forma),
    new THREE.MeshBasicMaterial({ color: 0xf4f7fa, side: THREE.DoubleSide }),
  )
  flecha.rotation.x = -Math.PI / 2
  flecha.rotation.z = Math.atan2(-dx, -dz)
  flecha.position.copy(centro)
  escena.add(flecha)
}

function pintarDivisionCarriles(tramo: (typeof TRAMOS)[number], escena: THREE.Group) {
  const a = NODOS[tramo.de]!,
    b = NODOS[tramo.hacia]!
  const dx = (b.x - a.x) / tramo.longitud,
    dz = (b.z - a.z) / tramo.longitud
  const material = new THREE.MeshBasicMaterial({ color: 0xeef2ed })
  for (let distancia = 2.6; distancia < tramo.longitud - 2; distancia += 1.3) {
    const raya = new THREE.Mesh(
      new THREE.BoxGeometry(tramo.eje === 'horizontal' ? 0.65 : 0.035, 0.012, tramo.eje === 'vertical' ? 0.65 : 0.035),
      material,
    )
    raya.position.set(a.x + dx * distancia, 0.235, a.z + dz * distancia)
    escena.add(raya)
  }
}

function crearPaso(x: number, z: number, horizontal: boolean, escena: THREE.Group) {
  for (let i = -2; i <= 2; i++) {
    const franja = caja(horizontal ? 0.16 : 0.23, 0.02, horizontal ? 0.23 : 0.16, 0xf4f7fa)
    franja.position.set(x + (horizontal ? 0 : i * 0.33), 0.242, z + (horizontal ? i * 0.33 : 0))
    escena.add(franja)
  }
}

function crearLineaDetencion(tramo: (typeof TRAMOS)[number], escena: THREE.Group) {
  if (NODOS[tramo.hacia]!.tipo !== 'cruce') return
  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const dx = (b.x - a.x) / tramo.longitud
  const dz = (b.z - a.z) / tramo.longitud
  const linea = new THREE.Mesh(
    new THREE.BoxGeometry(
      tramo.eje === 'horizontal' ? 0.13 : ANCHO_VIA * 0.92,
      0.018,
      tramo.eje === 'vertical' ? 0.13 : ANCHO_VIA * 0.92,
    ),
    new THREE.MeshBasicMaterial({ color: 0xf4f7fa }),
  )
  linea.position.set(b.x - dx * DISTANCIA_LINEA_CRUCE, 0.233, b.z - dz * DISTANCIA_LINEA_CRUCE)
  escena.add(linea)
}

export function crearMaqueta(escena: THREE.Group) {
  escena.scale.set(ESCALA_MAQUETA.x, ESCALA_MAQUETA.y, ESCALA_MAQUETA.z)
  const seleccionables: THREE.Object3D[] = []
  const calles = new Map<string, THREE.Mesh>()
  const cruces = new Map<string, THREE.Mesh>()
  const base = caja(ANCHO_TABLERO, 0.35, FONDO_TABLERO, 0x779777)
  base.userData.recibeSombra = true
  base.position.y = -0.03
  escena.add(base)

  for (const tramo of TRAMOS) {
    const a = NODOS[tramo.de]!
    const b = NODOS[tramo.hacia]!
    const dx = (b.x - a.x) / tramo.longitud
    const dz = (b.z - a.z) / tramo.longitud
    const margenA = a.tipo === 'cruce' ? ANCHO_VIA / 2 : 0
    const margenB = b.tipo === 'cruce' ? ANCHO_VIA / 2 : 0
    const largo = tramo.longitud - margenA - margenB
    const carretera = caja(
      tramo.eje === 'horizontal' ? largo : ANCHO_VIA,
      0.06,
      tramo.eje === 'vertical' ? largo : ANCHO_VIA,
      0x1e2124,
    )
    carretera.userData.recibeSombra = true
    carretera.position.set(a.x + dx * (margenA + largo / 2), 0.19, a.z + dz * (margenA + largo / 2))
    carretera.userData = { ...carretera.userData, tipo: 'tramo', id: tramo.id }
    escena.add(carretera)
    seleccionables.push(carretera)
    calles.set(tramo.id, carretera)
    crearBordes(tramo, escena)
    pintarFlecha(tramo, escena, -ANCHO_VIA / 4)
    pintarFlecha(tramo, escena, ANCHO_VIA / 4)
    pintarDivisionCarriles(tramo, escena)
    crearLineaDetencion(tramo, escena)
  }

  for (const id of CRUCES) {
    const n = NODOS[id]!
    const cruce = caja(ANCHO_VIA, 0.07, ANCHO_VIA, 0x1e2124)
    cruce.userData.recibeSombra = true
    cruce.position.set(n.x, 0.195, n.z)
    cruce.userData = { ...cruce.userData, tipo: 'cruce', id }
    escena.add(cruce)
    seleccionables.push(cruce)
    cruces.set(id, cruce)
    crearPaso(n.x - 1.15, n.z, true, escena)
    crearPaso(n.x + 1.15, n.z, true, escena)
    crearPaso(n.x, n.z - 1.15, false, escena)
    crearPaso(n.x, n.z + 1.15, false, escena)
  }

  crearCiudad(escena)
  crearSenalesCeda(escena)
  return { seleccionables, calles, cruces }
}
