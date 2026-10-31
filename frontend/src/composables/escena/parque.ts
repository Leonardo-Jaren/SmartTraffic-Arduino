import * as THREE from 'three'
import { materialUrbano, piezaUrbana } from './geometriaUrbana'

/** Banco urbano contemporáneo de madera y acero */
function bancoDiseno(grupo: THREE.Group, x: number, z: number, rot = 0) {
  const matMadera = materialUrbano(0x8a6242, 0.6)
  const matAcero = materialUrbano(0x1a2127, 0.4)
  const b = new THREE.Group()
  piezaUrbana(b, [0.72, 0.045, 0.24], matMadera, [0, 0.38, 0], 0.01)
  piezaUrbana(b, [0.72, 0.16, 0.04], matMadera, [0, 0.52, -0.1], 0.01)
  for (const dx of [-0.28, 0.28]) {
    piezaUrbana(b, [0.045, 0.22, 0.22], matAcero, [dx, 0.27, 0])
    piezaUrbana(b, [0.045, 0.3, 0.04], matAcero, [dx, 0.44, -0.1])
  }
  b.position.set(x, 0, z)
  b.rotation.y = rot
  grupo.add(b)
}

/** Árbol arquitectónico estilizado con alcorque de fundición y copa multi-volumen */
export function crearArbolRealista(x: number, z: number, tono = 0x2e6f40) {
  const grupo = new THREE.Group()

  // Alcorque metálico circular en el pavimento
  const alcorque = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.03, 16),
    materialUrbano(0x222a30, 0.6),
  )
  alcorque.position.set(0, 0.23, 0)
  grupo.add(alcorque)

  // Tierra interior
  const tierra = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.032, 14),
    materialUrbano(0x3a2e24, 0.9),
  )
  tierra.position.set(0, 0.235, 0)
  grupo.add(tierra)

  // Tronco de madera natural
  const tronco = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.075, 0.9, 10),
    materialUrbano(0x4a3b32, 0.7),
  )
  tronco.position.y = 0.68
  tronco.castShadow = true
  grupo.add(tronco)

  // Follaje arquitectónico multicapa
  const matHojas1 = materialUrbano(tono, 0.65)
  const matHojas2 = materialUrbano(tono + 0x101a08, 0.65)
  for (const [dx, dy, dz, radio, mat] of [
    [0, 1.35, 0, 0.44, matHojas1],
    [-0.14, 1.58, 0.08, 0.32, matHojas2],
    [0.15, 1.54, -0.06, 0.34, matHojas1],
    [0, 1.78, 0, 0.26, matHojas2],
  ] as const) {
    const copa = new THREE.Mesh(new THREE.DodecahedronGeometry(radio, 1), mat)
    copa.position.set(dx, dy, dz)
    copa.castShadow = true
    grupo.add(copa)
  }

  grupo.position.set(x, 0, z)
  return grupo
}

