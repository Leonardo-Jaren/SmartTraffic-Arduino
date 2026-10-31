import { describe, expect, it } from 'vitest'
import type { FaseCruce, Vehiculo, EstadoDispositivo } from '@/types/trafico'
import {
  DISTANCIA_PARADA_CRUCE,
  obtenerTramo,
  CRUCES,
  NODOS,
  SEMAFOROS_BASE,
  TRAMOS,
  obtenerRotacionSemaforo,
} from './mapa'
import { calcularFase, TIEMPOS_INICIALES, validarTiempos, adaptarTiemposPorCierres } from './luces'
import { avanzarVehiculos } from './vehiculos'
import { calcularRuta, analizarImpactos } from './rutas'
import { obtenerColorSemaforo } from './semaforos'

function vehiculo(parcial: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id: 1,
    ruta: ['H1-1', 'H1-2', 'H1-3', 'H1-4'],
    indice: 0,
    progreso: obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE,
    destino: 'H1O',
    detenido: '',
    reservado: null,
    color: 0x53aee4,
    ...parcial,
  }
}

function fase(horizontal: FaseCruce['horizontal'], vertical: FaseCruce['vertical']): FaseCruce[] {
  return [{ id: 'I3', horizontal, vertical, restante: 4 }]
}

describe('sentidos y rutas', () => {
  it('representa nueve semáforos propuestos con contrapartes en avenidas', () => {
    expect(SEMAFOROS_BASE.map((s) => [s.id, s.cruce])).toEqual([
      ['S1', 'I1'],
      ['S2', 'I2'],
      ['S3', 'I3'],
      ['S4', 'I4'],
      ['S5', 'I5'],
      ['S6', 'I6'],
      ['S7', 'I2'],
      ['S8', 'I4'],
      ['S9', 'I6'],
    ])
  })
  it('mantiene las cinco vías en los sentidos confirmados', () => {
    for (const tramo of TRAMOS) {
      const a = NODOS[tramo.de]!,
        b = NODOS[tramo.hacia]!
      if (tramo.calle === 'H1') expect(b.x).toBeLessThan(a.x)
      if (tramo.calle === 'H2') expect(b.x).toBeGreaterThan(a.x)
      if (tramo.calle === 'V1' || tramo.calle === 'V3') expect(b.z).toBeLessThan(a.z)
      if (tramo.calle === 'V2') expect(b.z).toBeGreaterThan(a.z)
    }
  })
  it('orienta las caras contra el flujo de la vía que vigilan', () => {
    for (const semaforo of SEMAFOROS_BASE) {
      const entrada = TRAMOS.find((tramo) => tramo.hacia === semaforo.cruce && tramo.eje === semaforo.eje)!
      const origen = NODOS[entrada.de]!
      const destino = NODOS[entrada.hacia]!
      const giro = obtenerRotacionSemaforo(semaforo.cruce, semaforo.eje)
      const producto =
        (Math.sin(giro) * (destino.x - origen.x) + Math.cos(giro) * (destino.z - origen.z)) / entrada.longitud
      expect(producto, semaforo.id).toBeCloseTo(-1, 8)
    }
  })
  it('no atraviesa el tramo cerrado y muestra los recorridos afectados', () => {
    const cierres = new Set(['H1-2'])
    const ruta = calcularRuta('H1E', 'H1O', cierres)
    expect(ruta).toBeNull()
    expect(analizarImpactos(cierres).some((i) => i.ruta === 'H1E → H1O')).toBe(true)
  })
})

