import * as THREE from 'three'
import { agruparPiezasUrbanas, materialUrbano, piezaUrbana } from './geometriaUrbana'

export interface EdificioUrbano {
  nombre: string
  x: number
  z: number
  ancho: number
  fondo: number
  alto: number
  giro: number
  pared: number
  acento: number
  cubierta: 'acanalada' | 'tejas' | 'terraza' | 'pergola'
  escalonado?: boolean
  franjaAzul?: boolean
}

/** Techo de chapa acanalada plateada con nervaduras horizontales reflectantes */
function crearCubiertaAcanalada(grupo: THREE.Group, ancho: number, fondo: number, y: number) {
  const matChapa = new THREE.MeshStandardMaterial({
    color: 0xdfe6ec,
    metalness: 0.92,
    roughness: 0.22,
  })

  // Placa base de la cubierta metálica
  const baseTecho = piezaUrbana(grupo, [ancho + 0.12, 0.05, fondo + 0.12], matChapa, [0, y + 0.025, 0], 0.02)
  baseTecho.userData.proyectaSombra = true

  // Nervaduras / acanaladuras paralelas idénticas a la chapa de la maqueta
  const paso = 0.12
  const cantidad = Math.floor((fondo + 0.06) / paso)
  const radioNervio = 0.018
  const nervioGeom = new THREE.CylinderGeometry(radioNervio, radioNervio, ancho + 0.08, 8)
  nervioGeom.rotateZ(Math.PI / 2)
  const offset = -(cantidad * paso) / 2 + paso / 2

  for (let i = 0; i < cantidad; i++) {
    const costilla = new THREE.Mesh(nervioGeom, matChapa)
    costilla.position.set(0, y + 0.054, offset + i * paso)
    costilla.castShadow = true
    costilla.userData.proyectaSombra = true
    grupo.add(costilla)
  }

  // Remate perimetral de aluminio
  const matBorde = materialUrbano(0xc5d0d8, 0.3)
  const remateX = piezaUrbana(grupo, [ancho + 0.14, 0.045, 0.03], matBorde, [0, y + 0.035, (fondo + 0.12) / 2])
  const remateZ = piezaUrbana(grupo, [ancho + 0.14, 0.045, 0.03], matBorde, [0, y + 0.035, -(fondo + 0.12) / 2])
  remateX.userData.proyectaSombra = true
  remateZ.userData.proyectaSombra = true
}

/** Franja arquitectónica de ventanal / rejilla azul marino característica de la maqueta */
function crearFranjaVentanal(grupo: THREE.Group, ancho: number, alto: number, fondo: number) {
  const matAzul = new THREE.MeshStandardMaterial({
    color: 0x1976d2,
    emissive: 0x0d47a1,
    emissiveIntensity: 0.25,
    roughness: 0.35,
  })
  const matMarco = materialUrbano(0xd0d8e0, 0.4)
  const matLama = materialUrbano(0xffffff, 0.3)

  // Marco exterior
  const marco = piezaUrbana(grupo, [0.32, 0.85, 0.045], matMarco, [ancho * 0.28, 0.25 + alto * 0.45, fondo / 2 + 0.015], 0.01)
  marco.userData.proyectaSombra = true

  // Cristal / panel azul de fondo
  const panel = piezaUrbana(grupo, [0.26, 0.79, 0.02], matAzul, [ancho * 0.28, 0.25 + alto * 0.45, fondo / 2 + 0.028])
  panel.userData.proyectaSombra = true

  // Lamas / celosías horizontales blancas
  for (let y = -0.3; y <= 0.3; y += 0.15) {
    piezaUrbana(grupo, [0.24, 0.02, 0.025], matLama, [ancho * 0.28, 0.25 + alto * 0.45 + y, fondo / 2 + 0.038])
  }
}

/** Construye un edificio de volumen arquitectónico limpio fiel a la maqueta física */
export function crearEdificio(datos: EdificioUrbano) {
  const grupo = new THREE.Group()

  const matPared = materialUrbano(datos.pared, 0.45)
  const matPlinto = materialUrbano(0xdbe3ea, 0.55)

  // 1. Zócalo / plinto perimetral inferior
  const plinto = piezaUrbana(
    grupo,
    [datos.ancho + 0.16, 0.06, datos.fondo + 0.16],
    matPlinto,
    [0, 0.22, 0],
    0.02,
  )
  plinto.userData.proyectaSombra = true
  plinto.userData.recibeSombra = true

  // 2. Volumen principal del edificio con su color perimetral
  const cuerpo = piezaUrbana(
    grupo,
    [datos.ancho, datos.alto, datos.fondo],
    matPared,
    [0, 0.25 + datos.alto / 2, 0],
    0.03,
  )
  cuerpo.userData.proyectaSombra = true
  cuerpo.userData.recibeSombra = true

  // 3. Ventanal arquitectónico azul característico observado en la maqueta
  if (datos.franjaAzul !== false) {
    crearFranjaVentanal(grupo, datos.ancho, datos.alto, datos.fondo)
  }

  // 4. Cubierta de chapa acanalada plateada
  const yTecho = 0.25 + datos.alto
  crearCubiertaAcanalada(grupo, datos.ancho, datos.fondo, yTecho)

  agruparPiezasUrbanas(grupo)
  grupo.position.set(datos.x, 0, datos.z)
  grupo.rotation.y = datos.giro
  return grupo
}
