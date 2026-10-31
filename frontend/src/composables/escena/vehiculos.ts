import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function piezaRedondeada(
  grupo: THREE.Group,
  tamano: [number, number, number],
  material: THREE.Material,
  posicion: [number, number, number],
  radio = 0.045,
) {
  const malla = new THREE.Mesh(new RoundedBoxGeometry(...tamano, 3, radio), material)
  malla.position.set(...posicion)
  malla.castShadow = true
  malla.userData.proyectaSombra = true
  grupo.add(malla)
  return malla
}

function crearCabina(grupo: THREE.Group, cristal: THREE.Material, carroceria: THREE.Material) {
  // Habitáculo acristalado aerodinámico
  const vertices = [
    [-0.33, 0.44, -0.52],
    [0.33, 0.44, -0.52],
    [0.33, 0.44, 0.38],
    [-0.33, 0.44, 0.38],
    [-0.27, 0.73, -0.34],
    [0.27, 0.73, -0.34],
    [0.27, 0.73, 0.12],
    [-0.27, 0.73, 0.12],
  ]
  const caras = [
    [3, 2, 6, 7], // Parabrisas delantero
    [1, 0, 4, 5], // Luna trasera
    [2, 1, 5, 6], // Ventanilla derecha
    [0, 3, 7, 4], // Ventanilla izquierda
    [4, 7, 6, 5], // Techo
  ]
  const posiciones = caras.flatMap(([a, b, c, d]) => [a, b, c, a, c, d].flatMap((i) => vertices[i!]!))
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3))
  geometria.computeVertexNormals()
  const cabinaMesh = new THREE.Mesh(geometria, cristal)
  cabinaMesh.castShadow = true
  grupo.add(cabinaMesh)

  // Pilares estructurales de la carrocería (A, B y C)
  for (const lado of [-1, 1]) {
    for (const [baseZ, techoZ] of [
      [0.38, 0.12],
      [-0.1, -0.1],
      [-0.52, -0.34],
    ]) {
      const inicio = new THREE.Vector3(lado * 0.33, 0.44, baseZ)
      const fin = new THREE.Vector3(lado * 0.27, 0.73, techoZ)
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, inicio.distanceTo(fin), 8), carroceria)
      pilar.position.copy(inicio).add(fin).multiplyScalar(0.5)
      pilar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fin.sub(inicio).normalize())
      pilar.castShadow = true
      grupo.add(pilar)
    }
  }

  // Techo estilizado con relieve
  piezaRedondeada(grupo, [0.58, 0.065, 0.52], carroceria, [0, 0.74, -0.11], 0.025)
}

