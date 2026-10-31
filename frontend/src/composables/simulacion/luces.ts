import type { FaseCruce, Tiempos } from '@/types/trafico'
import { CRUCES, METROS_POR_UNIDAD, TRAMOS, VELOCIDAD_OLA } from './mapa'

export const TIEMPOS_INICIALES: Tiempos = { principal: 30, secundaria: 15, amarillo: 3, todo_rojo: 2 }

export function validarTiempos(t: Tiempos): string | null {
  if (!Object.values(t).every(Number.isInteger)) return 'Usa segundos enteros.'
  if (t.principal < 15 || t.principal > 120) return 'Principal: entre 15 y 120 s.'
  if (t.secundaria < 10 || t.secundaria > 90) return 'Secundaria: entre 10 y 90 s.'
  if (t.principal <= t.secundaria) return 'La vía principal necesita más tiempo que la secundaria.'
  if (t.amarillo < 3 || t.amarillo > 10) return 'Amarillo: entre 3 y 10 s.'
  if (t.todo_rojo < 2 || t.todo_rojo > 10) return 'Todo rojo: entre 2 y 10 s.'
  return null
}

/**
 * Ajusta dinámicamente los tiempos de un cruce según los cierres viales activos
 * para relajar la congestión y evacuar desvíos de tráfico sin desperdiciar ciclos.
 */
export function adaptarTiemposPorCierres(cruceId: string, base: Tiempos, cierres?: Set<string>): Tiempos {
  if (!cierres || cierres.size === 0) return base

  const entradaH = TRAMOS.find((t) => t.hacia === cruceId && t.eje === 'horizontal')
  const entradaV = TRAMOS.find((t) => t.hacia === cruceId && t.eje === 'vertical')

  const hCerrado = entradaH ? cierres.has(entradaH.id) : false
  const vCerrado = entradaV ? cierres.has(entradaV.id) : false

  // Caso 1: Acceso vertical cerrado -> Se reduce secundaria al mínimo y se expande principal para aliviar la avenida
  if (vCerrado && !hCerrado) {
    const ahorro = Math.max(0, base.secundaria - 10)
    return {
      ...base,
      principal: Math.min(120, base.principal + ahorro),
      secundaria: 10,
    }
  }

  // Caso 2: Acceso horizontal cerrado -> Se da prioridad y mayor verde al eje vertical que absorbe los desvíos
  if (hCerrado && !vCerrado) {
    const extra = Math.min(25, Math.floor(base.principal * 0.4))
    return {
      ...base,
      principal: Math.max(15, base.principal - extra),
      secundaria: Math.min(90, base.secundaria + extra),
    }
  }

  // Caso 3: Tramo de salida cerrado (aguas abajo)
  const salidas = TRAMOS.filter((t) => t.de === cruceId && cierres.has(t.id))
  if (salidas.length > 0) {
    const salidaHCerrada = salidas.some((t) => t.eje === 'horizontal')
    const salidaVCerrada = salidas.some((t) => t.eje === 'vertical')
    if (salidaHCerrada && !salidaVCerrada) {
      return { ...base, principal: 15, secundaria: Math.min(90, base.secundaria + 20) }
    }
    if (salidaVCerrada && !salidaHCerrada) {
      return { ...base, principal: Math.min(120, base.principal + 15), secundaria: 10 }
    }
  }

  return base
}

export function calcularFase(id: string, tiempo: number, t: Tiempos, cierres?: Set<string>): FaseCruce {
  const tiemposActivos = adaptarTiemposPorCierres(id, t, cierres)
  const indice = CRUCES.indexOf(id)
  const columna = indice % 3
  const paso = (6 * METROS_POR_UNIDAD) / (VELOCIDAD_OLA / 3.6)
  const desfase = (indice < 3 ? 2 - columna : columna) * paso
  const ciclo =
    tiemposActivos.principal + tiemposActivos.secundaria + 2 * tiemposActivos.amarillo + 2 * tiemposActivos.todo_rojo
  const posicion = (((tiempo - desfase) % ciclo) + ciclo) % ciclo
  const fases: { duracion: number; horizontal: FaseCruce['horizontal']; vertical: FaseCruce['vertical'] }[] = [
    { duracion: tiemposActivos.principal, horizontal: 'verde', vertical: 'rojo' },
    { duracion: tiemposActivos.amarillo, horizontal: 'amarillo', vertical: 'rojo' },
    { duracion: tiemposActivos.todo_rojo, horizontal: 'rojo', vertical: 'rojo' },
    { duracion: tiemposActivos.secundaria, horizontal: 'rojo', vertical: 'verde' },
    { duracion: tiemposActivos.amarillo, horizontal: 'rojo', vertical: 'amarillo' },
    { duracion: tiemposActivos.todo_rojo, horizontal: 'rojo', vertical: 'rojo' },
  ]
  let acumulado = 0
  for (const fase of fases) {
    acumulado += fase.duracion
    if (posicion < acumulado)
      return { id, horizontal: fase.horizontal, vertical: fase.vertical, restante: acumulado - posicion }
  }
  return { id, horizontal: 'rojo', vertical: 'rojo', restante: 0 }
}
