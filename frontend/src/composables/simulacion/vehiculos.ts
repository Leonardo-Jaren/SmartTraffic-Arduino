import type { FaseCruce, Vehiculo } from '@/types/trafico'
import {
  DISTANCIA_LIBRE_CRUCE,
  DISTANCIA_PARADA_CRUCE,
  ENTRADAS,
  METROS_POR_UNIDAD,
  NODOS,
  SALIDAS,
  SEPARACION_SEGURA_VEHICULOS,
  TRAMOS,
  obtenerTramo,
} from './mapa'
import { calcularRuta } from './rutas'

const COLORES = [0xf6b945, 0x53aee4, 0xf07368, 0xf0eee5, 0x85c7a4]
const INICIOS_TRAMO = new Map<string, number>()
const tramosPorCalle = new Map<string, typeof TRAMOS>()
for (const tramo of TRAMOS) {
  const calle = tramosPorCalle.get(tramo.calle) ?? []
  calle.push(tramo)
  tramosPorCalle.set(tramo.calle, calle)
}
for (const tramos of tramosPorCalle.values()) {
  let inicio = 0
  for (const tramo of [...tramos].sort(
    (a, b) => Number(a.id.slice(a.id.lastIndexOf('-') + 1)) - Number(b.id.slice(b.id.lastIndexOf('-') + 1)),
  )) {
    INICIOS_TRAMO.set(tramo.id, inicio)
    inicio += tramo.longitud
  }
}

function posicionEnCalle(vehiculo: Vehiculo): number | null {
  const id = vehiculo.ruta[vehiculo.indice]
  if (!id) return null
  const inicio = INICIOS_TRAMO.get(id)
  return inicio === undefined ? null : inicio + vehiculo.progreso
}

function barajar<T>(valores: T[]): T[] {
  for (let indice = valores.length - 1; indice > 0; indice--) {
    const otro = Math.floor(Math.random() * (indice + 1))
    ;[valores[indice], valores[otro]] = [valores[otro]!, valores[indice]!]
  }
  return valores
}

function buscarDesvio(origen: string, destino: string, cierres: Set<string>) {
  let ruta = calcularRuta(origen, destino, cierres)
  let nuevoDestino = destino
  if (!ruta?.length) {
    for (const salida of SALIDAS) {
      const desvio = calcularRuta(origen, salida.id, cierres)
      if (!desvio?.length) continue
      ruta = desvio
      nuevoDestino = salida.id
      break
    }
  }
  return ruta?.length ? { ruta, destino: nuevoDestino } : null
}

