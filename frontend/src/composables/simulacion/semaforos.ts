import type { ColorSemaforo, EstadoDispositivo, FaseCruce, Modo } from '@/types/trafico'
import { SEMAFOROS_BASE } from './mapa'

export function obtenerColorSemaforo(
  indice: number,
  modo: Modo,
  fases: FaseCruce[],
  dispositivo: EstadoDispositivo,
): ColorSemaforo | null {
  const semaforo = SEMAFOROS_BASE[indice]
  if (!semaforo) return null
  if (modo === 'simulacion') return fases.find((fase) => fase.id === semaforo.cruce)?.horizontal ?? null
  return dispositivo.conectado ? (dispositivo.colores[indice] ?? null) : null
}
