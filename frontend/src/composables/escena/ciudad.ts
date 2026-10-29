import * as THREE from 'three'
import { crearEdificio, type EdificioUrbano } from './edificios'
import { materialUrbano, piezaUrbana } from './geometriaUrbana'

function caja(
  grupo: THREE.Group,
  ancho: number,
  alto: number,
  fondo: number,
  color: number,
  posicion: [number, number, number],
  radio = 0,
) {
  return piezaUrbana(grupo, [ancho, alto, fondo], materialUrbano(color), posicion, radio)
}

function crearArbol(x: number, z: number, tono = 0x408260) {
  const grupo = new THREE.Group()
  caja(grupo, 0.73, 0.17, 0.73, 0xb9b6a8, [0, 0.28, 0], 0.07)
  caja(grupo, 0.61, 0.12, 0.61, 0x71835e, [0, 0.41, 0], 0.06)
  const tronco = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 0.65, 9), materialUrbano(0x79593e))
  tronco.position.y = 0.78
  grupo.add(tronco)
  for (const [dx, dy, dz, radio, color] of [
    [0, 1.13, 0, 0.42, tono],
    [-0.18, 1.36, 0.05, 0.29, tono + 0x101008],
    [0.18, 1.32, -0.08, 0.31, tono - 0x080500],
  ] as const) {
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(radio, 1), materialUrbano(color))
    copa.position.set(dx, dy, dz)
    copa.scale.set(1, 0.94, 0.92)
    copa.userData.proyectaSombra = true
    grupo.add(copa)
  }
  grupo.position.set(x, 0, z)
  return grupo
}

function crearFarola(x: number, z: number, rotacion: number) {
  const grupo = new THREE.Group()
  const metal = materialUrbano(0x39464a, 0.38)
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.65, 10), metal)
  poste.position.y = 1.02
  grupo.add(poste)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.77, 0),
    new THREE.Vector3(0, 1.91, 0),
    new THREE.Vector3(0.18, 1.98, 0),
    new THREE.Vector3(0.34, 1.94, 0),
  ])
  grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 8, 0.035, 8), metal))
  const tulipa = caja(grupo, 0.25, 0.11, 0.18, 0xe6d59e, [0.36, 1.89, 0], 0.05)
  ;(tulipa.material as THREE.MeshStandardMaterial).emissive.setHex(0x7d673b)
  grupo.position.set(x, 0.2, z)
  grupo.rotation.y = rotacion
  return grupo
}

function banco(grupo: THREE.Group, x: number, z: number, frente = 1) {
  caja(grupo, 0.66, 0.07, 0.24, 0x946c4c, [x, 0.43, z], 0.02)
  caja(grupo, 0.66, 0.18, 0.045, 0x946c4c, [x, 0.58, z - frente * 0.13], 0.02)
  for (const lado of [-1, 1]) {
    caja(grupo, 0.045, 0.23, 0.22, 0x596c62, [x + lado * 0.24, 0.32, z])
    caja(grupo, 0.045, 0.3, 0.045, 0x596c62, [x + lado * 0.24, 0.5, z - frente * 0.13])
  }
}

function crearParque(escena: THREE.Group) {
  const parque = new THREE.Group()
  // El espacio entre los bordes de V2 y V3 es x=1..5; todo el parque cabe dentro.
  caja(parque, 3.8, 0.065, 5.2, 0xd7d2be, [0, 0.2, 0], 0.08)
  caja(parque, 3.56, 0.025, 4.94, 0x8ebc8c, [0, 0.245, 0], 0.055)
  caja(parque, 3.6, 0.03, 0.32, 0xe3ddca, [0, 0.265, 0], 0.02)
  caja(parque, 0.32, 0.03, 5, 0xe3ddca, [0, 0.266, 0], 0.02)
  const baseFuente = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.57, 0.19, 24), materialUrbano(0xddd8c7, 0.45))
  baseFuente.position.set(0, 0.36, 0)
  parque.add(baseFuente)
  const agua = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.025, 24), materialUrbano(0x67b7c4, 0.15))
  agua.position.set(0, 0.46, 0)
  parque.add(agua)
  const borde = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.05, 8, 32), materialUrbano(0xf0e9d6, 0.42))
  borde.rotation.x = Math.PI / 2
  borde.position.y = 0.47
  parque.add(borde)
  const surtidor = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.13, 0.25, 16), materialUrbano(0xc5c9bd, 0.42))
  surtidor.position.set(0, 0.6, 0)
  parque.add(surtidor)
  for (const [x, z, tono] of [
    [-1.34, -1.8, 0x3c805d],
    [1.34, -1.8, 0x4b8963],
    [-1.34, 1.8, 0x4a8a62],
    [1.34, 1.8, 0x3f7c59],
  ] as const)
    parque.add(crearArbol(x, z, tono))
  for (const x of [-1.15, 1.15]) {
    banco(parque, x, -0.68, 1)
    banco(parque, x, 0.68, -1)
  }
  parque.position.set(3, 0, 0)
  escena.add(parque)
}

