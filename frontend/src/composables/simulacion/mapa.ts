import type { Eje, Nodo, Tramo } from '@/types/trafico'

export const NODOS: Record<string, Nodo> = {
  I1: { id: 'I1', x: -6, z: -4, tipo: 'cruce' },
  I2: { id: 'I2', x: 0, z: -4, tipo: 'cruce' },
  I3: { id: 'I3', x: 6, z: -4, tipo: 'cruce' },
  I4: { id: 'I4', x: -6, z: 4, tipo: 'cruce' },
  I5: { id: 'I5', x: 0, z: 4, tipo: 'cruce' },
  I6: { id: 'I6', x: 6, z: 4, tipo: 'cruce' },
  H1E: { id: 'H1E', x: 10, z: -4, tipo: 'entrada' },
  H1O: { id: 'H1O', x: -10, z: -4, tipo: 'salida' },
  H2O: { id: 'H2O', x: -10, z: 4, tipo: 'entrada' },
  H2E: { id: 'H2E', x: 10, z: 4, tipo: 'salida' },
  V1S: { id: 'V1S', x: -6, z: 8, tipo: 'entrada' },
  V1N: { id: 'V1N', x: -6, z: -8, tipo: 'salida' },
  V2N: { id: 'V2N', x: 0, z: -8, tipo: 'entrada' },
  V2S: { id: 'V2S', x: 0, z: 8, tipo: 'salida' },
  V3S: { id: 'V3S', x: 6, z: 8, tipo: 'entrada' },
  V3N: { id: 'V3N', x: 6, z: -8, tipo: 'salida' },
}

function crearTramos(calle: string, eje: Eje, secuencia: string[]): Tramo[] {
  return secuencia.slice(0, -1).map((de, indice) => {
    const hacia = secuencia[indice + 1]!
    const inicio = NODOS[de]!
    const fin = NODOS[hacia]!
    return {
      id: `${calle}-${indice + 1}`,
      calle,
      de,
      hacia,
      eje,
      longitud: Math.hypot(fin.x - inicio.x, fin.z - inicio.z),
    }
  })
}

// Los sentidos de circulación fueron confirmados por el usuario.
export const TRAMOS: Tramo[] = [
  ...crearTramos('H1', 'horizontal', ['H1E', 'I3', 'I2', 'I1', 'H1O']),
  ...crearTramos('H2', 'horizontal', ['H2O', 'I4', 'I5', 'I6', 'H2E']),
  ...crearTramos('V1', 'vertical', ['V1S', 'I4', 'I1', 'V1N']),
  ...crearTramos('V2', 'vertical', ['V2N', 'I2', 'I5', 'V2S']),
  ...crearTramos('V3', 'vertical', ['V3S', 'I6', 'I3', 'V3N']),
]

export const CRUCES = ['I1', 'I2', 'I3', 'I4', 'I5', 'I6']
export const ENTRADAS = Object.values(NODOS).filter((n) => n.tipo === 'entrada')
export const SALIDAS = Object.values(NODOS).filter((n) => n.tipo === 'salida')
export const METROS_POR_UNIDAD = 5
export const VELOCIDAD_OLA = 30
export const SEPARACION_SEGURA_VEHICULOS = 1.8
export const DISTANCIA_LINEA_CRUCE = 1.85
export const DISTANCIA_LIBRE_CRUCE = 2
export const RADIO_GIRO_VEHICULO = 0.9

// S1–S6 ocupan los seis puntos rojos del esquema; las coordenadas son aproximadas.
export const SEMAFOROS_BASE = [
  { id: 'S1', cruce: 'I1', dx: -1.3, dz: -1.3 },
  { id: 'S2', cruce: 'I2', dx: -1.3, dz: 1.3 },
  { id: 'S3', cruce: 'I3', dx: -1.3, dz: -1.3 },
  { id: 'S4', cruce: 'I4', dx: 1.3, dz: -1.3 },
  { id: 'S5', cruce: 'I5', dx: 1.3, dz: 1.3 },
  { id: 'S6', cruce: 'I6', dx: 1.3, dz: -1.3 },
] as const

export function obtenerRotacionSemaforo(cruce: string, eje: Eje): number {
  const entrada = TRAMOS.find((tramo) => tramo.hacia === cruce && tramo.eje === eje)
  if (!entrada) return 0
  const origen = NODOS[entrada.de]!
  const destino = NODOS[entrada.hacia]!
  return Math.atan2(origen.x - destino.x, origen.z - destino.z)
}

export function obtenerTramo(id: string): Tramo | undefined {
  return TRAMOS.find((tramo) => tramo.id === id)
}
