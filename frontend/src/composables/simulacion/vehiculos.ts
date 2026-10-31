import type { FaseCruce, Vehiculo } from '@/types/trafico'
import {
  ANCHO_CARRIL,
  DISTANCIA_LIBRE_CRUCE,
  DISTANCIA_PARADA_CRUCE,
  ENTRADAS,
  METROS_POR_UNIDAD,
  NODOS,
  SALIDAS,
  SEMAFOROS_BASE,
  SEPARACION_SEGURA_VEHICULOS,
  TRAMOS,
  obtenerTramo,
} from './mapa'
import { movimientosCompatibles } from './movimientos'
import { calcularRuta } from './rutas'

const COLORES = [0xf6b945, 0x53aee4, 0xf07368, 0xf0eee5, 0x85c7a4, 0x9b5de5, 0x00bbf9, 0xf15bb5]
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

export function posicionEnCalle(vehiculo: Vehiculo): number | null {
  const id = vehiculo.ruta[vehiculo.indice]
  if (!id) return null
  const inicio = INICIOS_TRAMO.get(id)
  return inicio === undefined ? null : inicio + vehiculo.progreso
}

export function obtenerCoordenadasVehiculo(
  vehiculo: Vehiculo,
): { x: number; z: number; dx: number; dz: number } | null {
  const tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
  if (!tramo) return null
  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const ratio = Math.max(0, Math.min(1, vehiculo.progreso / tramo.longitud))
  const dx = (b.x - a.x) / tramo.longitud
  const dz = (b.z - a.z) / tramo.longitud
  const lateral = ((vehiculo.carril ?? 0) - 0.5) * ANCHO_CARRIL
  return {
    x: a.x + (b.x - a.x) * ratio - dz * lateral,
    z: a.z + (b.z - a.z) * ratio + dx * lateral,
    dx,
    dz,
  }
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

      // Dos colas independientes por entrada; se intenta el segundo carril si el primero está ocupado.
      const tramoEntrada = ruta[0]!
      const carriles: (0 | 1)[] = id % 2 ? [1, 0] : [0, 1]
      const carril = carriles.find(
        (candidato) =>
          !actuales.some(
            (v) =>
              (v.carril ?? 0) === candidato &&
              v.ruta[v.indice] === tramoEntrada &&
              v.progreso < SEPARACION_SEGURA_VEHICULOS + 0.5,
          ),
      )
      if (carril === undefined) continue

      return {
        id,
        carril,
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
  semaforosDesactivados: Set<string> = new Set(),
): Vehiculo[] {
  const paso = Number.isFinite(segundos) ? Math.max(0, Math.min(segundos, 0.1)) : 0
  const rapidez = Number.isFinite(velocidad) ? Math.max(0, velocidad) : 0

  // La reserva depende de la ocupación real y no puede caducar mientras el coche sigue dentro.

  const terminados = new Set<number>()

  // Ordenar para procesamiento predecible
  const ordenados = [...vehiculos].sort((a, b) => (posicionEnCalle(b) ?? -1) - (posicionEnCalle(a) ?? -1))

  for (const vehiculo of ordenados) {
    let tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
    if (!tramo) {
      terminados.add(vehiculo.id)
      continue
    }

    vehiculo.detenido = ''

    // Manejo inteligente de calles cerradas
    if (cierres.has(tramo.id)) {
      const comprometidoConCruce = vehiculo.reservado === tramo.de || vehiculo.reservado === tramo.hacia
      if (vehiculo.progreso <= 1e-5 && !comprometidoConCruce) {
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

    const distancia = (paso * ((rapidez * (tramo.eje === 'horizontal' ? 1 : 0.6)) / 3.6)) / METROS_POR_UNIDAD
    const destino = NODOS[tramo.hacia]!
    let limite = Number.POSITIVE_INFINITY
    let motivo = ''
    let debeReservarCruce = false

    // Control de aproximación a intersecciones y semáforos
    if (destino.tipo === 'cruce') {
      const lineaParada = tramo.longitud - DISTANCIA_PARADA_CRUCE
      const yaEstaDentroDelCruce = vehiculo.reservado === destino.id && vehiculo.progreso >= lineaParada

      if (!yaEstaDentroDelCruce) {
        const fase = fases.find((f) => f.id === destino.id)
        const cruceOcupado = vehiculos.some(
          (otro) =>
            otro.id !== vehiculo.id &&
            otro.reservado === destino.id &&
            !movimientosCompatibles(vehiculo, otro, destino.id),
        )
        const rutaDisponible = actualizarRuta(vehiculo, destino.id, cierres)
        const siguiente = vehiculo.ruta[vehiculo.indice + 1]

        // Comprobar si la salida tras el cruce está libre de atascos
        const salidaLibre = !vehiculos.some(
          (otro) =>
            otro.id !== vehiculo.id &&
            (otro.carril ?? 0) === (vehiculo.carril ?? 0) &&
            otro.ruta[otro.indice] === siguiente &&
            otro.progreso < DISTANCIA_LIBRE_CRUCE + SEPARACION_SEGURA_VEHICULOS,
        )

        // Si el semáforo para este cruce y eje fue desactivado por el usuario, el paso queda libre
        const semaforoControl = SEMAFOROS_BASE.find((s) => s.cruce === destino.id && s.eje === tramo.eje)
        const semaforoInactivo = semaforoControl ? semaforosDesactivados.has(semaforoControl.id) : false
        const luzVerde = semaforoInactivo || Boolean(fase && fase[tramo.eje] === 'verde')

        // Si la luz NO es verde, o cruce ocupado, o sin salida: DETENERSE en la línea de parada
        if (!rutaDisponible || !luzVerde || cruceOcupado || !salidaLibre) {
          limite = Math.max(vehiculo.progreso, lineaParada)
          motivo = !rutaDisponible
            ? 'sin ruta disponible'
            : cruceOcupado
              ? 'cruce ocupado'
              : !salidaLibre
                ? 'salida ocupada'
                : 'semáforo'
        } else {
          // Luz verde y cruce despejado: permitido avanzar y reclamar reserva al cruzar la línea
          debeReservarCruce = true
        }
      }
    }

    // Prevención de colisiones por proximidad en la misma calle
    const posicion = posicionEnCalle(vehiculo)
    for (const otro of vehiculos) {
      if (otro.id === vehiculo.id || (otro.carril ?? 0) !== (vehiculo.carril ?? 0)) continue
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

    // Los movimientos perpendiculares se excluyen mediante reservas. Una distancia
    // circular a coches detenidos fuera del cruce causaba bloqueos mutuos.

    const progresoAnterior = vehiculo.progreso
    vehiculo.progreso = Math.min(limite, vehiculo.progreso + distancia)

    // Reservar el cruce únicamente cuando el vehículo ha entrado con luz verde
    if (
      debeReservarCruce &&
      destino.tipo === 'cruce' &&
      vehiculo.progreso > tramo.longitud - DISTANCIA_PARADA_CRUCE &&
      vehiculo.progreso > progresoAnterior
    ) {
      vehiculo.reservado = destino.id
    }

    const sobrante = Math.max(0, vehiculo.progreso - tramo.longitud)
    vehiculo.detenido = motivo && vehiculo.progreso <= progresoAnterior + 1e-5 ? motivo : ''

    // Liberar reserva del cruce cuando el auto sale completamente a la nueva calle
    if (vehiculo.reservado === tramo.de && vehiculo.progreso + 1e-5 >= DISTANCIA_LIBRE_CRUCE) {
      vehiculo.reservado = null
    }

    // Avance de tramo al completar la longitud
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