function crearJardinesLaterales(escena: THREE.Group) {
  for (const z of [-6.5, 0, 6.5]) {
    const jardin = new THREE.Group()
    caja(jardin, 2.05, 0.05, z === 0 ? 3.4 : 1.7, 0xd5d4ba, [0, 0.18, 0], 0.09)
    caja(jardin, 1.88, 0.025, z === 0 ? 3.2 : 1.52, 0x82ab7d, [0, 0.218, 0], 0.075)
    jardin.add(crearArbol(-0.28, z === 0 ? 0.9 : -0.22, 0x51865a))
    banco(jardin, 0.44, z === 0 ? -1.03 : 0.36)
    jardin.position.set(-8.65, 0, z)
    escena.add(jardin)
  }
}

export function crearCiudad(escena: THREE.Group) {
  const edificios: EdificioUrbano[] = [
    {
      nombre: 'PANADERÍA',
      x: -3,
      z: -6.2,
      ancho: 2.3,
      fondo: 1.75,
      alto: 1.7,
      giro: 0,
      pared: 0xe6c8a0,
      acento: 0xb96e4b,
      cubierta: 'tejas',
    },
    {
      nombre: 'CAFÉ',
      x: 3,
      z: -6.2,
      ancho: 2.3,
      fondo: 1.75,
      alto: 1.5,
      giro: 0,
      pared: 0xd6e1ce,
      acento: 0x4d8981,
      cubierta: 'pergola',
    },
    {
      nombre: 'MERCADO',
      x: 8,
      z: -6.2,
      ancho: 1.72,
      fondo: 1.5,
      alto: 1.8,
      giro: -Math.PI / 2,
      pared: 0xe9d5aa,
      acento: 0x8e7e48,
      cubierta: 'terraza',
    },
    {
      nombre: 'LIBRERÍA',
      x: -3,
      z: 0,
      ancho: 2.25,
      fondo: 2,
      alto: 2.1,
      giro: Math.PI / 2,
      pared: 0xc4d5da,
      acento: 0x526d83,
      cubierta: 'terraza',
      escalonado: true,
    },
    {
      nombre: 'FARMACIA',
      x: 8,
      z: 0,
      ancho: 1.72,
      fondo: 1.5,
      alto: 1.8,
      giro: -Math.PI / 2,
      pared: 0xdbe2d3,
      acento: 0x4b7b65,
      cubierta: 'terraza',
    },
    {
      nombre: 'TALLER',
      x: -3,
      z: 6.2,
      ancho: 2.3,
      fondo: 1.75,
      alto: 1.5,
      giro: Math.PI,
      pared: 0xd2c7b8,
      acento: 0x576a77,
      cubierta: 'tejas',
    },
    {
      nombre: 'VECINDAD',
      x: 3,
      z: 6.2,
      ancho: 2.3,
      fondo: 1.75,
      alto: 2.05,
      giro: Math.PI,
      pared: 0xe2bd9b,
      acento: 0x956544,
      cubierta: 'pergola',
      escalonado: true,
    },
    {
      nombre: 'COMIDAS',
      x: 8,
      z: 6.2,
      ancho: 1.72,
      fondo: 1.5,
      alto: 1.65,
      giro: -Math.PI / 2,
      pared: 0xe6d8bc,
      acento: 0xaf664b,
      cubierta: 'tejas',
    },
  ]
  edificios.forEach((datos) => escena.add(crearEdificio(datos)))
  crearParque(escena)
  crearJardinesLaterales(escena)
  for (const z of [-5.5, 0, 5.5]) escena.add(crearFarola(-8.6, z, -Math.PI / 2))
  escena.add(crearFarola(7.2, -2.5, Math.PI))
  escena.add(crearFarola(7.2, 2.5, Math.PI))
}
