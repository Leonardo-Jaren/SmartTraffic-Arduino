import * as THREE from 'three'
import type { EdificioUrbano } from './edificios'
import { agruparPiezasUrbanas, materialUrbano, piezaUrbana } from './geometriaUrbana'

/** Tipologías distintas por volumen, fachada y cubierta, dentro de la misma parcela. */
export function crearArquitectura(datos: EdificioUrbano, tipo: number) {
  const grupo = new THREE.Group()
  const pared = materialUrbano(datos.pared)
  const acento = materialUrbano(datos.acento)
  const vidrio = materialUrbano(0x577d8b, 0.3)
  const claro = materialUrbano(0xf2e9d8)
  const techo = materialUrbano(tipo === 0 ? 0x9d5948 : 0x536875)
  const w = datos.ancho,
    d = datos.fondo,
    h = datos.alto
  const pieza = (tamano: [number, number, number], material: THREE.Material, posicion: [number, number, number]) =>
    piezaUrbana(grupo, tamano, material, posicion)
  pieza([w + 0.2, 0.08, d + 0.2], materialUrbano(0xc1c0b5), [0, 0.24, 0])
  if (tipo === 0) {
    // Vivienda: tejado a dos aguas, chimenea y ventanas separadas.
    pieza([w, h * 0.8, d], pared, [0, 0.28 + h * 0.4, 0])
    for (const lado of [-1, 1]) {
      const faldon = pieza([w + 0.18, 0.09, d * 0.59], techo, [0, h * 0.8 + 0.42, lado * d * 0.25])
      faldon.rotation.x = lado * 0.35
    }
    pieza([0.2, 0.45, 0.22], claro, [w * 0.28, h * 0.8 + 0.6, -d * 0.15])
    for (const x of [-w * 0.27, w * 0.27])
      for (const y of [0.7, h * 0.65]) {
        pieza([w * 0.23, 0.32, 0.04], vidrio, [x, y, d / 2 + 0.03])
        pieza([w * 0.28, 0.05, 0.13], claro, [x, y - 0.18, d / 2 + 0.04])
      }
    pieza([0.3, 0.55, 0.04], acento, [0, 0.56, d / 2 + 0.03])
  } else if (tipo === 1) {
    // Comercio bajo: escaparate, toldo rayado y rótulo.
    pieza([w, 0.95, d], pared, [0, 0.755, 0])
    pieza([w * 0.84, 0.56, 0.04], vidrio, [0, 0.64, d / 2 + 0.03])
    pieza([w + 0.14, 0.12, d + 0.14], claro, [0, 1.28, 0])
    for (let i = 0; i < 8; i++) {
      const toldo = pieza([w / 8, 0.055, 0.48], i % 2 ? claro : acento, [
        -w / 2 + (w * (i + 0.5)) / 8,
        1.04,
        d / 2 + 0.2,
      ])
      toldo.rotation.x = 0.15
    }
    pieza([w * 0.6, 0.23, 0.06], acento, [0, 1.43, d * 0.3])
  } else if (tipo === 2) {
    // Apartamentos: balcones y azotea con pérgola, sin muro cortina de oficinas.
    pieza([w, h, d], pared, [0, 0.28 + h / 2, 0])
    const pisos = 3
    for (let p = 0; p < pisos; p++)
      for (const x of [-w * 0.26, w * 0.26]) {
        const y = 0.55 + (p * h) / pisos
        pieza([w * 0.27, (h / pisos) * 0.65, 0.04], vidrio, [x, y + 0.16, d / 2 + 0.03])
        pieza([w * 0.43, 0.08, 0.4], claro, [x, y - 0.05, d / 2 + 0.15])
        pieza([w * 0.43, 0.15, 0.035], acento, [x, y + 0.08, d / 2 + 0.34])
      }
    for (let i = 0; i < 5; i++) pieza([0.08, 0.08, d * 0.8], techo, [-w * 0.4 + i * w * 0.2, h + 0.48, 0])
  } else {
    // Equipamiento público escalonado, con pórtico y terraza lateral.
    pieza([w, h * 0.45, d], pared, [0, 0.28 + h * 0.225, 0])
    pieza([w * 0.58, h * 0.6, d * 0.8], claro, [-w * 0.2, 0.28 + h * 0.75, -d * 0.1])
    pieza([w * 0.92, 0.32, 0.04], vidrio, [0, 0.68, d / 2 + 0.03])
    pieza([w * 0.63, 0.12, d * 0.88], acento, [-w * 0.2, 0.3 + h * 1.05, -d * 0.1])
    for (const x of [-w * 0.37, w * 0.37]) pieza([0.1, 0.75, 0.1], claro, [x, 0.63, d / 2 + 0.24])
    pieza([w, 0.1, 0.5], acento, [0, 1.05, d / 2 + 0.15])
  }
  grupo.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh) objeto.userData.proyectaSombra = true
  })
  agruparPiezasUrbanas(grupo)
  return grupo
}
