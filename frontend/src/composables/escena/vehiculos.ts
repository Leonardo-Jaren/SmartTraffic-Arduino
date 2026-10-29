import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function crearCabina(grupo: THREE.Group, cristal: THREE.Material, carroceria: THREE.Material) {
  const vertices = [
    [-0.32, 0.43, -0.5],
    [0.32, 0.43, -0.5],
    [0.32, 0.43, 0.38],
    [-0.32, 0.43, 0.38],
    [-0.26, 0.72, -0.33],
    [0.26, 0.72, -0.33],
    [0.26, 0.72, 0.12],
    [-0.26, 0.72, 0.12],
  ]
  const caras = [
    [3, 2, 6, 7],
    [1, 0, 4, 5],
    [2, 1, 5, 6],
    [0, 3, 7, 4],
    [4, 7, 6, 5],
  ]
  const posiciones = caras.flatMap(([a, b, c, d]) => [a, b, c, a, c, d].flatMap((i) => vertices[i!]!))
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3))
  geometria.computeVertexNormals()
  grupo.add(new THREE.Mesh(geometria, cristal))
  for (const lado of [-1, 1]) {
    for (const [baseZ, techoZ] of [
      [0.38, 0.12],
      [-0.5, -0.33],
      [-0.1, -0.1],
    ]) {
      const inicio = new THREE.Vector3(lado * 0.32, 0.44, baseZ)
      const fin = new THREE.Vector3(lado * 0.26, 0.72, techoZ)
      const soporte = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, inicio.distanceTo(fin), 8), carroceria)
      soporte.position.copy(inicio).add(fin).multiplyScalar(0.5)
      soporte.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fin.sub(inicio).normalize())
      grupo.add(soporte)
    }
  }
  piezaRedondeada(grupo, [0.57, 0.07, 0.5], carroceria, [0, 0.735, -0.105], 0.03)
}

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

export function crearVehiculo(color: number) {
  const grupo = new THREE.Group()
  const carroceria = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.24,
    roughness: 0.27,
    clearcoat: 0.75,
    clearcoatRoughness: 0.2,
  })
  const cristal = new THREE.MeshPhysicalMaterial({
    color: 0x385665,
    metalness: 0.2,
    roughness: 0.16,
    clearcoat: 0.9,
    clearcoatRoughness: 0.1,
  })
  const caucho = new THREE.MeshStandardMaterial({ color: 0x172024, roughness: 0.82 })
  const metal = new THREE.MeshStandardMaterial({ color: 0xb7c2c1, metalness: 0.78, roughness: 0.25 })
  const negro = new THREE.MeshStandardMaterial({ color: 0x192329, roughness: 0.48 })
  const faro = new THREE.MeshStandardMaterial({
    color: 0xfff0b7,
    emissive: 0xffcf65,
    emissiveIntensity: 0.22,
    roughness: 0.22,
  })
  const freno = new THREE.MeshStandardMaterial({ color: 0xe34e48, emissive: 0x7d1516, emissiveIntensity: 0.28 })

  // Silueta de hatchback: capó, cabina inclinada y parte trasera reconocible.
  piezaRedondeada(grupo, [0.82, 0.3, 1.56], carroceria, [0, 0.31, 0], 0.12)
  piezaRedondeada(grupo, [0.72, 0.12, 0.49], carroceria, [0, 0.45, 0.48], 0.07)
  piezaRedondeada(grupo, [0.7, 0.13, 0.34], carroceria, [0, 0.45, -0.57], 0.07)
  crearCabina(grupo, cristal, carroceria)

  for (const lado of [-1, 1]) {
    piezaRedondeada(grupo, [0.055, 0.06, 0.09], carroceria, [lado * 0.44, 0.52, 0.28], 0.025)
    piezaRedondeada(grupo, [0.035, 0.035, 0.13], metal, [lado * 0.414, 0.38, -0.05], 0.014)
    piezaRedondeada(grupo, [0.025, 0.045, 0.11], negro, [lado * 0.419, 0.29, -0.02], 0.012)
  }

  const rueda = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 24, 1)
  const rin = new THREE.CylinderGeometry(0.115, 0.115, 0.025, 20)
  const centro = new THREE.CylinderGeometry(0.045, 0.045, 0.032, 16)
  const barra1 = new THREE.BoxGeometry(0.024, 0.018, 0.19)
  const barra2 = barra1.clone().rotateY(Math.PI / 2)
  const radios = mergeGeometries([barra1, barra2])!
  barra1.dispose()
  barra2.dispose()
  const ruedas: THREE.Group[] = []
  for (const x of [-0.39, 0.39]) {
    for (const z of [-0.49, 0.49]) {
      const conjunto = new THREE.Group()
      conjunto.position.set(x, 0.19, z)
      conjunto.rotation.z = Math.PI / 2
      const neumatico = new THREE.Mesh(rueda, caucho)
      neumatico.castShadow = true
      neumatico.userData.proyectaSombra = true
      conjunto.add(neumatico)
      const exterior = -Math.sign(x) * 0.085
      const ruedaMetalica = new THREE.Mesh(rin, metal)
      ruedaMetalica.position.y = exterior
      conjunto.add(ruedaMetalica)
      const dibujoRadios = new THREE.Mesh(radios, negro)
      dibujoRadios.position.y = exterior - Math.sign(x) * 0.015
      conjunto.add(dibujoRadios)
      const tapon = new THREE.Mesh(centro, negro)
      tapon.position.y = exterior - Math.sign(x) * 0.023
      conjunto.add(tapon)
      grupo.add(conjunto)
      ruedas.push(conjunto)
    }
  }

  piezaRedondeada(grupo, [0.3, 0.105, 0.045], negro, [0, 0.29, 0.806], 0.025)
  piezaRedondeada(grupo, [0.34, 0.045, 0.08], metal, [0, 0.19, 0.79], 0.022)
  piezaRedondeada(grupo, [0.34, 0.04, 0.07], metal, [0, 0.2, -0.79], 0.02)
  for (const x of [-0.27, 0.27]) {
    piezaRedondeada(grupo, [0.18, 0.085, 0.05], faro, [x, 0.37, 0.795], 0.035)
    piezaRedondeada(grupo, [0.16, 0.09, 0.05], freno, [x, 0.37, -0.795], 0.03)
  }
  for (let indice = -1; indice <= 1; indice++) {
    piezaRedondeada(grupo, [0.25, 0.018, 0.025], metal, [0, 0.29 + indice * 0.035, 0.833], 0.008)
  }
  grupo.userData.ruedas = ruedas
  grupo.userData.lucesFreno = freno
  return grupo
}

export function animarVehiculo(grupo: THREE.Group, distancia: number, detenido: boolean) {
  const ruedas = grupo.userData.ruedas as THREE.Group[]
  ruedas.forEach((rueda) => {
    rueda.rotation.y -= distancia / 0.19
  })
  const frenos = grupo.userData.lucesFreno as THREE.MeshStandardMaterial
  frenos.emissiveIntensity = detenido ? 1.1 : 0.28
}