describe('fases seguras', () => {
  it('muestra el eje de cada luz del croquis o el dato reciente del dispositivo según el modo', () => {
    const dispositivo: EstadoDispositivo = {
      fuente: 'arduino',
      conectado: true,
      modo: 'ACTIVO',
      colores: ['rojo', 'rojo', 'verde', 'rojo', 'rojo', 'rojo'],
      ultimo_reporte: null,
      puerto: '',
      error: '',
      tiempos_confirmados: null,
      ultimo_comando: null,
    }
    const faseH: FaseCruce[] = CRUCES.map((id) => ({ id, horizontal: 'verde', vertical: 'rojo', restante: 4 }))
    const faseV: FaseCruce[] = CRUCES.map((id) => ({ id, horizontal: 'rojo', vertical: 'verde', restante: 4 }))
    expect(SEMAFOROS_BASE.map((_, i) => obtenerColorSemaforo(i, 'simulacion', faseH, dispositivo))).toEqual([
      'rojo',
      'verde',
      'rojo',
      'verde',
      'rojo',
      'verde',
      'rojo',
      'rojo',
      'rojo',
    ])
    expect(SEMAFOROS_BASE.map((_, i) => obtenerColorSemaforo(i, 'simulacion', faseV, dispositivo))).toEqual([
      'verde',
      'rojo',
      'verde',
      'rojo',
      'verde',
      'rojo',
      'verde',
      'verde',
      'verde',
    ])
    expect(obtenerColorSemaforo(2, 'simulacion', fase('rojo', 'amarillo'), dispositivo)).toBe('amarillo')
    expect(obtenerColorSemaforo(2, 'dispositivo', fase('rojo', 'verde'), dispositivo)).toBe('verde')
    dispositivo.conectado = false
    expect(obtenerColorSemaforo(2, 'dispositivo', fase('verde', 'rojo'), dispositivo)).toBeNull()
  })
  it('nunca da verde simultáneo a las dos vías de un cruce', () => {
    for (let t = 0; t < 500; t += 0.25)
      for (const id of ['I1', 'I2', 'I3', 'I4', 'I5', 'I6']) {
        const resultado = calcularFase(id, t, TIEMPOS_INICIALES)
        expect(resultado.horizontal === 'verde' && resultado.vertical === 'verde').toBe(false)
      }
  })
  it('incluye amarillo y todo rojo antes de habilitar la secundaria', () => {
    expect(calcularFase('I3', 30, TIEMPOS_INICIALES).horizontal).toBe('amarillo')
    expect(calcularFase('I3', 33, TIEMPOS_INICIALES)).toMatchObject({ horizontal: 'rojo', vertical: 'rojo' })
    expect(calcularFase('I3', 35, TIEMPOS_INICIALES).vertical).toBe('verde')
  })
  it('rechaza duraciones inseguras y conserva prioridad principal', () => {
    expect(validarTiempos({ ...TIEMPOS_INICIALES, amarillo: 1 })).not.toBeNull()
    expect(validarTiempos({ ...TIEMPOS_INICIALES, principal: 15, secundaria: 20 })).not.toBeNull()
    expect(validarTiempos(TIEMPOS_INICIALES)).toBeNull()
  })
  it('adapta dinámicamente los tiempos ante cierres de calles para relajar el tráfico', () => {
    // Al cerrar V1-2 hacia I1, el cruce I1 optimiza dando más verde a la avenida horizontal
    const adaptados = adaptarTiemposPorCierres('I1', TIEMPOS_INICIALES, new Set(['V1-2']))
    expect(adaptados.secundaria).toBe(10)
    expect(adaptados.principal).toBeGreaterThan(TIEMPOS_INICIALES.principal)

    // Al cerrar H1-2 hacia I2, se da más tiempo a la vía vertical para el desvío
    const adaptadosH = adaptarTiemposPorCierres('I2', TIEMPOS_INICIALES, new Set(['H1-2']))
    expect(adaptadosH.secundaria).toBeGreaterThan(TIEMPOS_INICIALES.secundaria)
  })
})

describe('movimiento de vehículos', () => {
  it('se detiene ante rojo y ante un cierre en el tramo actual', () => {
    const auto = vehiculo()
    avanzarVehiculos([auto], 0.1, new Set(), fase('rojo', 'verde'), 30)
    expect(auto.progreso).toBe(obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE)
    expect(auto.detenido).toBe('semáforo')
    avanzarVehiculos([auto], 0.1, new Set(['H1-1']), fase('verde', 'rojo'), 30)
    expect(auto.progreso).toBe(obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE)
    expect(auto.detenido).toBe('tramo cerrado')
  })
  it('busca otra salida cuando el destino queda bloqueado', () => {
    const auto = vehiculo()
    avanzarVehiculos([auto], 0.1, new Set(['H1-2']), fase('verde', 'rojo'), 30)
    expect(auto.ruta[1]).toBe('V3-3')
    expect(auto.destino).toBe('V3N')
  })
  it('no deja entrar otro vehículo mientras el cruce está reservado', () => {
    const dentro = vehiculo({ id: 1, ruta: ['H1-2', 'H1-3', 'H1-4'], progreso: 0.1, reservado: 'I3' })
    const esperando = vehiculo({
      id: 2,
      ruta: ['V3-2', 'V3-3'],
      progreso: obtenerTramo('V3-2')!.longitud - DISTANCIA_PARADA_CRUCE,
      destino: 'V3N',
    })
    avanzarVehiculos([dentro, esperando], 0.1, new Set(), fase('rojo', 'verde'), 30)
    expect(esperando.progreso).toBe(obtenerTramo('V3-2')!.longitud - DISTANCIA_PARADA_CRUCE)
    expect(esperando.detenido).toBe('cruce ocupado')
  })
  it('espera cuando la salida del cruce está ocupada', () => {
    const entrante = vehiculo()
    const delante = vehiculo({ id: 2, ruta: ['H1-2', 'H1-3', 'H1-4'], progreso: 0.3 })
    avanzarVehiculos([entrante, delante], 0.1, new Set(), fase('verde', 'rojo'), 30)
    expect(entrante.progreso).toBe(obtenerTramo('H1-1')!.longitud - DISTANCIA_PARADA_CRUCE)
    expect(entrante.detenido).toBe('salida ocupada')
  })
})
