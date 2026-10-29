import * as THREE from 'three'
import { CRUCES, DISTANCIA_LINEA_CRUCE, NODOS, TRAMOS } from '../simulacion/mapa'
import { crearCiudad } from './ciudad'
import { crearSenalesCeda } from './senales'

// El tablero físico declarado mide 160 × 120 cm; el eje Y conserva la escala horizontal.
export const ESCALA_MAQUETA = { x: 1.6 / 21, y: 1.6 / 21, z: 1.2 / 17 }

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
      0xc5cdc5,
    )
    acera.position.set(centroX - dz * lado * 1.13, 0.19, centroZ + dx * lado * 1.13)
    const borde = caja(
      tramo.eje === 'horizontal' ? largo : 0.045,
      0.012,
      tramo.eje === 'vertical' ? largo : 0.045,
      0xe6ebe3,
    )
    borde.position.set(centroX - dz * lado * 0.95, 0.23, centroZ + dx * lado * 0.95)
    escena.add(acera, borde)
  }
}

function pintarFlecha(tramo: (typeof TRAMOS)[number], escena: THREE.Group) {
  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const dx = (b.x - a.x) / tramo.longitud
  const dz = (b.z - a.z) / tramo.longitud
  const centro = new THREE.Vector3((a.x + b.x) / 2, 0.235, (a.z + b.z) / 2)
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
    new THREE.MeshBasicMaterial({ color: 0xe8e7d4, side: THREE.DoubleSide }),
  )
  flecha.rotation.x = -Math.PI / 2
  flecha.rotation.z = Math.atan2(-dx, -dz)
  flecha.position.copy(centro)
  escena.add(flecha)
}

function crearPaso(x: number, z: number, horizontal: boolean, escena: THREE.Group) {
  for (let i = -2; i <= 2; i++) {
    const franja = caja(horizontal ? 0.16 : 0.27, 0.02, horizontal ? 0.27 : 0.16, 0xf6f5ed)
    franja.position.set(x + (horizontal ? 0 : i * 0.31), 0.242, z + (horizontal ? i * 0.31 : 0))
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
    new THREE.BoxGeometry(tramo.eje === 'horizontal' ? 0.13 : 1.55, 0.018, tramo.eje === 'vertical' ? 0.13 : 1.55),
    new THREE.MeshBasicMaterial({ color: 0xf1f0e8 }),
  )
  linea.position.set(b.x - dx * DISTANCIA_LINEA_CRUCE, 0.233, b.z - dz * DISTANCIA_LINEA_CRUCE)
  escena.add(linea)
}

export function crearMaqueta(escena: THREE.Group) {
  escena.scale.set(ESCALA_MAQUETA.x, ESCALA_MAQUETA.y, ESCALA_MAQUETA.z)
  const seleccionables: THREE.Object3D[] = []
  const calles = new Map<string, THREE.Mesh>()
  const cruces = new Map<string, THREE.Mesh>()
  const base = caja(21, 0.35, 17, 0x6baa78)
  base.userData.recibeSombra = true
  base.position.y = -0.03
  escena.add(base)

  for (const tramo of TRAMOS) {
    const a = NODOS[tramo.de]!
    const b = NODOS[tramo.hacia]!
    const dx = (b.x - a.x) / tramo.longitud
    const dz = (b.z - a.z) / tramo.longitud
    const margenA = a.tipo === 'cruce' ? 1 : 0
    const margenB = b.tipo === 'cruce' ? 1 : 0
    const largo = tramo.longitud - margenA - margenB
    const carretera = caja(tramo.eje === 'horizontal' ? largo : 2, 0.06, tramo.eje === 'vertical' ? largo : 2, 0x343e49)
    carretera.userData.recibeSombra = true
    carretera.position.set(a.x + dx * (margenA + largo / 2), 0.19, a.z + dz * (margenA + largo / 2))
    carretera.userData = { ...carretera.userData, tipo: 'tramo', id: tramo.id }
    escena.add(carretera)
    seleccionables.push(carretera)
    calles.set(tramo.id, carretera)
    crearBordes(tramo, escena)
    pintarFlecha(tramo, escena)
    crearLineaDetencion(tramo, escena)
  }

  for (const id of CRUCES) {
    const n = NODOS[id]!
    const cruce = caja(2, 0.07, 2, 0x303a45)
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
