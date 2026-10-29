import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { colorearSemaforo, crearSemaforo } from './semaforos'
import { crearDinamicos } from './dinamicos'
import { NODOS, SEMAFOROS_BASE, TRAMOS } from '../simulacion/mapa'
import { ubicacionesIniciales } from '../useDisposicionSemaforos'

describe('representación de un semáforo', () => {
  it('tiene tres luces y enciende solo el color indicado', () => {
    const semaforo = crearSemaforo()
    expect(Object.keys(semaforo.focos)).toEqual(['rojo', 'amarillo', 'verde'])
    colorearSemaforo(semaforo, 'amarillo')
    for (const [color, foco] of Object.entries(semaforo.focos)) {
      const material = foco.material as THREE.MeshStandardMaterial
      if (color === 'amarillo') expect(material.emissiveIntensity).toBeGreaterThan(0)
      else expect(material.emissiveIntensity).toBe(0)
    }
    colorearSemaforo(semaforo, null)
    expect((semaforo.focos.amarillo.material as THREE.MeshStandardMaterial).emissiveIntensity).toBe(0)
  })
  it('crea solo seis luces fijas y sus caras miran contra la circulación de su calle', () => {
    const escena = new THREE.Group()
    const maqueta = {
      seleccionables: [] as THREE.Object3D[],
      calles: new Map<string, THREE.Mesh>(),
      cruces: new Map<string, THREE.Mesh>(),
    }
    const dinamicos = crearDinamicos(escena, maqueta)
    dinamicos.actualizar(
      [],
      [],
      new Set(),
      null,
      [],
      'simulacion',
      true,
      {
        conectado: false,
        fuente: 'arduino',
        modo: 'DESCONECTADO',
        colores: [],
        ultimo_reporte: null,
        puerto: '',
        error: '',
        tiempos_confirmados: null,
        ultimo_comando: null,
      },
      ubicacionesIniciales(),
    )
    expect(escena.children).toHaveLength(6)
    expect(maqueta.seleccionables).toHaveLength(6)
    escena.updateMatrixWorld(true)
    for (const datos of SEMAFOROS_BASE) {
      const grupo = escena.children.find((objeto) => objeto.userData.id === datos.id)!
      const foco = grupo.getObjectByName('luz-rojo')!
      const frente = foco.getWorldPosition(new THREE.Vector3()).sub(grupo.getWorldPosition(new THREE.Vector3()))
      frente.y = 0
      frente.normalize()
      const entrada = TRAMOS.find((tramo) => tramo.hacia === datos.cruce && tramo.eje === datos.eje)!
      const a = NODOS[entrada.de]!,
        b = NODOS[entrada.hacia]!
      const flujo = new THREE.Vector3(b.x - a.x, 0, b.z - a.z).normalize()
      expect(frente.dot(flujo)).toBeCloseTo(-1, 8)
    }
  })
})
