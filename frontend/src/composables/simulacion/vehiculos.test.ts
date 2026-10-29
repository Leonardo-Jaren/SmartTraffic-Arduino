import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ColorSemaforo, FaseCruce, Vehiculo } from '@/types/trafico'
import {
  CRUCES,
  DISTANCIA_LIBRE_CRUCE,
  DISTANCIA_LINEA_CRUCE,
  DISTANCIA_PARADA_CRUCE,
  ENTRADAS,
  NODOS,
  SEMAFOROS_BASE,
  SEPARACION_SEGURA_VEHICULOS,
  TRAMOS,
  obtenerTramo,
} from './mapa'
import { calcularFase, TIEMPOS_INICIALES } from './luces'
import { avanzarVehiculos, crearVehiculo } from './vehiculos'

function auto(cambios: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id: 1,
    ruta: ['H1-1', 'H1-2', 'H1-3', 'H1-4'],
    indice: 0,
    progreso: 0,
    destino: 'H1O',
    detenido: '',
    reservado: null,
    color: 0xffffff,
    ...cambios,
  }
}

function fases(horizontal: ColorSemaforo, vertical: ColorSemaforo): FaseCruce[] {
  return CRUCES.map((id) => ({ id, horizontal, vertical, restante: 10 }))
}

const lineaH1 = obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE

afterEach(() => vi.restoreAllMocks())

describe('entrada y despeje de cruces', () => {
  it.each([...SEMAFOROS_BASE])('el auto que se acerca a $id obedece el eje de esa luz', (semaforo) => {
    const entrada = TRAMOS.find((tramo) => tramo.hacia === semaforo.cruce && tramo.eje === semaforo.eje)!
    const calle = TRAMOS.filter((tramo) => tramo.calle === entrada.calle)
    const ruta = calle.slice(calle.indexOf(entrada)).map((tramo) => tramo.id)
    const coche = auto({ ruta, progreso: entrada.longitud - DISTANCIA_PARADA_CRUCE, destino: calle.at(-1)!.hacia })
    const rojo = semaforo.eje === 'horizontal' ? fases('rojo', 'verde') : fases('verde', 'rojo')
    avanzarVehiculos([coche], 0.1, new Set(), rojo, 120)
    expect(coche.progreso).toBe(entrada.longitud - DISTANCIA_PARADA_CRUCE)
    expect(coche.reservado).toBeNull()
    const verde = semaforo.eje === 'horizontal' ? fases('verde', 'rojo') : fases('rojo', 'verde')
    avanzarVehiculos([coche], 0.1, new Set(), verde, 120)
    expect(coche.progreso).toBeGreaterThan(entrada.longitud - DISTANCIA_PARADA_CRUCE)
    expect(coche.reservado).toBe(semaforo.cruce)
  })

  it.each(['rojo', 'amarillo'] as const)('frena antes de la línea en %s, incluso a 120 km/h', (color) => {
    const coche = auto()
    for (let paso = 0; paso < 80; paso++) avanzarVehiculos([coche], 0.1, new Set(), fases(color, 'rojo'), 120)
    expect(coche.progreso).toBeCloseTo(lineaH1, 8)
    expect(4 - coche.progreso - 0.85).toBeCloseTo(DISTANCIA_LINEA_CRUCE, 8)
    expect(coche.reservado).toBeNull()
    expect(coche.detenido).toBe('semáforo')
  })

  it('espera si no conoce la fase del cruce', () => {
    const coche = auto({ progreso: lineaH1 })
    avanzarVehiculos([coche], 0.1, new Set(), [], 80)
    expect(coche.progreso).toBe(lineaH1)
    expect(coche.reservado).toBeNull()
  })

  it('no entra con verde cuando una cola impediría salir del cruce', () => {
    const entrante = auto({ progreso: lineaH1 })
    const cola = auto({ id: 2, indice: 1, progreso: 6 - DISTANCIA_PARADA_CRUCE })
    const estado = fases('rojo', 'rojo')
    estado.find((fase) => fase.id === 'I3')!.horizontal = 'verde'
    for (let paso = 0; paso < 80; paso++) avanzarVehiculos([entrante, cola], 0.1, new Set(), estado, 30)
    expect(entrante.progreso).toBe(lineaH1)
    expect(entrante.reservado).toBeNull()
    expect(entrante.detenido).toBe('salida ocupada')
    expect(cola.progreso).toBeCloseTo(6 - DISTANCIA_PARADA_CRUCE, 8)
  })

  it('termina de despejar un cruce autorizado aunque el verde cambie a rojo', () => {
    const coche = auto({ progreso: lineaH1 })
    avanzarVehiculos([coche], 0.1, new Set(), fases('verde', 'rojo'), 30)
    expect(coche.reservado).toBe('I3')
    for (let paso = 0; paso < 60 && coche.reservado; paso++) {
      avanzarVehiculos([coche], 0.1, new Set(), fases('rojo', 'rojo'), 30)
      if (coche.indice === 1 && coche.progreso < DISTANCIA_LIBRE_CRUCE) expect(coche.reservado).toBe('I3')
    }
    expect(coche.indice).toBe(1)
    expect(coche.progreso).toBeGreaterThanOrEqual(DISTANCIA_LIBRE_CRUCE)
    expect(coche.reservado).toBeNull()
  })

  it('reserva un solo movimiento por cruce aunque se reciban dos verdes', () => {
    const horizontal = auto({ progreso: lineaH1 })
    const vertical = auto({
      id: 2,
      ruta: ['V3-2', 'V3-3'],
      progreso: 8 - DISTANCIA_PARADA_CRUCE,
      destino: 'V3N',
    })
    avanzarVehiculos([horizontal, vertical], 0.1, new Set(), fases('verde', 'verde'), 120)
    expect([horizontal, vertical].filter((coche) => coche.reservado === 'I3')).toHaveLength(1)
    expect([horizontal, vertical].filter((coche) => coche.detenido === 'cruce ocupado')).toHaveLength(1)
  })

  it('una intención sin movimiento no ocupa un cruce ni hace retroceder el auto', () => {
    const coche = auto({ progreso: lineaH1 })
    for (const velocidad of [0, -30, Number.NaN])
      avanzarVehiculos([coche], 0.1, new Set(), fases('verde', 'rojo'), velocidad)
    expect(coche.progreso).toBe(lineaH1)
    expect(coche.reservado).toBeNull()
  })
})

