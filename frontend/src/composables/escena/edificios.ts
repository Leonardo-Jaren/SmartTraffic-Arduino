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
  cubierta: 'tejas' | 'terraza' | 'pergola'
  escalonado?: boolean
}

function crearRotulo(texto: string, color: THREE.Color) {
  const lienzo = document.createElement('canvas')
  lienzo.width = 512
  lienzo.height = 128
  const contexto = lienzo.getContext('2d')!
  contexto.fillStyle = `#${color.getHexString()}`
  contexto.fillRect(0, 0, 512, 128)
  contexto.fillStyle = '#fff8e9'
  contexto.font = '700 53px Arial'
  contexto.textAlign = 'center'
  contexto.textBaseline = 'middle'
  contexto.fillText(texto, 256, 68, 474)
  const textura = new THREE.CanvasTexture(lienzo)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4
  return new THREE.MeshBasicMaterial({ map: textura })
}

function crearAcabados(datos: EdificioUrbano) {
  return {
    pared: materialUrbano(datos.pared),
    acento: materialUrbano(datos.acento),
    marco: materialUrbano(0xf1e9d9),
    piedra: materialUrbano(0xb9b7a9),
    cristal: materialUrbano(0x4b7683, 0.25),
    metal: materialUrbano(0x4b5554, 0.34),
    madera: materialUrbano(0x86634a),
    plantas: materialUrbano(0x4f7f54),
    solar: materialUrbano(0x264c65, 0.26),
  }
}
type Acabados = ReturnType<typeof crearAcabados>

function ventana(grupo: THREE.Group, x: number, y: number, ancho: number, alto: number, a: Acabados) {
  piezaUrbana(grupo, [ancho + 0.08, alto + 0.08, 0.045], a.marco, [x, y, 0.02], 0.025)
  piezaUrbana(grupo, [ancho, alto, 0.018], a.cristal, [x, y, 0.05], 0.012)
  piezaUrbana(grupo, [0.025, alto, 0.016], a.marco, [x, y, 0.067])
  piezaUrbana(grupo, [ancho + 0.14, 0.055, 0.12], a.marco, [x, y - alto / 2 - 0.055, 0.045], 0.015)
}

function balcon(grupo: THREE.Group, x: number, y: number, a: Acabados) {
  piezaUrbana(grupo, [0.62, 0.06, 0.26], a.marco, [x, y, 0.12], 0.025)
  piezaUrbana(grupo, [0.62, 0.03, 0.03], a.metal, [x, y + 0.24, 0.24])
  for (const dx of [-0.27, 0, 0.27]) {
    piezaUrbana(grupo, [0.024, 0.23, 0.024], a.metal, [x + dx, y + 0.12, 0.24])
  }
  piezaUrbana(grupo, [0.32, 0.1, 0.13], a.madera, [x, y + 0.08, 0.13], 0.02)
  piezaUrbana(grupo, [0.3, 0.09, 0.12], a.plantas, [x, y + 0.17, 0.13], 0.035)
}

function caras(ancho: number, fondo: number) {
  return [
    { ancho, x: 0, z: fondo / 2, giro: 0 },
    { ancho: fondo, x: ancho / 2, z: 0, giro: Math.PI / 2 },
    { ancho, x: 0, z: -fondo / 2, giro: Math.PI },
    { ancho: fondo, x: -ancho / 2, z: 0, giro: -Math.PI / 2 },
  ]
}

