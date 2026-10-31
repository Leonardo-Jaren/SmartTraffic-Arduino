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
  pisos?: number
}

/** Crea un muro cortina acristalado de alta fidelidad con perfiles y reflejos */
function crearFachadaAcristalada(
  grupo: THREE.Group,
  ancho: number,
  alto: number,
  fondo: number,
  caraZ: number,
  acento: number,
) {
  const matCristal = new THREE.MeshPhysicalMaterial({
    color: 0x537b92,
    metalness: 0.3,
    roughness: 0.08,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    reflectivity: 0.9,
  })
  const matLobbyGlow = new THREE.MeshStandardMaterial({
    color: 0xffeed8,
    emissive: 0xffd4a3,
    emissiveIntensity: 0.22,
    roughness: 0.3,
  })
  const matMarco = materialUrbano(0x242c33, 0.4)
  const matAcento = materialUrbano(acento, 0.35)

  // Planta baja acristalada con iluminación interior de lobby
  piezaUrbana(grupo, [ancho * 0.88, 0.44, 0.03], matLobbyGlow, [0, 0.45, caraZ + 0.015])
  piezaUrbana(grupo, [ancho * 0.86, 0.42, 0.02], matCristal, [0, 0.45, caraZ + 0.025])

  // Puerta automática de cristal con marco de acero
  piezaUrbana(grupo, [0.38, 0.34, 0.04], matMarco, [0, 0.4, caraZ + 0.035], 0.01)

  // Marquesina voladiza sobre la entrada
  piezaUrbana(grupo, [0.72, 0.03, 0.28], matMarco, [0, 0.65, caraZ + 0.15], 0.01)

  // Pisos superiores: muro cortina con montantes verticales y lamas de diseño
  const yInicio = 0.8
  const altoPisos = alto - 0.6
  piezaUrbana(grupo, [ancho * 0.88, altoPisos, 0.025], matCristal, [0, yInicio + altoPisos / 2, caraZ + 0.015])

  // Forjados horizontales que separan plantas
  const cantidadPisos = Math.max(2, Math.floor(alto / 0.55))
  const pasoPiso = altoPisos / cantidadPisos
  for (let p = 1; p <= cantidadPisos; p++) {
    const yPiso = yInicio + p * pasoPiso
    piezaUrbana(grupo, [ancho * 0.92, 0.045, 0.06], matMarco, [0, yPiso, caraZ + 0.03])
  }

  // Lamas arquitectónicas verticales parasol (brise-soleil) en el color del edificio
  const cantidadLamas = Math.floor(ancho / 0.45)
  const pasoLamas = (ancho * 0.8) / cantidadLamas
  for (let i = -cantidadLamas / 2; i <= cantidadLamas / 2; i++) {
    const xLama = i * pasoLamas
    piezaUrbana(grupo, [0.035, altoPisos, 0.1], matAcento, [xLama, yInicio + altoPisos / 2, caraZ + 0.05], 0.01)
  }
}

/** Cubierta técnica moderna con peto perimetral, paneles solares y climatizadores HVAC */
function crearCubiertaArquitectonica(grupo: THREE.Group, ancho: number, fondo: number, y: number, acento: number) {
  const matPeto = materialUrbano(0xd5dde5, 0.5)
  const matSuelo = materialUrbano(0x283038, 0.85)
  const matMetal = new THREE.MeshStandardMaterial({ color: 0x98a4af, metalness: 0.85, roughness: 0.25 })
  const matSolar = new THREE.MeshStandardMaterial({
    color: 0x102438,
    emissive: 0x061424,
    emissiveIntensity: 0.3,
    metalness: 0.88,
    roughness: 0.18,
  })

  // Suelo técnico de grava/membrana
  piezaUrbana(grupo, [ancho - 0.08, 0.04, fondo - 0.08], matSuelo, [0, y, 0])

  // Peto perimetral arquitectónico con remate de aluminio
  for (const [w, f, px, pz] of [
    [ancho, 0.06, 0, fondo / 2],
    [ancho, 0.06, 0, -fondo / 2],
    [0.06, fondo, ancho / 2, 0],
    [0.06, fondo, -ancho / 2, 0],
  ] as const) {
    piezaUrbana(grupo, [w, 0.16, f], matPeto, [px, y + 0.08, pz], 0.01)
  }

  // Caseta de ascensores / acceso a cubierta
  const altCaseta = 0.38
  piezaUrbana(grupo, [ancho * 0.34, altCaseta, fondo * 0.32], matPeto, [
    -ancho * 0.22,
    y + altCaseta / 2,
    -fondo * 0.18,
  ])
  // Rejilla de ventilación de la caseta
  piezaUrbana(grupo, [ancho * 0.28, altCaseta * 0.6, 0.02], matMetal, [
    -ancho * 0.22,
    y + altCaseta / 2,
    -fondo * 0.18 + fondo * 0.16 + 0.01,
  ])

  // Mástil de telecomunicaciones / pararrayos
  const antena = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.02, 0.55, 8), matMetal)
  antena.position.set(-ancho * 0.22, y + altCaseta + 0.275, -fondo * 0.18)
  grupo.add(antena)

  // Bancada de climatización HVAC con ventiladores
  const hvac = piezaUrbana(grupo, [ancho * 0.38, 0.18, fondo * 0.24], matMetal, [ancho * 0.2, y + 0.09, -fondo * 0.2])
  hvac.userData.proyectaSombra = true
  for (const dx of [-0.15, 0.15]) {
    const ventilador = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16), matSuelo)
    ventilador.position.set(ancho * 0.2 + dx, y + 0.19, -fondo * 0.2)
    grupo.add(ventilador)
  }

  // Matriz de paneles solares fotovoltaicos inclinados
  const solarWidth = ancho * 0.55
  const solarDepth = fondo * 0.32
  const panel = piezaUrbana(
    grupo,
    [solarWidth, 0.025, solarDepth],
    matSolar,
    [ancho * 0.08, y + 0.12, fondo * 0.18],
    0.01,
  )
  panel.rotation.x = -0.22
  panel.userData.proyectaSombra = true

  // Estructura de soporte de los paneles solares
  for (const sx of [-solarWidth * 0.4, 0, solarWidth * 0.4]) {
    const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), matMetal)
    pata.position.set(ancho * 0.08 + sx, y + 0.07, fondo * 0.18 - solarDepth * 0.35)
    grupo.add(pata)
  }
}

