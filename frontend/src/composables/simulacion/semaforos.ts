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
  if (modo === 'simulacion') {
    return fases.find((fase) => fase.id === semaforo.cruce)?.[semaforo.eje] ?? null
  }
  if (!dispositivo.conectado) return null
  if (dispositivo.colores && dispositivo.colores[indice]) {
    return dispositivo.colores[indice]
  }
  // Para hardware de 6 salidas (Arduino UNO sin registros), S7, S8 y S9 reflejan
  // de forma segura la fase complementaria de sus cruces (S2, S4 y S6).
  if (indice === 6) {
    const colS2 = dispositivo.colores?.[1]
    return colS2 === 'verde' || colS2 === 'amarillo' ? 'rojo' : 'verde'
  }
  if (indice === 7) {
    const colS4 = dispositivo.colores?.[3]
    return colS4 === 'verde' || colS4 === 'amarillo' ? 'rojo' : 'verde'
  }
  if (indice === 8) {
    const colS6 = dispositivo.colores?.[5]
    return colS6 === 'verde' || colS6 === 'amarillo' ? 'rojo' : 'verde'
  }
  return null
}