function decorarFachadas(grupo: THREE.Group, datos: EdificioUrbano, a: Acabados) {
  caras(datos.ancho, datos.fondo).forEach((cara, indice) => {
    const fachada = new THREE.Group()
    if (indice === 0) {
      const anchoPuerta = datos.nombre === 'TALLER' ? datos.ancho * 0.55 : 0.36
      piezaUrbana(fachada, [anchoPuerta, 0.66, 0.06], a.metal, [0, 0.65, 0.035], 0.02)
      if (datos.nombre === 'TALLER') {
        for (const y of [0.44, 0.56, 0.68, 0.8])
          piezaUrbana(fachada, [anchoPuerta, 0.02, 0.025], a.piedra, [0, y, 0.08])
      } else {
        for (const x of [-datos.ancho * 0.29, datos.ancho * 0.29])
          ventana(fachada, x, 0.66, datos.ancho * 0.27, 0.54, a)
        piezaUrbana(fachada, [0.025, 0.19, 0.025], a.marco, [0.11, 0.66, 0.082])
      }
      const anchoToldo = datos.ancho * 0.89
      for (let franja = 0; franja < 7; franja++) {
        const toldo = piezaUrbana(fachada, [anchoToldo / 7, 0.045, 0.24], franja % 2 ? a.marco : a.acento, [
          -anchoToldo / 2 + ((franja + 0.5) * anchoToldo) / 7,
          1.01,
          0.11,
        ])
        toldo.rotation.x = 0.16
      }
      piezaUrbana(fachada, [datos.ancho * 0.72, 0.23, 0.045], a.acento, [0, 1.2, 0.036], 0.025)
      const letras = new THREE.Mesh(
        new THREE.PlaneGeometry(datos.ancho * 0.68, 0.2),
        crearRotulo(datos.nombre, a.acento.color),
      )
      letras.position.set(0, 1.2, 0.064)
      fachada.add(letras)
    } else {
      for (const x of [-cara.ancho * 0.24, cara.ancho * 0.24]) ventana(fachada, x, 0.72, 0.35, 0.49, a)
      piezaUrbana(fachada, [cara.ancho, 0.07, 0.04], a.acento, [0, 1.1, 0.015])
    }
    fachada.position.set(cara.x, 0, cara.z)
    fachada.rotation.y = cara.giro
    grupo.add(fachada)
  })

  const retranqueo = datos.escalonado ? 0.18 : 0
  const altoVentana = datos.alto >= 1.8 ? 0.43 : 0.19
  const yVentana = datos.alto >= 1.8 ? 1.66 + (datos.alto - 1.8) * 0.45 : 1.46
  caras(datos.ancho - retranqueo, datos.fondo - retranqueo).forEach((cara, indice) => {
    const superior = new THREE.Group()
    const posiciones =
      cara.ancho > 2 ? [-cara.ancho * 0.29, 0, cara.ancho * 0.29] : [-cara.ancho * 0.23, cara.ancho * 0.23]
    posiciones.forEach((x) => ventana(superior, x, yVentana, 0.33, altoVentana, a))
    if (datos.escalonado && (indice === 0 || indice === 2)) balcon(superior, posiciones[0]!, yVentana - 0.3, a)
    superior.position.set(cara.x, 0, cara.z)
    superior.rotation.y = cara.giro
    grupo.add(superior)
  })
}

function crearTejado(grupo: THREE.Group, ancho: number, fondo: number, y: number, a: Acabados) {
  const altura = 0.38
  const forma = new THREE.Shape()
  forma.moveTo(-ancho / 2, 0)
  forma.lineTo(ancho / 2, 0)
  forma.lineTo(0, altura)
  forma.closePath()
  const fronton = new THREE.Mesh(new THREE.ExtrudeGeometry(forma, { depth: fondo, bevelEnabled: false }), a.pared)
  fronton.position.set(0, y, -fondo / 2)
  fronton.userData.proyectaSombra = true
  grupo.add(fronton)
  const pendiente = Math.atan2(altura, ancho / 2)
  const largo = Math.hypot(ancho / 2, altura) + 0.13
  for (const lado of [-1, 1]) {
    const faldon = piezaUrbana(
      grupo,
      [largo, 0.07, fondo + 0.18],
      a.acento,
      [(lado * ancho) / 4, y + altura / 2, 0],
      0.015,
    )
    faldon.rotation.z = -lado * pendiente
    faldon.userData.proyectaSombra = true
    for (const z of [-fondo / 3, 0, fondo / 3]) {
      const junta = piezaUrbana(grupo, [largo, 0.012, 0.017], a.madera, [(lado * ancho) / 4, y + altura / 2 + 0.041, z])
      junta.rotation.z = -lado * pendiente
    }
  }
  piezaUrbana(grupo, [0.1, 0.09, fondo + 0.21], a.acento, [0, y + altura + 0.02, 0], 0.04)
  piezaUrbana(grupo, [0.21, 0.28, 0.24], a.pared, [ancho * 0.24, y + altura + 0.08, -fondo * 0.2], 0.025)
}

