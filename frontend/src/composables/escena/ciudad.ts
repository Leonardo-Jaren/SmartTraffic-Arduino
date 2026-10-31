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

/** Crea el parque central geométrico exactamente como en la maqueta física */
function crearParque(escena: THREE.Group) {
  const parque = new THREE.Group()

  // Marco perimetral de acera
  caja(parque, 3.8, 0.05, 5.2, 0xd2d8de, [0, 0.2, 0], 0.06)

  // Base de césped verde oscuro del parque
  caja(parque, 3.56, 0.03, 4.96, 0x2e7d32, [0, 0.22, 0], 0.04)

  // Senderos peatonales geométricos de adoquín claro (patrón de la foto)
  const matSendero = materialUrbano(0xdfe5eb, 0.6)

  // Eje vertical principal (N-S)
  piezaUrbana(parque, [0.38, 0.035, 4.94], matSendero, [0, 0.23, 0])

  // Eje horizontal central (E-O)
  piezaUrbana(parque, [3.54, 0.035, 0.38], matSendero, [0, 0.23, 0])

  // Conectores secundarios en retícula geométrica
  piezaUrbana(parque, [0.34, 0.035, 2.2], matSendero, [1.05, 0.23, 1.2])
  piezaUrbana(parque, [0.34, 0.035, 2.2], matSendero, [-1.05, 0.23, -1.2])
  piezaUrbana(parque, [1.2, 0.035, 0.32], matSendero, [-1.15, 0.23, 1.4])
  piezaUrbana(parque, [1.2, 0.035, 0.32], matSendero, [1.15, 0.23, -1.4])

  parque.position.set(3, 0, 0)
  escena.add(parque)
}

/** Genera las capas onduladas de césped en relieve características de la maqueta */
function crearOndulacionesCesped(escena: THREE.Group) {
  const grupo = new THREE.Group()
  const matVerdeClaro = materialUrbano(0x43a047, 0.75)
  const matVerdeRelieve = materialUrbano(0x66bb6a, 0.72)

  // Curvas de nivel orgánicas alrededor de los bloques (como en las imágenes de la maqueta)
  const parcelas: [number, number, number, number][] = [
    [-3, -6.2, 3.6, 3.4],
    [3, -6.2, 3.6, 3.4],
    [8, -6.2, 2.8, 3.4],
    [-3, 0, 3.6, 4.8],
    [8, 0, 2.8, 4.8],
    [-3, 6.2, 3.6, 3.4],
    [3, 6.2, 3.6, 3.4],
    [8, 6.2, 2.8, 3.4],
  ]

  parcelas.forEach(([cx, cz, w, h]) => {
    // Primera capa ondulada (verde suave)
    const forma1 = new THREE.Shape()
    forma1.moveTo(-w / 2, -h / 2)
    forma1.lineTo(w / 2, -h / 2)
    forma1.bezierCurveTo(w / 2 * 0.7, -h * 0.1, w / 2 * 0.9, h * 0.2, w / 2, h / 2)
    forma1.lineTo(-w / 2, h / 2)
    forma1.bezierCurveTo(-w / 2 * 0.7, h * 0.2, -w / 2 * 0.85, -h * 0.1, -w / 2, -h / 2)

    const geom1 = new THREE.ShapeGeometry(forma1)
    const malla1 = new THREE.Mesh(geom1, matVerdeClaro)
    malla1.rotation.x = -Math.PI / 2
    malla1.position.set(cx, 0.205, cz)
    grupo.add(malla1)

    // Segunda capa ondulada interna de mayor contraste
    const forma2 = new THREE.Shape()
    const w2 = w * 0.82
    const h2 = h * 0.82
    forma2.moveTo(-w2 / 2, -h2 / 2)
    forma2.bezierCurveTo(-w2 * 0.2, -h2 * 0.6, w2 * 0.2, -h2 * 0.4, w2 / 2, -h2 / 2)
    forma2.lineTo(w2 / 2, h2 / 2)
    forma2.bezierCurveTo(w2 * 0.2, h2 * 0.6, -w2 * 0.2, h2 * 0.4, -w2 / 2, h2 / 2)
    forma2.closePath()

    const geom2 = new THREE.ShapeGeometry(forma2)
    const malla2 = new THREE.Mesh(geom2, matVerdeRelieve)
    malla2.rotation.x = -Math.PI / 2
    malla2.position.set(cx, 0.208, cz)
    grupo.add(malla2)
  })

  escena.add(grupo)
}

export function crearCiudad(escena: THREE.Group) {
  // Los 8 edificios con los colores perimetrales y techos acanalados de la maqueta
  const edificios: EdificioUrbano[] = [
    {
      nombre: 'EDIFICIO 1',
      x: -3,
      z: -6.2,
      ancho: 2.2,
      fondo: 1.8,
      alto: 1.35,
      giro: 0,
      pared: 0xeef2f6,
      acento: 0xd0d8e0,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
    {
      nombre: 'EDIFICIO 2',
      x: 3,
      z: -6.2,
      ancho: 2.2,
      fondo: 1.8,
      alto: 1.35,
      giro: 0,
      pared: 0xffffff,
      acento: 0xe0e6ec,
      cubierta: 'acanalada',
      franjaAzul: false,
    },
    {
      nombre: 'EDIFICIO 3',
      x: 8,
      z: -6.2,
      ancho: 1.8,
      fondo: 1.8,
      alto: 1.35,
      giro: -Math.PI / 2,
      pared: 0xfbc02d,
      acento: 0xf57f17,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
    {
      nombre: 'EDIFICIO 4',
      x: -3,
      z: 0,
      ancho: 2.2,
      fondo: 1.8,
      alto: 1.35,
      giro: Math.PI / 2,
      pared: 0xfbc02d,
      acento: 0xf57f17,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
    {
      nombre: 'EDIFICIO 5',
      x: 8,
      z: 0,
      ancho: 1.8,
      fondo: 1.8,
      alto: 1.35,
      giro: -Math.PI / 2,
      pared: 0x7b1fa2,
      acento: 0x4a148c,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
    {
      nombre: 'EDIFICIO 6',
      x: -3,
      z: 6.2,
      ancho: 2.2,
      fondo: 1.8,
      alto: 1.35,
      giro: Math.PI,
      pared: 0xf57c00,
      acento: 0xe65100,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
    {
      nombre: 'EDIFICIO 7',
      x: 3,
      z: 6.2,
      ancho: 2.2,
      fondo: 1.8,
      alto: 1.35,
      giro: Math.PI,
      pared: 0x212121,
      acento: 0x111111,
      cubierta: 'acanalada',
      franjaAzul: false,
    },
    {
      nombre: 'EDIFICIO 8',
      x: 8,
      z: 6.2,
      ancho: 1.8,
      fondo: 1.8,
      alto: 1.35,
      giro: -Math.PI / 2,
      pared: 0x7cb342,
      acento: 0x558b2f,
      cubierta: 'acanalada',
      franjaAzul: true,
    },
  ]

  crearOndulacionesCesped(escena)
  edificios.forEach((datos) => escena.add(crearEdificio(datos)))
  crearParque(escena)
}
