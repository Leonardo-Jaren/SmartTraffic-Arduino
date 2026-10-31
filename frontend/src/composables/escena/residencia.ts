import * as THREE from 'three'
import { agruparPiezasUrbanas, materialUrbano, piezaUrbana } from './geometriaUrbana'

/** Vivienda de dos plantas, cochera y patio: una parcela distinta de los edificios comerciales. */
export function crearResidencia() {
  const casa = new THREE.Group()
  const piedra = materialUrbano(0xddd1bd)
  const blanco = materialUrbano(0xf4efe4)
  const madera = materialUrbano(0x88614b)
  const cristal = materialUrbano(0x548493, 0.28)
  const teja = materialUrbano(0x9b5144)
  const pavimento = materialUrbano(0xc2bbb0)
  piezaUrbana(casa, [8, 0.06, 7.4], pavimento, [0, 0.2, 0])
  piezaUrbana(casa, [4.5, 1.4, 3.4], piedra, [-0.5, 0.93, -0.7])
  piezaUrbana(casa, [3.4, 1.15, 3.1], blanco, [-1.05, 2.2, -0.7])
  piezaUrbana(casa, [2.4, 1.35, 3.4], blanco, [2.2, 0.9, -0.7])
  piezaUrbana(casa, [2.0, 0.95, 0.08], madera, [2.2, 0.74, 1.04])
  for (const x of [-2.1, -0.7, 0.7]) {
    piezaUrbana(casa, [0.85, 0.68, 0.06], cristal, [x, 1.05, 1.03])
    piezaUrbana(casa, [0.95, 0.05, 0.15], blanco, [x, 0.69, 1.05])
  }
  for (const x of [-2, -0.35]) {
    piezaUrbana(casa, [1.2, 0.7, 0.06], cristal, [x, 2.25, 0.87])
    piezaUrbana(casa, [0.06, 0.72, 0.08], madera, [x, 2.25, 0.9])
  }
  // Dos faldones inclinados, aleros y chimenea de la vivienda.
  for (const lado of [-1, 1]) {
    const faldon = piezaUrbana(casa, [3.9, 0.12, 1.95], teja, [-1.05, 2.98, -0.7 + lado * 0.87])
    faldon.rotation.x = lado * 0.32
  }
  piezaUrbana(casa, [0.45, 0.65, 0.5], piedra, [-2.1, 3.12, -1.5])
  piezaUrbana(casa, [2.7, 0.14, 3.7], madera, [2.2, 1.62, -0.7])
  // Patio frontal con acceso a la cochera, pérgola y setos perimetrales.
  piezaUrbana(casa, [2.1, 0.03, 2.5], materialUrbano(0x9b9d96), [2.2, 0.25, 2.3])
  piezaUrbana(casa, [3.8, 0.035, 2.1], materialUrbano(0x6d8e59), [-1.1, 0.25, 2.3])
  for (const x of [-2.7, 0.4]) {
    piezaUrbana(casa, [0.09, 1.6, 0.09], madera, [x, 1.05, 2.7])
  }
  for (let x = -2.8; x < 0.7; x += 0.4) piezaUrbana(casa, [0.1, 0.1, 1.6], madera, [x, 1.87, 2.1])
  const hojas = materialUrbano(0x436e49)
  for (const x of [-3.7, 3.7]) piezaUrbana(casa, [0.25, 0.4, 6.8], hojas, [x, 0.45, 0], 0.09)
  casa.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh) objeto.userData.proyectaSombra = true
  })
  agruparPiezasUrbanas(casa)
  casa.position.set(7, 0, 0)
  return casa
}