/** Construye un edificio de arquitectura contemporánea realista */
export function crearEdificio(datos: EdificioUrbano) {
  const grupo = new THREE.Group()

  const matPared = materialUrbano(datos.pared, 0.52)
  const matPlinto = materialUrbano(0xc2ccd6, 0.6)
  const matAcento = materialUrbano(datos.acento, 0.38)

  // 1. Zócalo / podio de granito urbano
  const plinto = piezaUrbana(grupo, [datos.ancho + 0.18, 0.08, datos.fondo + 0.18], matPlinto, [0, 0.24, 0], 0.02)
  plinto.userData.proyectaSombra = true
  plinto.userData.recibeSombra = true

  // 2. Núcleo volumétrico estructural del edificio
  const cuerpo = piezaUrbana(
    grupo,
    [datos.ancho, datos.alto, datos.fondo],
    matPared,
    [0, 0.26 + datos.alto / 2, 0],
    0.025,
  )
  cuerpo.userData.proyectaSombra = true
  cuerpo.userData.recibeSombra = true

  // 3. Fachada principal acristalada con brise-soleil (hacia la calle)
  crearFachadaAcristalada(grupo, datos.ancho, datos.alto, datos.fondo, datos.fondo / 2, datos.acento)

  // Fachada posterior con ventanales apaisados
  const matCristalSec = new THREE.MeshPhysicalMaterial({
    color: 0x496b83,
    metalness: 0.3,
    roughness: 0.1,
    clearcoat: 0.8,
  })
  const pisos = Math.max(2, Math.floor(datos.alto / 0.55))
  for (let p = 0; p < pisos; p++) {
    const yVentana = 0.55 + p * (datos.alto / pisos)
    piezaUrbana(grupo, [datos.ancho * 0.78, 0.22, 0.025], matCristalSec, [0, yVentana, -datos.fondo / 2 - 0.01])
    piezaUrbana(grupo, [datos.ancho * 0.8, 0.035, 0.045], matAcento, [0, yVentana + 0.12, -datos.fondo / 2 - 0.02])
  }

  // Fachadas laterales con franjas verticales arquitectónicas
  for (const lado of [-1, 1]) {
    piezaUrbana(grupo, [0.03, datos.alto * 0.85, datos.fondo * 0.55], matCristalSec, [
      lado * (datos.ancho / 2 + 0.01),
      0.26 + datos.alto * 0.5,
      0,
    ])
    piezaUrbana(grupo, [0.045, datos.alto * 0.88, 0.06], matAcento, [
      lado * (datos.ancho / 2 + 0.02),
      0.26 + datos.alto * 0.5,
      datos.fondo * 0.3,
    ])
  }

  // 4. Cubierta técnica con climatizadores, paneles solares y caseta
  const yTecho = 0.26 + datos.alto
  crearCubiertaArquitectonica(grupo, datos.ancho, datos.fondo, yTecho, datos.acento)

  agruparPiezasUrbanas(grupo)
  grupo.position.set(datos.x, 0, datos.z)
  grupo.rotation.y = datos.giro
  return grupo
}
