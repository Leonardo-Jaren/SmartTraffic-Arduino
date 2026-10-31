import { expect, it } from 'vitest'
import * as THREE from 'three'
import type { Vehiculo } from '@/types/trafico'
import { avanzarVehiculos } from './vehiculos'
import { CRUCES, DISTANCIA_PARADA_CRUCE, SEMAFOROS_BASE, TRAMOS, obtenerTramo } from './mapa'
import { TIEMPOS_SIMULACION } from './luces'
import { crearSenalesCeda } from '../escena/senales'

const coche = (id: number, ruta = ['H1-1', 'H1-2', 'H1-3', 'H1-4']): Vehiculo => ({
  id,
  carril: (id % 2) as 0 | 1,
  ruta,
  indice: 0,
  progreso: 0,
  destino: 'H1O',
  reservado: null,
  detenido: '',
  color: 0xffffff,
})

it('ambos rectos paralelos entran en verde sin una espera artificial entre carriles', () => {
  const a = coche(1),
    b = coche(2)
  a.progreso = b.progreso = obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE
  const fases = CRUCES.map((id) => ({ id, horizontal: 'verde' as const, vertical: 'rojo' as const, restante: 10 }))
  avanzarVehiculos([a, b], 0.1, new Set(), fases, 45)
  expect(a.reservado).toBe('I3')
  expect(b.reservado).toBe('I3')
  expect(a.progreso).toBeCloseTo(b.progreso)
  expect(a.detenido).toBe('')
  expect(b.detenido).toBe('')
})

it('un giro mantiene la exclusión de otro movimiento durante el despeje', () => {
  const a = coche(1, ['H1-1', 'V3-3']),
    b = coche(2)
  a.progreso = b.progreso = obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE
  const fases = CRUCES.map((id) => ({ id, horizontal: 'verde' as const, vertical: 'rojo' as const, restante: 10 }))
  avanzarVehiculos([a, b], 0.1, new Set(), fases, 45)
  expect([a, b].filter((v) => v.reservado)).toHaveLength(1)
})

it('las horizontales circulan más rápido y reciben más verde', () => {
  const h = coche(1),
    v = coche(2, ['V1-1', 'V1-2', 'V1-3'])
  avanzarVehiculos([h, v], 0.1, new Set(), [], 45)
  expect(v.progreso / h.progreso).toBeCloseTo(0.6)
  expect(TIEMPOS_SIMULACION.principal).toBeGreaterThan(TIEMPOS_SIMULACION.secundaria * 2)
})

it('los ceda el paso pertenecen exclusivamente a accesos verticales', () => {
  const grupo = new THREE.Group()
  crearSenalesCeda(grupo)
  const esperadas = TRAMOS.filter(
    (t) =>
      t.eje === 'vertical' &&
      CRUCES.includes(t.hacia) &&
      !SEMAFOROS_BASE.some((s) => s.cruce === t.hacia && s.eje === t.eje),
  ).length
  expect(grupo.children).toHaveLength(esperadas)
  for (const senal of grupo.children) expect(senal.userData.eje).toBe('vertical')
})