function crearTerraza(grupo: THREE.Group, ancho: number, fondo: number, y: number, a: Acabados, pergola: boolean) {
  piezaUrbana(grupo, [ancho + 0.12, 0.1, fondo + 0.12], a.marco, [0, y, 0], 0.03)
  piezaUrbana(grupo, [ancho - 0.09, 0.025, fondo - 0.09], a.piedra, [0, y + 0.06, 0])
  for (const cara of caras(ancho, fondo)) {
    const borde = piezaUrbana(grupo, [cara.ancho + 0.04, 0.14, 0.07], a.acento, [cara.x, y + 0.12, cara.z], 0.018)
    borde.rotation.y = cara.giro
  }
  if (pergola) {
    for (const x of [-ancho * 0.27, ancho * 0.27])
      for (const z of [-fondo * 0.28, fondo * 0.28])
        piezaUrbana(grupo, [0.045, 0.31, 0.045], a.madera, [x, y + 0.24, z])
    for (let i = -2; i <= 2; i++)
      piezaUrbana(grupo, [ancho * 0.66, 0.045, 0.055], a.madera, [0, y + 0.41, i * fondo * 0.16])
  } else {
    const panel = piezaUrbana(grupo, [ancho * 0.53, 0.055, fondo * 0.46], a.solar, [-ancho * 0.13, y + 0.15, 0], 0.02)
    panel.rotation.x = -0.12
    for (const z of [-0.18, 0, 0.18])
      piezaUrbana(grupo, [ancho * 0.52, 0.008, 0.012], a.marco, [-ancho * 0.13, y + 0.19 + z * 0.12, z])
    const tanque = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.29, 14), a.marco)
    tanque.position.set(ancho * 0.29, y + 0.23, -fondo * 0.25)
    grupo.add(tanque)
  }
  piezaUrbana(grupo, [ancho * 0.44, 0.13, 0.22], a.madera, [0, y + 0.14, fondo * 0.32], 0.025)
  piezaUrbana(grupo, [ancho * 0.4, 0.1, 0.2], a.plantas, [0, y + 0.25, fondo * 0.32], 0.04)
}

export function crearEdificio(datos: EdificioUrbano) {
  const grupo = new THREE.Group()
  const a = crearAcabados(datos)
  piezaUrbana(grupo, [datos.ancho + 0.34, 0.07, datos.fondo + 0.32], a.piedra, [0, 0.2, 0], 0.06)
  piezaUrbana(grupo, [datos.ancho + 0.12, 0.18, datos.fondo + 0.12], a.marco, [0, 0.3, 0], 0.04)
  const inferior = piezaUrbana(
    grupo,
    [datos.ancho, datos.escalonado ? 1.08 : datos.alto, datos.fondo],
    a.pared,
    [0, 0.26 + (datos.escalonado ? 1.08 : datos.alto) / 2, 0],
    0.045,
  )
  inferior.userData.proyectaSombra = true
  const anchoTecho = datos.ancho - (datos.escalonado ? 0.18 : 0)
  const fondoTecho = datos.fondo - (datos.escalonado ? 0.18 : 0)
  if (datos.escalonado) {
    const superior = piezaUrbana(
      grupo,
      [anchoTecho, datos.alto - 1.08, fondoTecho],
      a.pared,
      [0, 1.34 + (datos.alto - 1.08) / 2, 0],
      0.04,
    )
    superior.userData.proyectaSombra = true
    piezaUrbana(grupo, [datos.ancho + 0.07, 0.09, datos.fondo + 0.07], a.acento, [0, 1.32, 0], 0.02)
  }
  decorarFachadas(grupo, datos, a)
  const yTecho = datos.alto + 0.27
  if (datos.cubierta === 'tejas') crearTejado(grupo, anchoTecho, fondoTecho, yTecho, a)
  else crearTerraza(grupo, anchoTecho, fondoTecho, yTecho, a, datos.cubierta === 'pergola')
  agruparPiezasUrbanas(grupo)
  grupo.position.set(datos.x, 0, datos.z)
  grupo.rotation.y = datos.giro
  return grupo
}
