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
  // Habitáculo acristalado aerodinámico con pilares de soporte
  const vertices = [
    [-0.23, 0.28, -0.36],
    [0.23, 0.28, -0.36],
    [0.23, 0.28, 0.25],
    [-0.23, 0.28, 0.25],
    [-0.19, 0.48, -0.22],
    [0.19, 0.48, -0.22],
    [0.19, 0.48, 0.08],
    [-0.19, 0.48, 0.08],
  ]
  const caras = [
    [3, 2, 6, 7], // Parabrisas delantero
    [1, 0, 4, 5], // Luneta trasera
    [2, 1, 5, 6], // Ventanilla lateral derecha
    [0, 3, 7, 4], // Ventanilla lateral izquierda
    [4, 7, 6, 5], // Techo
  ]
  const posiciones = caras.flatMap(([a, b, c, d]) => [a, b, c, a, c, d].flatMap((i) => vertices[i!]!))
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute('position', new THREE.Float32BufferAttribute(posiciones, 3))
  geometria.computeVertexNormals()
  const cabinaMesh = new THREE.Mesh(geometria, cristal)
  cabinaMesh.castShadow = true
  grupo.add(cabinaMesh)

  // Pilares A, B y C de la estructura
  for (const lado of [-1, 1]) {
    for (const [baseZ, techoZ] of [
      [0.25, 0.08],
      [-0.06, -0.06],
      [-0.36, -0.22],
    ]) {
      const inicio = new THREE.Vector3(lado * 0.23, 0.28, baseZ)
      const fin = new THREE.Vector3(lado * 0.19, 0.48, techoZ)
      const pilar = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, inicio.distanceTo(fin), 8), carroceria)
      pilar.position.copy(inicio).add(fin).multiplyScalar(0.5)
      pilar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fin.sub(inicio).normalize())
      pilar.castShadow = true
      grupo.add(pilar)
    }
  }

  // Techo estilizado con nervios aerodinámicos
  piezaRedondeada(grupo, [0.39, 0.035, 0.34], carroceria, [0, 0.49, -0.07], 0.018)
}

