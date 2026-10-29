export type Eje = 'horizontal' | 'vertical'
export type ColorSemaforo = 'rojo' | 'amarillo' | 'verde'
export type Modo = 'simulacion' | 'dispositivo'
export type Esquina = 'NO' | 'NE' | 'SO' | 'SE'
export interface UbicacionSemaforo {
  id: string
  esquina: Esquina
  giro: number
}

export interface Nodo {
  id: string
  x: number
  z: number
  tipo: 'cruce' | 'entrada' | 'salida'
}

export interface Tramo {
  id: string
  calle: string
  de: string
  hacia: string
  eje: Eje
  longitud: number
}

export interface Tiempos {
  principal: number
  secundaria: number
  amarillo: number
  todo_rojo: number
}

export interface FaseCruce {
  id: string
  horizontal: ColorSemaforo
  vertical: ColorSemaforo
  restante: number
}

export interface Vehiculo {
  id: number
  ruta: string[]
  indice: number
  progreso: number
  destino: string
  detenido: string
  reservado: string | null
  color: number
}

export interface LuzVirtual {
  id: number
  cruce: string
  eje: Eje
}

export interface Seleccion {
  tipo: 'tramo' | 'cruce' | 'luz' | 'semaforo'
  id: string
}

export interface EstadoDispositivo {
  fuente: 'arduino' | 'simulado'
  conectado: boolean
  modo: string
  colores: ColorSemaforo[]
  ultimo_reporte: string | null
  puerto: string
  error: string
  tiempos_confirmados: Tiempos | null
  ultimo_comando: { id: number; estado: string; mensaje: string; tiempos: Tiempos } | null
}
