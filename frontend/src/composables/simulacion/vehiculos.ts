import type { FaseCruce, Vehiculo } from '@/types/trafico'
import { ENTRADAS, METROS_POR_UNIDAD, NODOS, SALIDAS, obtenerTramo } from './mapa'
import { calcularRuta } from './rutas'

const COLORES = [0xf6b945, 0x53aee4, 0xf07368, 0xf0eee5, 0x85c7a4]
const DISTANCIA_SEGURA = 0.9
const MARGEN_CRUCE = 0.7

export function crearVehiculo(id: number, actuales: Vehiculo[], cierres: Set<string>): Vehiculo | null {
  const entradas = [...ENTRADAS].sort(() => Math.random() - 0.5)
  const salidas = [...SALIDAS].sort(() => Math.random() - 0.5)
  for (const entrada of entradas) {
    for (const salida of salidas) {
      const ruta = calcularRuta(entrada.id, salida.id, cierres)
      if (!ruta?.length) continue
      if (actuales.some((v) => v.ruta[v.indice] === ruta[0] && v.progreso < DISTANCIA_SEGURA)) continue
      return {
        id,
        ruta,
        indice: 0,
        progreso: 0,
        destino: salida.id,
        detenido: '',
        reservado: null,
        color: COLORES[id % COLORES.length]!,
      }
    }
  }
  return null
}

function actualizarRuta(vehiculo: Vehiculo, hacia: string, cierres: Set<string>): boolean {
  const siguiente = vehiculo.ruta[vehiculo.indice + 1]
  if (siguiente && !cierres.has(siguiente)) return true
  let alternativa = calcularRuta(hacia, vehiculo.destino, cierres)
  if (!alternativa?.length) {
    for (const salida of SALIDAS) {
      const desvio = calcularRuta(hacia, salida.id, cierres)
      if (desvio?.length) {
        alternativa = desvio
        vehiculo.destino = salida.id
        break
      }
    }
  }
  if (!alternativa?.length) return false
  vehiculo.ruta = [...vehiculo.ruta.slice(0, vehiculo.indice + 1), ...alternativa]
  return true
}

export function avanzarVehiculos(
  vehiculos: Vehiculo[],
  segundos: number,
  cierres: Set<string>,
  fases: FaseCruce[],
  velocidad: number,
): Vehiculo[] {
  const distancia = (Math.max(0, Math.min(segundos, 0.1)) * (velocidad / 3.6)) / METROS_POR_UNIDAD
  const reservas = new Map(vehiculos.filter((v) => v.reservado).map((v) => [v.reservado!, v.id]))
  const terminados = new Set<number>()
  const ordenados = [...vehiculos].sort((a, b) => b.progreso - a.progreso)
  for (const vehiculo of ordenados) {
    const tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
    if (!tramo) {
      terminados.add(vehiculo.id)
      continue
    }
    vehiculo.detenido = ''
    if (cierres.has(tramo.id)) {
      vehiculo.detenido = 'tramo cerrado'
      continue
    }
    const destino = NODOS[tramo.hacia]!
    let limite = tramo.longitud
    if (destino.tipo === 'cruce' && vehiculo.reservado !== destino.id) {
      const linea = tramo.longitud - MARGEN_CRUCE
      const fase = fases.find((f) => f.id === destino.id)
      const libre = !reservas.has(destino.id) || reservas.get(destino.id) === vehiculo.id
      const rutaDisponible = actualizarRuta(vehiculo, destino.id, cierres)
      const siguiente = vehiculo.ruta[vehiculo.indice + 1]
      const salidaLibre = !vehiculos.some(
        (otro) => otro.id !== vehiculo.id && otro.ruta[otro.indice] === siguiente && otro.progreso < DISTANCIA_SEGURA,
      )
      if (!rutaDisponible || !fase || fase[tramo.eje] !== 'verde' || !libre || !salidaLibre) {
        limite = linea
        vehiculo.detenido = !rutaDisponible
          ? 'sin ruta disponible'
          : !libre
            ? 'cruce ocupado'
            : !salidaLibre
              ? 'salida ocupada'
              : 'semáforo'
      } else if (vehiculo.progreso + distancia >= linea) {
        vehiculo.reservado = destino.id
        reservas.set(destino.id, vehiculo.id)
      }
    }
    for (const otro of vehiculos) {
      if (otro.id !== vehiculo.id && otro.ruta[otro.indice] === tramo.id && otro.progreso > vehiculo.progreso) {
        limite = Math.min(limite, Math.max(vehiculo.progreso, otro.progreso - DISTANCIA_SEGURA))
        if (limite <= vehiculo.progreso + distancia) vehiculo.detenido = 'vehículo delante'
      }
    }
    vehiculo.progreso = Math.min(limite, vehiculo.progreso + distancia)
    if (vehiculo.reservado === tramo.de && vehiculo.progreso >= MARGEN_CRUCE) {
      reservas.delete(vehiculo.reservado)
      vehiculo.reservado = null
    }
    if (vehiculo.progreso >= tramo.longitud) {
      if (destino.tipo === 'salida') {
        terminados.add(vehiculo.id)
        continue
      }
      vehiculo.indice += 1
      vehiculo.progreso = 0
    }
  }
  return vehiculos.filter((v) => !terminados.has(v.id))
}