/** Fuente ornamental circular de piedra tallada con pileta y surtidor central */
function crearFuenteParque(parque: THREE.Group) {
  const matPiedraClara = materialUrbano(0xe6ebf0, 0.45)
  const matPiedraBorde = materialUrbano(0xd5dde5, 0.4)
  const matAgua = new THREE.MeshStandardMaterial({
    color: 0x3ab8e6,
    roughness: 0.12,
    metalness: 0.15,
    transparent: true,
    opacity: 0.9,
  })

  // 1. Zócalo / base circular exterior en pavimento
  const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.05, 0.03, 28), matPiedraClara)
  zocalo.position.set(0, 0.24, 0)
  parque.add(zocalo)

  // 2. Brocal / Muro exterior de la pileta
  const brocal = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.88, 0.14, 28), matPiedraBorde)
  brocal.position.set(0, 0.31, 0)
  brocal.castShadow = true
  parque.add(brocal)

  // 3. Lámina de agua interior (bien contenida dentro del brocal a Y=0.35)
  const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.02, 28), matAgua)
  agua.position.set(0, 0.35, 0)
  parque.add(agua)

  // 4. Pedestal central de piedra esculpida de dos cuerpos
  const pedestalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.2, 16), matPiedraClara)
  pedestalBase.position.set(0, 0.42, 0)
  pedestalBase.castShadow = true

  const pedestalFuste = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.18, 16), matPiedraClara)
  pedestalFuste.position.set(0, 0.55, 0)
  pedestalFuste.castShadow = true
  parque.add(pedestalBase, pedestalFuste)

  // 5. Taza / Copa superior de la fuente
  const copa = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.12, 0.08, 20), matPiedraBorde)
  copa.position.set(0, 0.65, 0)
  copa.castShadow = true

  const aguaSuperior = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.015, 20), matAgua)
  aguaSuperior.position.set(0, 0.68, 0)
  parque.add(copa, aguaSuperior)

  // 6. Surtidor / chorro de agua cristalina central redondeado
  const surtidor = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 14, 10),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    }),
  )
  surtidor.scale.set(0.8, 1.5, 0.8)
  surtidor.position.set(0, 0.74, 0)
  parque.add(surtidor)

  // 7. Jardineras decorativas en las 4 esquinas intermedias del cruce
  const matJardinera = materialUrbano(0xd5dde5, 0.5)
  const matTierra = materialUrbano(0x3a2d24, 0.9)
  const coloresFlores = [0xd32f2f, 0xfbc02d, 0x8e24aa, 0xffffff] as const
  let idxFlor = 0

  for (const [jx, jz] of [
    [-0.88, -0.88],
    [0.88, -0.88],
    [-0.88, 0.88],
    [0.88, 0.88],
  ] as const) {
    const vasija = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.12, 12), matJardinera)
    vasija.position.set(jx, 0.28, jz)
    vasija.castShadow = true

    const tierraFlor = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.02, 12), matTierra)
    tierraFlor.position.set(jx, 0.33, jz)

    const florColor = coloresFlores[idxFlor % coloresFlores.length] ?? 0xd32f2f
    idxFlor++
    const flores = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.09, 1),
      materialUrbano(florColor, 0.7),
    )
    flores.position.set(jx, 0.38, jz)
    parque.add(vasija, tierraFlor, flores)
  }
}

/** Gran plaza central con fuente ornamental y arboleda */
export function crearParque(escena: THREE.Group) {
  const parque = new THREE.Group()

  // Bordillo exterior de granito
  piezaUrbana(parque, [3.84, 0.06, 5.24], materialUrbano(0xd0d8de), [0, 0.2, 0], 0.04)

  // Pavimento de plaza en losas de hormigón arquitectónico
  piezaUrbana(parque, [3.6, 0.035, 5.0], materialUrbano(0xdde3e8), [0, 0.22, 0], 0.02)

  // Cuadrantes de césped ajardinado
  const matCesped = materialUrbano(0x2d7538, 0.82)
  for (const [px, pz] of [
    [-1.15, -1.5],
    [1.15, -1.5],
    [-1.15, 1.5],
    [1.15, 1.5],
  ] as const) {
    const prado = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.03, 1.55), matCesped)
    prado.position.set(px, 0.24, pz)
    parque.add(prado)
  }

  // Fuente ornamental escultórica en el centro de la plaza (sin parpadeos)
  crearFuenteParque(parque)

  // Bancos de diseño alrededor de la plaza
  bancoDiseno(parque, -1.15, 0, Math.PI / 2)
  bancoDiseno(parque, 1.15, 0, -Math.PI / 2)
  bancoDiseno(parque, 0, -1.2, 0)
  bancoDiseno(parque, 0, 1.2, Math.PI)

  // Árboles en los cuatro rincones del parque
  for (const [ax, az, tono] of [
    [-1.25, -1.8, 0x2c6e3b],
    [1.25, -1.8, 0x367f47],
    [-1.25, 1.8, 0x337b43],
    [1.25, 1.8, 0x2d733e],
  ] as const) {
    parque.add(crearArbolRealista(ax, az, tono))
  }

  parque.position.set(3, 0, 0)
  escena.add(parque)
}
