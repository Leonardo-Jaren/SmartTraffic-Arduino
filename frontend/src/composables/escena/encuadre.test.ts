import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { calcularEncuadre, obtenerPuntosEncuadre } from './encuadre'

describe('encuadre de la maqueta', () => {
  it.each([0.7, 1, 1.4, 2.2])('mantiene el tablero completo en una ventana de aspecto %s', (aspecto) => {
    const limites = new THREE.Box3(new THREE.Vector3(-0.8, -0.02, -0.6), new THREE.Vector3(0.8, 0.23, 0.6))
    const volumen = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 1.2))
    volumen.position.y = 0.105
    const puntos = obtenerPuntosEncuadre(volumen)
    const direccion = new THREE.Vector3(13, 17, 19.5).normalize()
    const camara = new THREE.PerspectiveCamera(38, aspecto, 0.02, 30)
    const encuadre = calcularEncuadre(puntos, direccion, 38, aspecto)
    camara.position.copy(encuadre.centro).addScaledVector(direccion, encuadre.distancia)
    camara.lookAt(encuadre.centro)
    camara.updateMatrixWorld()
    for (const x of [limites.min.x, limites.max.x])
      for (const y of [limites.min.y, limites.max.y])
        for (const z of [limites.min.z, limites.max.z]) {
          const proyectada = new THREE.Vector3(x, y, z).project(camara)
          expect(Math.abs(proyectada.x)).toBeLessThanOrEqual(0.880001)
          expect(Math.abs(proyectada.y)).toBeLessThanOrEqual(0.880001)
          expect(proyectada.z).toBeLessThan(1)
        }
  })
})
