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

/** Árbol arquitectónico estilizado con alcorque de fundición y copa multi-volumen */
function crearArbolRealista(x: number, z: number, tono = 0x2e6f40) {
  const grupo = new THREE.Group()

  // Alcorque metálico circular en el pavimento
  const alcorque = new THREE.Mesh(
    new THREE.CylinderGeometry(0.38, 0.42, 0.03, 16),
    materialUrbano(0x222a30, 0.6),
  )
  alcorque.position.set(0, 0.23, 0)
  grupo.add(alcorque)

  // Tierra / mantillo interior
  const tierra = new THREE.Mesh(
    new THREE.CylinderGeometry(0.32, 0.32, 0.032, 14),
    materialUrbano(0x3a2e24, 0.9),
  )
  tierra.position.set(0, 0.235, 0)
  grupo.add(tierra)

  // Tronco de madera natural con ahusamiento
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

/** Farola vial LED minimalista con emisión cálida */
function crearFarolaModerna(x: number, z: number, rotacion: number) {
  const grupo = new THREE.Group()
  const metal = materialUrbano(0x222a30, 0.35)
  const matLed = new THREE.MeshStandardMaterial({
    color: 0xfffae6,
    emissive: 0xffecc4,
    emissiveIntensity: 0.9,
    roughness: 0.2,
  })

  // Fuste vertical cilíndrico
  const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.045, 1.65, 10), metal)
  poste.position.y = 1.05
  poste.castShadow = true
  grupo.add(poste)

  // Brazo horizontal en ángulo
  const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.04), metal)
  brazo.position.set(0.18, 1.88, 0)
  grupo.add(brazo)

  // Luminaria LED direccional
  const luminaria = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.035, 0.08), metal)
  luminaria.position.set(0.32, 1.87, 0)
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.06), matLed)
  led.position.set(0.32, 1.85, 0)
  grupo.add(luminaria, led)

  grupo.position.set(x, 0.2, z)
  grupo.rotation.y = rotacion
  return grupo
}

/** Banco urbano contemporáneo de madera y acero */
function bancoDiseno(grupo: THREE.Group, x: number, z: number, rot = 0) {
  const matMadera = materialUrbano(0x8a6242, 0.6)
  const matAcero = materialUrbano(0x1a2127, 0.4)
  const b = new THREE.Group()
  // Asiento y respaldo en lamas de madera
  piezaUrbana(b, [0.72, 0.045, 0.24], matMadera, [0, 0.38, 0], 0.01)
  piezaUrbana(b, [0.72, 0.16, 0.04], matMadera, [0, 0.52, -0.1], 0.01)
  // Patas de acero fundido
  for (const dx of [-0.28, 0.28]) {
    piezaUrbana(b, [0.045, 0.22, 0.22], matAcero, [dx, 0.27, 0])
    piezaUrbana(b, [0.045, 0.3, 0.04], matAcero, [dx, 0.44, -0.1])
  }
  b.position.set(x, 0, z)
  b.rotation.y = rot
  grupo.add(b)
}

/** Gran plaza central con espejo de agua arquitectónico y arboleda */
function crearParque(escena: THREE.Group) {
  const parque = new THREE.Group()

  // Bordillo exterior de granito flambeado
  caja(parque, 3.84, 0.06, 5.24, 0xd0d8de, [0, 0.2, 0], 0.04)

  // Pavimento de plaza en losas de hormigón arquitectónico
  caja(parque, 3.6, 0.035, 5.0, 0xdde3e8, [0, 0.22, 0], 0.02)

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

  // Espejo de agua / estanque central rectangular con brocal de granito negro
  const matGranito = materialUrbano(0x1a2127, 0.35)
  const matAgua = new THREE.MeshPhysicalMaterial({
    color: 0x1d5f75,
    transmission: 0.65,
    roughness: 0.06,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    ior: 1.33,
  })

  // Estanque
  piezaUrbana(parque, [1.55, 0.08, 1.85], matGranito, [0, 0.26, 0], 0.03)
  const laminaAgua = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.02, 1.65), matAgua)
  laminaAgua.position.set(0, 0.29, 0)
  parque.add(laminaAgua)

  // Surtidores de agua verticales iluminados
  const matJet = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x99ddff,
    emissiveIntensity: 0.5,
    roughness: 0.1,
  })
  for (const pz of [-0.4, 0, 0.4]) {
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 0.28, 8), matJet)
    jet.position.set(0, 0.4, pz)
    parque.add(jet)
  }

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

export function crearCiudad(escena: THREE.Group) {
  const edificios: EdificioUrbano[] = [
    {
      nombre: 'CENTRO I+D',
      x: -3,
      z: -6.2,
      ancho: 2.3,
      fondo: 1.85,
      alto: 1.85,
      giro: 0,
      pared: 0xeef2f6,
      acento: 0x2563eb,
      cubierta: 'acanalada',
    },
    {
      nombre: 'TORRE CORPORATIVA',
      x: 3,
      z: -6.2,
      ancho: 2.3,
      fondo: 1.85,
      alto: 2.1,
      giro: 0,
      pared: 0xffffff,
      acento: 0x475569,
      cubierta: 'acanalada',
    },
    {
      nombre: 'HUB CREATIVO',
      x: 8,
      z: -6.2,
      ancho: 1.85,
      fondo: 1.8,
      alto: 1.75,
      giro: -Math.PI / 2,
      pared: 0xf8fafc,
      acento: 0xd97706,
      cubierta: 'acanalada',
    },
    {
      nombre: 'CENTRO FINANCIERO',
      x: -3,
      z: 0,
      ancho: 2.35,
      fondo: 1.95,
      alto: 2.2,
      giro: Math.PI / 2,
      pared: 0xf8fafc,
      acento: 0xb45309,
      cubierta: 'acanalada',
    },
    {
      nombre: 'PABELLÓN CÍVICO',
      x: 8,
      z: 0,
      ancho: 1.85,
      fondo: 1.85,
      alto: 1.9,
      giro: -Math.PI / 2,
      pared: 0xf8fafc,
      acento: 0x7c3aed,
      cubierta: 'acanalada',
    },
    {
      nombre: 'INCUBADORA TECH',
      x: -3,
      z: 6.2,
      ancho: 2.3,
      fondo: 1.85,
      alto: 1.75,
      giro: Math.PI,
      pared: 0xfaf5f0,
      acento: 0xea580c,
      cubierta: 'acanalada',
    },
    {
      nombre: 'TORRE OBSIDIANA',
      x: 3,
      z: 6.2,
      ancho: 2.3,
      fondo: 1.85,
      alto: 2.05,
      giro: Math.PI,
      pared: 0x1e293b,
      acento: 0x0f172a,
      cubierta: 'acanalada',
    },
    {
      nombre: 'CENTRO BIOTECH',
      x: 8,
      z: 6.2,
      ancho: 1.85,
      fondo: 1.85,
      alto: 1.8,
      giro: -Math.PI / 2,
      pared: 0xf1f5f9,
      acento: 0x16a34a,
      cubierta: 'acanalada',
    },
  ]

  edificios.forEach((datos) => escena.add(crearEdificio(datos)))
  crearParque(escena)

  // Alumbrado vial LED en las avenidas
  for (const z of [-5.5, 0, 5.5]) {
    escena.add(crearFarolaModerna(-8.6, z, -Math.PI / 2))
    escena.add(crearFarolaModerna(5.4, z, Math.PI / 2))
  }
}
