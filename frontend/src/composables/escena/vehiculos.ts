import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function piezaRedondeada(
  grupo: THREE.Group,
  tamano: [number, number, number],
  material: THREE.Material,
  posicion: [number, number, number],
  radio = 0.03,
) {
  const malla = new THREE.Mesh(new RoundedBoxGeometry(...tamano, 3, radio), material)
  malla.position.set(...posicion)
  malla.castShadow = true
  malla.userData.proyectaSombra = true
  grupo.add(malla)
  return malla
}

function crearCabina(grupo: THREE.Group, cristal: THREE.Material, carroceria: THREE.Material) {
  // Habitáculo acristalado estilizado proporcionado a la escala de la maqueta
  const vertices = [
    [-0.23, 0.3, -0.36],
    [0.23, 0.3, -0.36],
    [0.23, 0.3, 0.26],
    [-0.23, 0.3, 0.26],
    [-0.19, 0.5, -0.24],
    [0.19, 0.5, -0.24],
    [0.19, 0.5, 0.08],
    [-0.19, 0.5, 0.08],
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

  // Pilares A, B y C de la carrocería
  for (const lado of [-1, 1]) {
    for (const [baseZ, techoZ] of [
      [0.26, 0.08],
      [-0.07, -0.07],
      [-0.36, -0.24],
    ]) {
      const inicio = new THREE.Vector3(lado * 0.23, 0.3, baseZ)
      const fin = new THREE.Vector3(lado * 0.19, 0.5, techoZ)
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.016, inicio.distanceTo(fin), 8), carroceria)
      pilar.position.copy(inicio).add(fin).multiplyScalar(0.5)
      pilar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fin.sub(inicio).normalize())
      pilar.castShadow = true
      grupo.add(pilar)
    }
  }

  // Techo estilizado
  piezaRedondeada(grupo, [0.4, 0.045, 0.36], carroceria, [0, 0.51, -0.08], 0.02)
}

export function crearVehiculo(color: number) {
  const grupo = new THREE.Group()

  const carroceria = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.3,
    roughness: 0.22,
    clearcoat: 0.85,
    clearcoatRoughness: 0.15,
  })

  const cristal = new THREE.MeshPhysicalMaterial({
    color: 0x1e303c,
    metalness: 0.35,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  })

  const caucho = new THREE.MeshStandardMaterial({ color: 0x181c1f, roughness: 0.9 })
  const metalRin = new THREE.MeshStandardMaterial({ color: 0xdde4e8, metalness: 0.85, roughness: 0.22 })
  const negroMoldura = new THREE.MeshStandardMaterial({ color: 0x1a2126, roughness: 0.65 })
  const faro = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff4db,
    emissiveIntensity: 0.5,
    roughness: 0.18,
  })
  const freno = new THREE.MeshStandardMaterial({
    color: 0xdd2020,
    emissive: 0x880e0e,
    emissiveIntensity: 0.35,
    roughness: 0.2,
  })

  // 1. Chasis y cuerpo inferior estilizado (proporcionado para una maqueta de 160×120 cm)
  piezaRedondeada(grupo, [0.55, 0.18, 1.1], carroceria, [0, 0.22, 0], 0.05)

  // Capó descendente y maletero
  piezaRedondeada(grupo, [0.48, 0.075, 0.35], carroceria, [0, 0.3, 0.35], 0.04)
  piezaRedondeada(grupo, [0.48, 0.08, 0.25], carroceria, [0, 0.3, -0.41], 0.04)

  // Molduras laterales y espejos retrovisores
  for (const lado of [-1, 1]) {
    for (const z of [-0.34, 0.34]) {
      piezaRedondeada(grupo, [0.038, 0.11, 0.3], negroMoldura, [lado * 0.28, 0.18, z], 0.018)
    }
    // Espejos retrovisores
    piezaRedondeada(grupo, [0.045, 0.038, 0.065], carroceria, [lado * 0.3, 0.36, 0.19], 0.015)
    piezaRedondeada(grupo, [0.025, 0.024, 0.055], negroMoldura, [lado * 0.3, 0.36, 0.18], 0.01)
  }

  // 2. Cabina aerodinámica
  crearCabina(grupo, cristal, carroceria)

  // 3. Ruedas detalladas (llantas de aleación y neumáticos de goma)
  const radioRueda = 0.13
  const anchoNeumatico = 0.09
  const ruedaGeom = new THREE.CylinderGeometry(radioRueda, radioRueda, anchoNeumatico, 20)
  ruedaGeom.rotateZ(Math.PI / 2)

  const rinGeom = new THREE.CylinderGeometry(0.085, 0.085, anchoNeumatico + 0.005, 18)
  rinGeom.rotateZ(Math.PI / 2)

  const centroGeom = new THREE.CylinderGeometry(0.03, 0.03, anchoNeumatico + 0.01, 14)
  centroGeom.rotateZ(Math.PI / 2)

  // Radios de la llanta
  const rayo1 = new THREE.BoxGeometry(anchoNeumatico + 0.008, 0.016, 0.14)
  const rayo2 = rayo1.clone().rotateX(Math.PI / 3)
  const rayo3 = rayo1.clone().rotateX(-Math.PI / 3)
  const radiosGeom = mergeGeometries([rayo1, rayo2, rayo3])!
  rayo1.dispose()
  rayo2.dispose()
  rayo3.dispose()

  const ruedas: THREE.Group[] = []
  for (const x of [-0.27, 0.27]) {
    for (const z of [-0.34, 0.34]) {
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

  // 4. Parachoques delantero y parrilla
  piezaRedondeada(grupo, [0.52, 0.06, 0.04], negroMoldura, [0, 0.14, 0.56], 0.015)
  piezaRedondeada(grupo, [0.26, 0.05, 0.03], negroMoldura, [0, 0.21, 0.575], 0.01)

  // Parachoques y difusor trasero
  piezaRedondeada(grupo, [0.52, 0.06, 0.04], negroMoldura, [0, 0.15, -0.56], 0.015)
  piezaRedondeada(grupo, [0.22, 0.04, 0.025], metalRin, [0, 0.13, -0.57], 0.01)

  // Faros delanteros
  for (const x of [-0.19, 0.19]) {
    piezaRedondeada(grupo, [0.12, 0.05, 0.03], faro, [x, 0.26, 0.565], 0.018)
  }

  // Pilotos traseros
  for (const x of [-0.19, 0.19]) {
    piezaRedondeada(grupo, [0.12, 0.05, 0.03], freno, [x, 0.26, -0.565], 0.018)
  }

  grupo.userData.ruedas = ruedas
  grupo.userData.lucesFreno = freno
  return grupo
}

export function animarVehiculo(grupo: THREE.Group, distancia: number, detenido: boolean) {
  const ruedas = grupo.userData.ruedas as THREE.Group[]
  const radio = 0.13
  const giroX = distancia / radio
  ruedas.forEach((rueda) => {
    // Giro fluido sobre el eje horizontal de la rueda (X)
    rueda.rotation.x += giroX
  })
  const frenos = grupo.userData.lucesFreno as THREE.MeshStandardMaterial
  frenos.emissiveIntensity = detenido ? 1.6 : 0.35
}