export function crearVehiculo(color: number) {
  const grupo = new THREE.Group()

  const carroceria = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.28,
    roughness: 0.24,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  })

  const cristal = new THREE.MeshPhysicalMaterial({
    color: 0x223644,
    metalness: 0.3,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  })

  const caucho = new THREE.MeshStandardMaterial({ color: 0x181c1f, roughness: 0.88 })
  const metalRin = new THREE.MeshStandardMaterial({ color: 0xdde4e8, metalness: 0.85, roughness: 0.22 })
  const negroMoldura = new THREE.MeshStandardMaterial({ color: 0x1c2429, roughness: 0.6 })
  const faro = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4db,
    emissiveIntensity: 0.45,
    roughness: 0.18,
  })
  const freno = new THREE.MeshStandardMaterial({
    color: 0xdd2020,
    emissive: 0x880e0e,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  })

  // 1. Chasis y cuerpo inferior estilizado
  piezaRedondeada(grupo, [0.84, 0.26, 1.54], carroceria, [0, 0.32, 0], 0.09)

  // Capó descendente y faldones laterales
  piezaRedondeada(grupo, [0.74, 0.11, 0.52], carroceria, [0, 0.44, 0.48], 0.06)
  piezaRedondeada(grupo, [0.72, 0.12, 0.36], carroceria, [0, 0.44, -0.57], 0.06)

  // Molduras protectoras / pasarruedas (wheel arches)
  for (const lado of [-1, 1]) {
    for (const z of [-0.49, 0.49]) {
      piezaRedondeada(grupo, [0.055, 0.15, 0.44], negroMoldura, [lado * 0.42, 0.26, z], 0.025)
    }
    // Espejos retrovisores
    piezaRedondeada(grupo, [0.065, 0.055, 0.095], carroceria, [lado * 0.45, 0.53, 0.28], 0.02)
    piezaRedondeada(grupo, [0.04, 0.035, 0.08], negroMoldura, [lado * 0.45, 0.53, 0.27], 0.015)
  }

  // 2. Cabina con cristales
  crearCabina(grupo, cristal, carroceria)

  // 3. Ruedas detalladas (llantas de aleación con neumáticos de goma alineados al eje X)
  const radioRueda = 0.19
  const anchoNeumatico = 0.13
  const ruedaGeom = new THREE.CylinderGeometry(radioRueda, radioRueda, anchoNeumatico, 24)
  ruedaGeom.rotateZ(Math.PI / 2)

  const rinGeom = new THREE.CylinderGeometry(0.12, 0.12, anchoNeumatico + 0.006, 20)
  rinGeom.rotateZ(Math.PI / 2)

  const centroGeom = new THREE.CylinderGeometry(0.042, 0.042, anchoNeumatico + 0.015, 16)
  centroGeom.rotateZ(Math.PI / 2)

  // Radios de la llanta
  const rayo1 = new THREE.BoxGeometry(anchoNeumatico + 0.01, 0.022, 0.2)
  const rayo2 = rayo1.clone().rotateX(Math.PI / 3)
  const rayo3 = rayo1.clone().rotateX(-Math.PI / 3)
  const radiosGeom = mergeGeometries([rayo1, rayo2, rayo3])!
  rayo1.dispose()
  rayo2.dispose()
  rayo3.dispose()

  const ruedas: THREE.Group[] = []
  for (const x of [-0.41, 0.41]) {
    for (const z of [-0.49, 0.49]) {
      const conjunto = new THREE.Group()
      conjunto.position.set(x, radioRueda, z)

      const neumatico = new THREE.Mesh(ruedaGeom, caucho)
      neumatico.castShadow = true
      neumatico.userData.proyectaSombra = true
      conjunto.add(neumatico)

      const llantaMetalica = new THREE.Mesh(rinGeom, metalRin)
      conjunto.add(llantaMetalica)

      const dibujoRadios = new THREE.Mesh(radiosGeom, metalRin)
      conjunto.add(dibujoRadios)

      const tapon = new THREE.Mesh(centroGeom, negroMoldura)
      conjunto.add(tapon)

      grupo.add(conjunto)
      ruedas.push(conjunto)
    }
  }

  // 4. Parachoques y parrilla delantera
  piezaRedondeada(grupo, [0.76, 0.08, 0.06], negroMoldura, [0, 0.19, 0.78], 0.02)
  piezaRedondeada(grupo, [0.38, 0.07, 0.04], negroMoldura, [0, 0.28, 0.8], 0.015)
  // Rejilla central
  for (let i = -1; i <= 1; i++) {
    piezaRedondeada(grupo, [0.32, 0.014, 0.02], metalRin, [0, 0.28 + i * 0.024, 0.812], 0.006)
  }

  // Parachoques y difusor trasero
  piezaRedondeada(grupo, [0.76, 0.08, 0.06], negroMoldura, [0, 0.2, -0.78], 0.02)
  piezaRedondeada(grupo, [0.32, 0.05, 0.03], metalRin, [0, 0.18, -0.795], 0.012)

  // Faros delanteros (blancos brillantes)
  for (const x of [-0.28, 0.28]) {
    piezaRedondeada(grupo, [0.18, 0.075, 0.05], faro, [x, 0.36, 0.79], 0.028)
  }

  // Pilotos traseros (rojos emisivos)
  for (const x of [-0.28, 0.28]) {
    piezaRedondeada(grupo, [0.18, 0.075, 0.05], freno, [x, 0.36, -0.79], 0.025)
  }

  grupo.userData.ruedas = ruedas
  grupo.userData.lucesFreno = freno
  return grupo
}

export function animarVehiculo(grupo: THREE.Group, distancia: number, detenido: boolean) {
  const ruedas = grupo.userData.ruedas as THREE.Group[]
  const radio = 0.19
  const giroX = distancia / radio
  ruedas.forEach((rueda) => {
    // Giro puro sobre el eje horizontal de la rueda (X), sin acoplamiento Euler vertical
    rueda.rotation.x += giroX
  })
  const frenos = grupo.userData.lucesFreno as THREE.MeshStandardMaterial
  frenos.emissiveIntensity = detenido ? 1.5 : 0.35
}
