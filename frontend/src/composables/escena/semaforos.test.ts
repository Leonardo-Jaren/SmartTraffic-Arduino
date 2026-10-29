import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { colorearSemaforo, crearSemaforo } from './semaforos'

describe('representación de un semáforo', () => {
  it('tiene tres luces y enciende solo el color indicado', () => {
    const semaforo = crearSemaforo()
    expect(Object.keys(semaforo.focos)).toEqual(['rojo', 'amarillo', 'verde'])
    colorearSemaforo(semaforo, 'amarillo')
    for (const [color, foco] of Object.entries(semaforo.focos)) {
      const material = foco.material as THREE.MeshStandardMaterial
      expect(material.emissiveIntensity).toBe(color === 'amarillo' ? 0.7 : 0)
    }
    colorearSemaforo(semaforo, null)
    expect((semaforo.focos.amarillo.material as THREE.MeshStandardMaterial).emissiveIntensity).toBe(0)
  })
})
