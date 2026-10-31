import { expect, it } from 'vitest'
import type { Vehiculo } from '@/types/trafico'
import { avanzarVehiculos, crearVehiculo, obtenerCoordenadasVehiculo } from './vehiculos'
import { ANCHO_CARRIL, CRUCES, DISTANCIA_PARADA_CRUCE, ENTRADAS, TRAMOS, obtenerTramo } from './mapa'
import { obtenerPosicionVehiculo } from '../escena/trayectorias'

const auto = (carril: 0 | 1, progreso = 0): Vehiculo => ({
  id: carril + 1,
  carril,
  ruta: ['H1-1', 'H1-2', 'H1-3', 'H1-4'],
  indice: 0,
  progreso,
  destino: 'H1O',
  reservado: null,
  detenido: '',
  color: 0xffffff,
})

it('dos coches a la misma altura avanzan por carriles paralelos en el mismo sentido', () => {
  const coches = [auto(0), auto(1)]
  avanzarVehiculos(coches, 0.1, new Set(), [], 30)
  const [a, b] = coches.map((coche) => obtenerCoordenadasVehiculo(coche)!)
  expect(coches[0]!.progreso).toBeGreaterThan(0)
  expect(coches[1]!.progreso).toBe(coches[0]!.progreso)
  expect(a!.dx).toBe(b!.dx)
  expect(a!.dx).toBeLessThan(0)
  expect(Math.abs(a!.z - b!.z)).toBeCloseTo(ANCHO_CARRIL)
  for (const coche of coches) {
    const grafica = obtenerPosicionVehiculo(coche, obtenerTramo('H1-1')!)
    expect(grafica.x).toBeCloseTo(obtenerCoordenadasVehiculo(coche)!.x)
    expect(grafica.z).toBeCloseTo(obtenerCoordenadasVehiculo(coche)!.z)
  }
})

it('permite ingresar en el carril libre aunque todas las entradas tengan ocupado el otro', () => {
  const ocupados = ENTRADAS.map((entrada, id) => ({
    ...auto(0),
    id,
    ruta: [TRAMOS.find((tramo) => tramo.de === entrada.id)!.id],
  }))
  const nuevo = crearVehiculo(99, ocupados, new Set())
  expect(nuevo).not.toBeNull()
  expect(nuevo!.carril).toBe(1)
})

it('los dos carriles paran ante rojo sin reservar el cruce', () => {
  const linea = obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE
  const coches = [auto(0, linea), auto(1, linea)]
  const fases = CRUCES.map((id) => ({ id, horizontal: 'rojo' as const, vertical: 'verde' as const, restante: 5 }))
  avanzarVehiculos(coches, 0.1, new Set(), fases, 120)
  for (const coche of coches) {
    expect(coche.progreso).toBe(linea)
    expect(coche.reservado).toBeNull()
  }
})

it.each([0, 1] as const)('el giro del carril %i conserva continuidad al cambiar de tramo', (carril) => {
  const coche = { ...auto(carril), ruta: ['H1-1', 'V3-3'], progreso: obtenerTramo('H1-1')!.longitud }
  const entrada = obtenerPosicionVehiculo(coche, obtenerTramo('H1-1')!)
  coche.indice = 1
  coche.progreso = 0
  const salida = obtenerPosicionVehiculo(coche, obtenerTramo('V3-3')!)
  expect(entrada.x).toBeCloseTo(salida.x)
  expect(entrada.z).toBeCloseTo(salida.z)
  expect(entrada.dx).toBeCloseTo(salida.dx)
  expect(entrada.dz).toBeCloseTo(salida.dz)
})
