import * as THREE from 'three'
import { CRUCES, NODOS, TRAMOS } from '../simulacion/mapa'

function caja(ancho: number, alto: number, fondo: number, color: number) {
  return new THREE.Mesh(new THREE.BoxGeometry(ancho, alto, fondo), new THREE.MeshStandardMaterial({ color }))
}

function crearEdificio(x: number, z: number, color: number, ancho = 2.1, profundidad = 2) {
  const grupo = new THREE.Group()
  const altura = z === 0 ? 1.85 : 1.55
  const edificio = caja(ancho, altura, profundidad, 0xf4f2e9)
  edificio.position.y = 0.2 + altura / 2
  const techo = caja(ancho + 0.16, 0.18, profundidad + 0.16, color)
  techo.position.y = 0.2 + altura + 0.09
  const base = caja(ancho + 0.07, 0.12, profundidad + 0.07, 0xd8ded4)
  base.position.y = 0.25
  grupo.add(base, edificio, techo)
  const terraza = caja(ancho * 0.7, 0.04, profundidad * 0.65, 0xf0ead7)
  terraza.position.y = 0.2 + altura + 0.2
  const ventilacion = caja(0.4, 0.23, 0.35, 0x9baab0)
  ventilacion.position.set(ancho * 0.2, 0.2 + altura + 0.32, -profundidad * 0.15)
  grupo.add(terraza, ventilacion)
  for (let piso = 0; piso < 2; piso++) {
    for (let i = -1; i <= 1; i++) {
      const ventana = caja(0.3, 0.32, 0.035, 0x91afba)
      ventana.position.set(i * ancho * 0.27, 0.6 + piso * 0.62, profundidad / 2 + 0.02)
      grupo.add(ventana)
    }
    for (let i = -1; i <= 1; i++) {
      const ventanaLateral = caja(0.035, 0.32, 0.3, 0x91afba)
      ventanaLateral.position.set(ancho / 2 + 0.02, 0.6 + piso * 0.62, i * profundidad * 0.27)
      grupo.add(ventanaLateral)
    }
  }
  const puerta = caja(0.34, 0.45, 0.04, 0x687f83)
  puerta.position.set(0, 0.45, profundidad / 2 + 0.04)
  grupo.add(puerta)
  const marquesina = caja(0.65, 0.07, 0.36, color)
  marquesina.position.set(0, 0.77, profundidad / 2 + 0.15)
  const jardinera = caja(ancho * 0.75, 0.2, 0.25, 0xb7997b)
  jardinera.position.set(0, 0.3, -profundidad / 2 - 0.2)
  const plantas = caja(ancho * 0.7, 0.15, 0.23, 0x488b60)
  plantas.position.set(0, 0.47, -profundidad / 2 - 0.2)
  grupo.add(marquesina, jardinera, plantas)
  grupo.position.set(x, 0, z)
  return grupo
}

function crearArbol(x: number, z: number) {
  const tronco = caja(0.14, 0.65, 0.14, 0x8e694a)
  tronco.position.set(x, 0.53, z)
  const copa = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x43896a }),
  )
  copa.position.set(x, 1.12, z)
  const copaSuperior = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0x64a97b }),
  )
  copaSuperior.position.set(x - 0.12, 1.4, z - 0.06)
  return [tronco, copa, copaSuperior]
}

function crearBordes(tramo: (typeof TRAMOS)[number], escena: THREE.Scene) {
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

function decorarPlaza(escena: THREE.Scene) {
  const plaza = caja(4.2, 0.04, 5.2, 0x8dc697)
  plaza.position.set(3, 0.19, 0)
  const caminoHorizontal = caja(3.9, 0.02, 0.32, 0xdce2d1)
  caminoHorizontal.position.set(3, 0.225, 0)
  const caminoVertical = caja(0.32, 0.02, 4.9, 0xdce2d1)
  caminoVertical.position.set(3, 0.225, 0)
  const fuente = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.48, 0.18, 20),
    new THREE.MeshStandardMaterial({ color: 0xe4e6d8 }),
  )
  fuente.position.set(3, 0.31, 0)
  const agua = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.03, 20),
    new THREE.MeshStandardMaterial({ color: 0x80c6d4 }),
  )
  agua.position.set(3, 0.42, 0)
  escena.add(plaza, caminoHorizontal, caminoVertical, fuente, agua)
  for (const [x, z] of [
    [1.7, -1.8],
    [4.3, 1.8],
  ] as const) {
    const asiento = caja(0.7, 0.09, 0.23, 0x9b7755)
    asiento.position.set(x, 0.43, z)
    const pata1 = caja(0.07, 0.24, 0.2, 0x718378)
    pata1.position.set(x - 0.26, 0.31, z)
    const pata2 = caja(0.07, 0.24, 0.2, 0x718378)
    pata2.position.set(x + 0.26, 0.31, z)
    escena.add(asiento, pata1, pata2)
  }
}