describe('espaciado de vehículos', () => {
  it('no crea otro auto si todas las entradas carecen de espacio', () => {
    const ocupados = ENTRADAS.map((entrada, indice) =>
      auto({
        id: indice,
        ruta: [TRAMOS.find((tramo) => tramo.de === entrada.id)!.id],
        progreso: SEPARACION_SEGURA_VEHICULOS - 0.01,
      }),
    )
    expect(crearVehiculo(99, ocupados, new Set())).toBeNull()
  })

  it('conserva la distancia de la cola a ambos lados del cambio de tramo', () => {
    const delantero = auto({ id: 1, indice: 1, progreso: 0.4, reservado: 'I3' })
    const siguiente = auto({ id: 2, progreso: 4.4 - SEPARACION_SEGURA_VEHICULOS })
    avanzarVehiculos([siguiente, delantero], 0.1, new Set(), fases('verde', 'rojo'), 120)
    expect(4 + delantero.progreso - siguiente.progreso).toBeGreaterThanOrEqual(SEPARACION_SEGURA_VEHICULOS)
    expect(siguiente.reservado).toBeNull()
  })
})

function coordenadaEnCalle(coche: Vehiculo) {
  const tramo = obtenerTramo(coche.ruta[coche.indice]!)!
  const inicio = NODOS[tramo.de]!
  const fin = NODOS[tramo.hacia]!
  const dx = (fin.x - inicio.x) / tramo.longitud
  const dz = (fin.z - inicio.z) / tramo.longitud
  return { calle: tramo.calle, posicion: inicio.x * dx + inicio.z * dz + coche.progreso }
}