export function crearVehiculo(id: number, actuales: Vehiculo[], cierres: Set<string>): Vehiculo | null {
  const entradas = barajar([...ENTRADAS])
  const salidas = barajar([...SALIDAS])
  for (const entrada of entradas) {
    for (const salida of salidas) {
      const ruta = calcularRuta(entrada.id, salida.id, cierres)
      if (!ruta?.length) continue
      if (actuales.some((v) => v.ruta[v.indice] === ruta[0] && v.progreso < SEPARACION_SEGURA_VEHICULOS)) continue
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
  const alternativa = buscarDesvio(hacia, vehiculo.destino, cierres)
  if (!alternativa) return false
  vehiculo.destino = alternativa.destino
  vehiculo.ruta = [...vehiculo.ruta.slice(0, vehiculo.indice + 1), ...alternativa.ruta]
  return true
}

export function avanzarVehiculos(
  vehiculos: Vehiculo[],
  segundos: number,
  cierres: Set<string>,
  fases: FaseCruce[],
  velocidad: number,
): Vehiculo[] {
  const paso = Number.isFinite(segundos) ? Math.max(0, Math.min(segundos, 0.1)) : 0
  const rapidez = Number.isFinite(velocidad) ? Math.max(0, velocidad) : 0
  const distancia = (paso * (rapidez / 3.6)) / METROS_POR_UNIDAD
  const reservas = new Map(vehiculos.filter((v) => v.reservado).map((v) => [v.reservado!, v.id]))
  const terminados = new Set<number>()
  const ordenados = [...vehiculos].sort((a, b) => (posicionEnCalle(b) ?? -1) - (posicionEnCalle(a) ?? -1))
  for (const vehiculo of ordenados) {
    let tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
    if (!tramo) {
      terminados.add(vehiculo.id)
      continue
    }
    vehiculo.detenido = ''
    if (cierres.has(tramo.id)) {
      const comprometidoConCruce = vehiculo.reservado === tramo.de || vehiculo.reservado === tramo.hacia
      if (vehiculo.progreso <= 1e-6 && !comprometidoConCruce) {
        const alternativa = buscarDesvio(tramo.de, vehiculo.destino, cierres)
        if (alternativa) {
          vehiculo.destino = alternativa.destino
          vehiculo.ruta = [...vehiculo.ruta.slice(0, vehiculo.indice), ...alternativa.ruta]
          tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
        }
      }
      if (!tramo) {
        terminados.add(vehiculo.id)
        continue
      }
      if (cierres.has(tramo.id) && !comprometidoConCruce) {
        vehiculo.detenido = 'tramo cerrado'
        continue
      }
    }
    const destino = NODOS[tramo.hacia]!
    let limite = Number.POSITIVE_INFINITY
    let motivo = ''
    let cruceAReservar: { id: string; linea: number } | null = null
    if (destino.tipo === 'cruce' && vehiculo.reservado !== destino.id) {
      const linea = tramo.longitud - DISTANCIA_PARADA_CRUCE
      const fase = fases.find((f) => f.id === destino.id)
      const libre = !reservas.has(destino.id) || reservas.get(destino.id) === vehiculo.id
      const rutaDisponible = actualizarRuta(vehiculo, destino.id, cierres)
      const siguiente = vehiculo.ruta[vehiculo.indice + 1]
      const salidaLibre = !vehiculos.some(
        (otro) =>
          otro.id !== vehiculo.id &&
          otro.ruta[otro.indice] === siguiente &&
          // Debe caber el auto entero fuera del cruce y conservar la distancia con la cola.
          otro.progreso < DISTANCIA_LIBRE_CRUCE + SEPARACION_SEGURA_VEHICULOS,
      )
      if (!rutaDisponible || !fase || fase[tramo.eje] !== 'verde' || !libre || !salidaLibre) {
        limite = Math.max(vehiculo.progreso, linea)
        motivo = !rutaDisponible
          ? 'sin ruta disponible'
          : !libre
            ? 'cruce ocupado'
            : !salidaLibre
              ? 'salida ocupada'
              : 'semáforo'
      } else cruceAReservar = { id: destino.id, linea }
    }
    const posicion = posicionEnCalle(vehiculo)
    for (const otro of vehiculos) {
      if (otro.id === vehiculo.id) continue
      const otroTramo = obtenerTramo(otro.ruta[otro.indice] || '')
      const posicionOtro = posicionEnCalle(otro)
      if (!otroTramo || otroTramo.calle !== tramo.calle || posicion === null || posicionOtro === null) continue
      const separacion = posicionOtro - posicion
      if (separacion <= 0) continue
      const limiteSeguimiento = vehiculo.progreso + Math.max(0, separacion - SEPARACION_SEGURA_VEHICULOS)
      if (limiteSeguimiento < limite) {
        limite = limiteSeguimiento
        motivo = 'vehículo delante'
      }
    }
    const progresoAnterior = vehiculo.progreso
    vehiculo.progreso = Math.min(limite, vehiculo.progreso + distancia)
    // La cola puede impedir avanzar aunque haya verde. Una intención no ocupa el cruce.
    if (cruceAReservar && vehiculo.progreso > cruceAReservar.linea && vehiculo.progreso > progresoAnterior) {
      vehiculo.reservado = cruceAReservar.id
      reservas.set(cruceAReservar.id, vehiculo.id)
    }
    const sobrante = Math.max(0, vehiculo.progreso - tramo.longitud)
    vehiculo.detenido = motivo && vehiculo.progreso <= progresoAnterior + 1e-6 ? motivo : ''
    if (vehiculo.reservado === tramo.de && vehiculo.progreso + 1e-6 >= DISTANCIA_LIBRE_CRUCE) {
      reservas.delete(vehiculo.reservado)
      vehiculo.reservado = null
    }
    if (vehiculo.progreso >= tramo.longitud) {
      if (destino.tipo === 'salida') {
        terminados.add(vehiculo.id)
        continue
      }
      vehiculo.indice += 1
      vehiculo.progreso = Math.min(sobrante, obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')?.longitud ?? 0)
    }
  }
  return vehiculos.filter((v) => !terminados.has(v.id))
}
