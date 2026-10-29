import { describe, expect, it } from 'vitest'
import type { EstadoDispositivo, FaseCruce, Vehiculo } from '@/types/trafico'
import { calcularFase, TIEMPOS_INICIALES, validarTiempos } from './luces'
import { NODOS, SEMAFOROS_BASE, TRAMOS } from './mapa'
import { analizarImpactos, calcularRuta } from './rutas'
import { obtenerColorSemaforo } from './semaforos'
import { avanzarVehiculos } from './vehiculos'

function vehiculo(parcial: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id: 1,
    ruta: ['H1-1', 'H1-2', 'H1-3', 'H1-4'],
    indice: 0,
    progreso: 3.3,
    destino: 'H1O',
    detenido: '',
    reservado: null,
    color: 0xffffff,
    ...parcial,
  }
}

function fase(horizontal: FaseCruce['horizontal'], vertical: FaseCruce['vertical']): FaseCruce[] {
  return [{ id: 'I3', horizontal, vertical, restante: 4 }]
}

describe('sentidos y rutas', () => {
  it('representa seis semáforos propuestos, uno por cruce', () => {
    expect(SEMAFOROS_BASE.map((s) => [s.id, s.cruce])).toEqual([
      ['S1', 'I1'],
      ['S2', 'I2'],
      ['S3', 'I3'],
      ['S4', 'I4'],
      ['S5', 'I5'],
      ['S6', 'I6'],
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
  it('no atraviesa el tramo cerrado y muestra los recorridos afectados', () => {
    const cierres = new Set(['H1-2'])
    const ruta = calcularRuta('H1E', 'H1O', cierres)
    expect(ruta).toBeNull()
    expect(analizarImpactos(cierres).some((i) => i.ruta === 'H1E → H1O')).toBe(true)
  })
})

describe('fases seguras', () => {
  it('muestra la fase horizontal o el dato reciente del dispositivo según el modo', () => {
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
    expect(obtenerColorSemaforo(2, 'simulacion', fase('amarillo', 'rojo'), dispositivo)).toBe('amarillo')
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
})

describe('movimiento de vehículos', () => {
  it('se detiene ante rojo y ante un cierre en el tramo actual', () => {
    const auto = vehiculo()
    avanzarVehiculos([auto], 0.1, new Set(), fase('rojo', 'verde'), 30)
    expect(auto.progreso).toBe(3.3)
    expect(auto.detenido).toBe('semáforo')
    avanzarVehiculos([auto], 0.1, new Set(['H1-1']), fase('verde', 'rojo'), 30)
    expect(auto.progreso).toBe(3.3)
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
    const esperando = vehiculo({ id: 2, ruta: ['V3-2', 'V3-3'], progreso: 7.3, destino: 'V3N' })
    avanzarVehiculos([dentro, esperando], 0.1, new Set(), fase('rojo', 'verde'), 30)
    expect(esperando.progreso).toBe(7.3)
    expect(esperando.detenido).toBe('cruce ocupado')
  })
  it('espera cuando la salida del cruce está ocupada', () => {
    const entrante = vehiculo()
    const delante = vehiculo({ id: 2, ruta: ['H1-2', 'H1-3', 'H1-4'], progreso: 0.3 })
    avanzarVehiculos([entrante, delante], 0.1, new Set(), fase('verde', 'rojo'), 30)
    expect(entrante.progreso).toBe(3.3)
    expect(entrante.detenido).toBe('salida ocupada')
  })
})
