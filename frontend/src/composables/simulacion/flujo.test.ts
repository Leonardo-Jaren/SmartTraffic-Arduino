import { movimientosCompatibles } from './movimientos'
import { afterEach, expect, it, vi } from 'vitest'
import type { Vehiculo } from '@/types/trafico'
import { CRUCES, DISTANCIA_PARADA_CRUCE, obtenerTramo } from './mapa'
import { calcularFase, TIEMPOS_SIMULACION, validarTiempos } from './luces'
import { avanzarVehiculos, crearVehiculo } from './vehiculos'

afterEach(() => vi.restoreAllMocks())

it('los tiempos de animación no pasan la validación del dispositivo físico', () => {
  expect(validarTiempos(TIEMPOS_SIMULACION, true)).toBeNull()
  expect(validarTiempos(TIEMPOS_SIMULACION)).not.toBeNull()
  for (let t = 0; t < 200; t += 0.1) {
    for (const id of CRUCES) {
      const fase = calcularFase(id, t, TIEMPOS_SIMULACION)
      expect(fase.horizontal === 'rojo' || fase.vertical === 'rojo').toBe(true)
    }
  }
})

it('no caduca una reserva ocupada aunque el vehículo esté inmóvil más de siete segundos', () => {
  const dentro: Vehiculo = {
    id: 1,
    ruta: ['H1-2', 'H1-3', 'H1-4'],
    indice: 0,
    progreso: 0.2,
    destino: 'H1O',
    detenido: '',
    reservado: 'I3',
    color: 0xffffff,
  }
  const esperando: Vehiculo = {
    ...dentro,
    id: 2,
    ruta: ['V3-2', 'V3-3'],
    destino: 'V3N',
    reservado: null,
    progreso: obtenerTramo('V3-2')!.longitud - DISTANCIA_PARADA_CRUCE,
  }
  const fases = CRUCES.map((id) => ({ id, horizontal: 'rojo' as const, vertical: 'verde' as const, restante: 20 }))
  for (let i = 0; i < 100; i++) avanzarVehiculos([dentro, esperando], 0.1, new Set(), fases, 0)
  avanzarVehiculos([dentro, esperando], 0.1, new Set(), fases, 30)
  expect(esperando.reservado).toBeNull()
  expect(esperando.detenido).toBe('cruce ocupado')
})

it.each([24, 48])('mantiene flujo con el perfil corto y objetivo de %i coches durante cinco minutos', (objetivo) => {
  let semilla = 7147
  vi.spyOn(Math, 'random').mockImplementation(() => {
    semilla = (semilla * 16807) % 2147483647
    return (semilla - 1) / 2147483646
  })
  let coches: Vehiculo[] = []
  let siguiente = 0
  let ultimoIngreso = -1
  let salidas = 0
  let muestras = 0
  let detenidos = 0
  let todosDetenidos = 0
  for (let paso = 0; paso < 3000; paso++) {
    const tiempo = paso / 10
    const fases = CRUCES.map((id) => calcularFase(id, tiempo, TIEMPOS_SIMULACION))
    const anteriores = new Map(coches.map((coche) => [coche.id, { ...coche }]))
    const cantidadAnterior = coches.length
    coches = avanzarVehiculos(coches, 0.1, new Set(), fases, 30)
    salidas += cantidadAnterior - coches.length
    for (const a of coches)
      for (const b of coches) {
        if (a.id < b.id && a.reservado && a.reservado === b.reservado)
          expect(movimientosCompatibles(a, b, a.reservado)).toBe(true)
      }
    for (const coche of coches) {
      const previo = anteriores.get(coche.id)!
      if (coche.reservado && coche.reservado !== previo.reservado) {
        const tramo = obtenerTramo(previo.ruta[previo.indice]!)!
        expect(fases.find((fase) => fase.id === coche.reservado)?.[tramo.eje]).toBe('verde')
      }
    }
    if (coches.length < objetivo && tiempo - ultimoIngreso >= 0.7) {
      const nuevo = crearVehiculo(siguiente++, coches, new Set())
      if (nuevo) coches.push(nuevo)
      ultimoIngreso = tiempo
    }
    if (tiempo > 30) {
      const parados = coches.filter((coche) => coche.detenido).length
      muestras += coches.length
      detenidos += parados
      if (coches.length && parados === coches.length) todosDetenidos += 0.1
    }
  }
  expect(salidas).toBeGreaterThan(100)
  expect(detenidos / muestras).toBeLessThan(objetivo === 24 ? 0.6 : 0.8)
  expect(todosDetenidos).toBeLessThan(5)
})

it('un cierre prolongado no hace desaparecer vehículos de la simulación', () => {
  const coche: Vehiculo = {
    id: 1,
    ruta: ['H1-1', 'H1-2', 'H1-3', 'H1-4'],
    indice: 0,
    progreso: 1,
    destino: 'H1O',
    detenido: '',
    reservado: null,
    color: 0xffffff,
  }
  let coches = [coche]
  for (let i = 0; i < 200; i++) coches = avanzarVehiculos(coches, 0.1, new Set(['H1-1']), [], 30)
  expect(coches).toHaveLength(1)
  expect(coche.progreso).toBe(1)
  expect(coche.detenido).toBe('tramo cerrado')
  avanzarVehiculos(coches, 0.1, new Set(), [], 30)
  expect(coche.progreso).toBeGreaterThan(1)
})