function pintarFlecha(tramo: (typeof TRAMOS)[number], escena: THREE.Scene) {
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

function crearPaso(x: number, z: number, horizontal: boolean, escena: THREE.Scene) {
  for (let i = -2; i <= 2; i++) {
    const franja = caja(horizontal ? 0.16 : 0.27, 0.02, horizontal ? 0.27 : 0.16, 0xf6f5ed)
    franja.position.set(x + (horizontal ? 0 : i * 0.31), 0.242, z + (horizontal ? i * 0.31 : 0))
    escena.add(franja)
  }
}

export function crearMaqueta(escena: THREE.Scene) {
  const seleccionables: THREE.Object3D[] = []
  const calles = new Map<string, THREE.Mesh>()
  const cruces = new Map<string, THREE.Mesh>()
  const indicadores = new Map<string, { horizontal: THREE.Mesh; vertical: THREE.Mesh }>()
  const base = caja(21, 0.35, 17, 0x6baa78)
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
    carretera.position.set(a.x + dx * (margenA + largo / 2), 0.19, a.z + dz * (margenA + largo / 2))
    carretera.userData = { tipo: 'tramo', id: tramo.id }
    escena.add(carretera)
    seleccionables.push(carretera)
    calles.set(tramo.id, carretera)
    crearBordes(tramo, escena)
    pintarFlecha(tramo, escena)
  }

  for (const id of CRUCES) {
    const n = NODOS[id]!
    const cruce = caja(2, 0.07, 2, 0x303a45)
    cruce.position.set(n.x, 0.195, n.z)
    cruce.userData = { tipo: 'cruce', id }
    escena.add(cruce)
    seleccionables.push(cruce)
    cruces.set(id, cruce)
    crearPaso(n.x - 1.15, n.z, true, escena)
    crearPaso(n.x + 1.15, n.z, true, escena)
    crearPaso(n.x, n.z - 1.15, false, escena)
    crearPaso(n.x, n.z + 1.15, false, escena)
    const horizontal = caja(0.27, 0.12, 0.27, 0x32b575)
    const vertical = caja(0.27, 0.12, 0.27, 0xe45b59)
    horizontal.position.set(n.x + 0.69, 0.29, n.z - 0.68)
    vertical.position.set(n.x - 0.69, 0.29, n.z + 0.68)
    escena.add(horizontal, vertical)
    indicadores.set(id, { horizontal, vertical })
  }

  const edificios: [number, number, number][] = [
    [-3, -6.2, 0xe7c657],
    [3, -6.2, 0x679bc9],
    [8, -6.2, 0xe5c55a],
    [-3, 0, 0xe8d262],
    [8, 0, 0x9b7bbe],
    [-3, 6, 0xe8935a],
    [3, 6, 0x424d53],
    [8, 6, 0xc5da59],
  ]
  edificios.forEach(([x, z, color]) => escena.add(crearEdificio(x, z, color, x === 8 ? 1.7 : 2.2, z === 0 ? 2.4 : 1.6)))
  decorarPlaza(escena)
  for (const [x, z] of [
    [2, -1.5],
    [4, -1],
    [2.2, 1.4],
    [3.9, 1.5],
    [-8, -6],
    [-8, 0],
    [-8, 6],
  ] as const) {
    escena.add(...crearArbol(x, z))
  }
  return { seleccionables, calles, cruces, indicadores }
}
