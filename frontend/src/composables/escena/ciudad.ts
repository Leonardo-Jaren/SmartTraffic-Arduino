import * as THREE from 'three'
import { crearEdificio, type EdificioUrbano } from './edificios'
import { materialUrbano } from './geometriaUrbana'
import { crearArquitectura } from './arquitecturas'
import { crearResidencia } from './residencia'
import { crearParque } from './parque'

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

  // Ocho modelos compartidos entre las parcelas: repetir edificios no duplica sus geometrías.
  const modelos = edificios.map((datos, indice) =>
    indice === 0 || indice === 6
      ? crearEdificio({ ...datos, x: 0, z: 0, giro: 0 })
      : crearArquitectura(datos, (indice - 1) % 4),
  )
  let numero = 0
  const colocar = (x: number, z: number, giro: number) => {
    const edificio = modelos[((numero++ % 4) * 3 + Math.floor((numero - 1) / 4)) % modelos.length]!.clone()
    edificio.position.set(x, 0, z)
    edificio.rotation.y = giro
    edificio.scale.set(1.1 + (numero % 2) * 0.08, 0.85 + (numero % 4) * 0.18, 1.05 + (numero % 3) * 0.08)
    escena.add(edificio)
  }
  const frentes = [-18, -10.8, -6.8, -2.8, 2.8, 6.8, 10.8, 18]
  for (const x of frentes) {
    colocar(x, -13, 0)
    colocar(x, -6, Math.PI)
    colocar(x, 6, 0)
    colocar(x, 13, Math.PI)
  }
  for (const z of [-2.5, 2.5]) {
    colocar(-18, z, Math.PI / 2)
    colocar(18, z, -Math.PI / 2)
  }
  const parques = new THREE.Group()
  crearParque(parques)
  parques.position.x = -10
  escena.add(parques)
  escena.add(crearResidencia())

  for (const x of [-18, -10, -6, 6, 10, 18]) {
    escena.add(crearFarolaModerna(x, -10.2, Math.PI / 2))
    escena.add(crearFarolaModerna(x, 10.2, -Math.PI / 2))
  }
}