describe('tráfico continuo con fases y cierres', () => {
  it.each([8, 24])('despeja los %i autos después de detener los ingresos y reabrir las calles', (cantidad) => {
    let semilla = 7147
    vi.spyOn(Math, 'random').mockImplementation(() => {
      semilla = (semilla * 16807) % 2147483647
      return (semilla - 1) / 2147483646
    })
    let coches: Vehiculo[] = []
    let id = 0
    for (let paso = 0; paso < 5000; paso++) {
      const tiempo = paso / 10
      const estado = CRUCES.map((cruce) => calcularFase(cruce, tiempo, TIEMPOS_INICIALES))
      const cierres = new Set(paso >= 900 && paso < 1200 ? ['H1-2'] : [])
      coches = avanzarVehiculos(coches, 0.1, cierres, estado, 30)
      if (paso < 1200 && coches.length < cantidad) {
        const nuevo = crearVehiculo(id++, coches, cierres)
        if (nuevo) coches.push(nuevo)
      }
    }
    expect(coches.map(({ id, detenido, reservado }) => ({ id, detenido, reservado }))).toEqual([])
  })

  it.each([
    [8, 30],
    [24, 120],
  ])('mantiene invariantes durante 5 minutos con objetivo %i autos a %i km/h', (cantidad, velocidad) => {
    let semilla = 94721
    vi.spyOn(Math, 'random').mockImplementation(() => {
      semilla = (semilla * 16807) % 2147483647
      return (semilla - 1) / 2147483646
    })
    let coches: Vehiculo[] = []
    let id = 0
    let salieron = 0
    let maximoPresentes = 0
    for (let paso = 0; paso < 3000; paso++) {
      const tiempo = paso / 10
      const estado = CRUCES.map((cruce) => calcularFase(cruce, tiempo, TIEMPOS_INICIALES))
      const cierres = new Set(paso >= 900 && paso < 1200 ? ['H1-2'] : [])
      const anteriores = new Map(coches.map((coche) => [coche.id, { ...coche }]))
      const cantidadAnterior = coches.length
      coches = avanzarVehiculos(coches, 0.1, cierres, estado, velocidad)
      salieron += cantidadAnterior - coches.length
      if (coches.length < cantidad) {
        const nuevo = crearVehiculo(id++, coches, cierres)
        if (nuevo) coches.push(nuevo)
      }
      maximoPresentes = Math.max(maximoPresentes, coches.length)
      const reservas = coches.filter((coche) => coche.reservado).map((coche) => coche.reservado)
      if (new Set(reservas).size !== reservas.length) throw new Error(`Cruce reservado dos veces en ${tiempo}s`)
      for (const coche of coches) {
        const previo = anteriores.get(coche.id)
        if (previo && coche.reservado && coche.reservado !== previo.reservado) {
          const tramo = obtenerTramo(previo.ruta[previo.indice]!)!
          if (estado.find((fase) => fase.id === coche.reservado)?.[tramo.eje] !== 'verde') {
            throw new Error(`Entrada sin verde de ${coche.id} en ${tiempo}s`)
          }
        }
        const actual = coordenadaEnCalle(coche)
        for (const otro of coches) {
          if (otro.id <= coche.id) continue
          const siguiente = coordenadaEnCalle(otro)
          if (
            actual.calle === siguiente.calle &&
            Math.abs(actual.posicion - siguiente.posicion) < SEPARACION_SEGURA_VEHICULOS - 1e-8
          ) {
            throw new Error(`Cola sin separación en ${tiempo}s: ${JSON.stringify([coche, otro])}`)
          }
        }
      }
    }
    // El objetivo no obliga a insertar autos en entradas que ya están llenas.
    expect(maximoPresentes).toBeGreaterThanOrEqual(Math.min(cantidad, 12))
    expect(maximoPresentes).toBeLessThanOrEqual(cantidad)
    expect(salieron).toBeGreaterThan(10)
  })
})