export function crearVehiculo(color: number) {
  const grupo = new THREE.Group()

  // Pintura automotriz metalizada multicapa con barniz de alto brillo
  const carroceria = new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.38,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  })

  // Cristal ahumado con tratamiento de reflexión
  const cristal = new THREE.MeshPhysicalMaterial({
    color: 0x16222c,
    metalness: 0.45,
    roughness: 0.06,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
  })

  const caucho = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.92 })
  const metalRin = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.92, roughness: 0.18 })
  const metalDisco = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.35 })
  const pinzaFreno = new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.4, roughness: 0.3 })
  const negroMoldura = new THREE.MeshStandardMaterial({ color: 0x181e22, roughness: 0.65 })
  const cromo = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.95, roughness: 0.1 })
  const faroLed = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfffbeb,
    emissiveIntensity: 0.85,
    roughness: 0.15,
  })
  const frenoLed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0x991b1b,
    emissiveIntensity: 0.4,
    roughness: 0.2,
  })

  // 1. Chasis y carrocería esculpida (Largo 1.14m, Ancho 0.55m)
  piezaRedondeada(grupo, [0.54, 0.17, 1.1], carroceria, [0, 0.21, 0], 0.04)

  // Capó aerodinámico descendente y tapa del maletero
  piezaRedondeada(grupo, [0.48, 0.07, 0.34], carroceria, [0, 0.28, 0.34], 0.035)
  piezaRedondeada(grupo, [0.47, 0.075, 0.24], carroceria, [0, 0.28, -0.4], 0.035)

  // Molduras laterales, taloneras y retrovisores
  for (const lado of [-1, 1]) {
    // Talonera inferior
    piezaRedondeada(grupo, [0.035, 0.05, 0.66], negroMoldura, [lado * 0.27, 0.14, 0], 0.015)
    // Espejos retrovisores bifaciales
    piezaRedondeada(grupo, [0.045, 0.035, 0.06], carroceria, [lado * 0.29, 0.34, 0.18], 0.012)
    piezaRedondeada(grupo, [0.02, 0.025, 0.05], cristal, [lado * 0.29, 0.34, 0.17], 0.008)
  }

  // 2. Cabina con cristales
  crearCabina(grupo, cristal, carroceria)

  // 3. Ruedas detalladas (Llantas de aleación con discos perforados y pinzas de freno)
  const radioRueda = 0.125
  const anchoNeumatico = 0.085
  const ruedaGeom = new THREE.CylinderGeometry(radioRueda, radioRueda, anchoNeumatico, 22)
  ruedaGeom.rotateZ(Math.PI / 2)

  const rinGeom = new THREE.CylinderGeometry(0.088, 0.088, anchoNeumatico + 0.006, 20)
  rinGeom.rotateZ(Math.PI / 2)

  const discoGeom = new THREE.CylinderGeometry(0.068, 0.068, anchoNeumatico - 0.02, 16)
  discoGeom.rotateZ(Math.PI / 2)

  // Radios estilizados de aleación en estrella de 5 puntas
  const rayo1 = new THREE.BoxGeometry(anchoNeumatico + 0.008, 0.014, 0.15)
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

      // Neumático de goma de bajo perfil
      const neumatico = new THREE.Mesh(ruedaGeom, caucho)
      neumatico.castShadow = true
      neumatico.userData.proyectaSombra = true
      conjunto.add(neumatico)

      // Llanta metálica
      const llantaMetalica = new THREE.Mesh(rinGeom, metalRin)
      conjunto.add(llantaMetalica)

      // Radios de aleación
      const dibujoRadios = new THREE.Mesh(radiosGeom, metalRin)
      conjunto.add(dibujoRadios)

      // Disco de freno visible interior
      const discoFreno = new THREE.Mesh(discoGeom, metalDisco)
      conjunto.add(discoFreno)

      // Pinza de freno roja deportiva
      const pinza = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.04), pinzaFreno)
      pinza.position.set(0, 0.035, 0.035)
      conjunto.add(pinza)

      grupo.add(conjunto)
      ruedas.push(conjunto)
    }
  }

  // 4. Paragolpes delantero, parrilla tridimensional y splitter
  piezaRedondeada(grupo, [0.52, 0.05, 0.04], negroMoldura, [0, 0.13, 0.55], 0.015)
  // Parrilla frontal
  piezaRedondeada(grupo, [0.28, 0.065, 0.03], negroMoldura, [0, 0.2, 0.565], 0.01)
  // Embellecedor cromado de la parrilla
  piezaRedondeada(grupo, [0.26, 0.012, 0.02], cromo, [0, 0.2, 0.575], 0.005)

  // Ópticas LED delanteras con ceja de luz diurna
  for (const x of [-0.18, 0.18]) {
    piezaRedondeada(grupo, [0.13, 0.045, 0.03], faroLed, [x, 0.25, 0.555], 0.015)
  }

  // Paragolpes trasero con difusor aerodinámico y salidas de escape cromadas
  piezaRedondeada(grupo, [0.52, 0.05, 0.04], negroMoldura, [0, 0.14, -0.55], 0.015)
  for (const x of [-0.14, 0.14]) {
    const escape = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.03, 10), cromo)
    escape.rotation.x = Math.PI / 2
    escape.position.set(x, 0.13, -0.565)
    grupo.add(escape)
  }

  // Banda continua de pilotos traseros LED (lightbar)
  piezaRedondeada(grupo, [0.46, 0.038, 0.03], frenoLed, [0, 0.26, -0.555], 0.015)

  grupo.userData.ruedas = ruedas
  grupo.userData.lucesFreno = frenoLed
  return grupo
}

export function animarVehiculo(grupo: THREE.Group, distancia: number, detenido: boolean) {
  const ruedas = grupo.userData.ruedas as THREE.Group[]
  const radio = 0.125
  const giroX = distancia / radio
  ruedas.forEach((rueda) => {
    // Giro fluido sobre el eje horizontal de la rueda (X)
    rueda.rotation.x += giroX
  })
  const frenos = grupo.userData.lucesFreno as THREE.MeshStandardMaterial
  // Al frenar, la barra LED trasera se ilumina con brillo de parada de emergencia
  frenos.emissiveIntensity = detenido ? 2.2 : 0.4
}
