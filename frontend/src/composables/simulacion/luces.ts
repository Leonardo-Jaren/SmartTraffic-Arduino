import type { FaseCruce, Tiempos } from '@/types/trafico'
import { CRUCES, METROS_POR_UNIDAD, VELOCIDAD_OLA } from './mapa'

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

export function calcularFase(id: string, tiempo: number, t: Tiempos): FaseCruce {
  const indice = CRUCES.indexOf(id)
  const columna = indice % 3
  const paso = (6 * METROS_POR_UNIDAD) / (VELOCIDAD_OLA / 3.6)
  const desfase = (indice < 3 ? 2 - columna : columna) * paso
  const ciclo = t.principal + t.secundaria + 2 * t.amarillo + 2 * t.todo_rojo
  const posicion = (((tiempo - desfase) % ciclo) + ciclo) % ciclo
  const fases: { duracion: number; horizontal: FaseCruce['horizontal']; vertical: FaseCruce['vertical'] }[] = [
    { duracion: t.principal, horizontal: 'verde', vertical: 'rojo' },
    { duracion: t.amarillo, horizontal: 'amarillo', vertical: 'rojo' },
    { duracion: t.todo_rojo, horizontal: 'rojo', vertical: 'rojo' },
    { duracion: t.secundaria, horizontal: 'rojo', vertical: 'verde' },
    { duracion: t.amarillo, horizontal: 'rojo', vertical: 'amarillo' },
    { duracion: t.todo_rojo, horizontal: 'rojo', vertical: 'rojo' },
  ]
  let acumulado = 0
  for (const fase of fases) {
    acumulado += fase.duracion
    if (posicion < acumulado)
      return { id, horizontal: fase.horizontal, vertical: fase.vertical, restante: acumulado - posicion }
  }
  return { id, horizontal: 'rojo', vertical: 'rojo', restante: 0 }
}
