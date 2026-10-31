import type { FaseCruce, Vehiculo } from '@/types/trafico'
import {
  DISTANCIA_LIBRE_CRUCE,
  DISTANCIA_LINEA_CRUCE,
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
  return {
    x: a.x + (b.x - a.x) * ratio,
    z: a.z + (b.z - a.z) * ratio,
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

      // Verificar que ningún auto esté cerca del punto de ingreso (en la misma calle o en el espacio 3D)
      const tramoEntrada = ruta[0]!
      const nodoEntrada = NODOS[entrada.id]!
      const ocupado = actuales.some((v) => {
        if (v.ruta[v.indice] === tramoEntrada && v.progreso < SEPARACION_SEGURA_VEHICULOS + 0.5) return true
        const coord = obtenerCoordenadasVehiculo(v)
        if (coord && Math.hypot(coord.x - nodoEntrada.x, coord.z - nodoEntrada.z) < SEPARACION_SEGURA_VEHICULOS) {
          return true
        }
        return false
      })
      if (ocupado) continue

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

// Registro para prevención de bloqueos permanentes (anti-deadlock watchdog)
const tiemposBloqueado = new Map<number, number>()
const tiemposReserva = new Map<string, number>()

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

  // Limpieza de reservas huérfanas o prolongadas
  for (const [cruceId, t] of tiemposReserva.entries()) {
    if (t > 7) tiemposReserva.delete(cruceId)
    else tiemposReserva.set(cruceId, t + paso)
  }

  const reservas = new Map(
    vehiculos.filter((v) => v.reservado && tiemposReserva.has(v.reservado)).map((v) => [v.reservado!, v.id]),
  )
  const terminados = new Set<number>()

  // Ordenar para procesamiento predecible
  const ordenados = [...vehiculos].sort((a, b) => (posicionEnCalle(b) ?? -1) - (posicionEnCalle(a) ?? -1))

  for (const vehiculo of ordenados) {
    let tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
    if (!tramo) {
      terminados.add(vehiculo.id)
      tiemposBloqueado.delete(vehiculo.id)
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
        const tBloq = (tiemposBloqueado.get(vehiculo.id) ?? 0) + paso
        tiemposBloqueado.set(vehiculo.id, tBloq)
        // Si no puede salir de una calle bloqueada tras 8s, se remueve para no congelar la simulación
        if (tBloq > 8) terminados.add(vehiculo.id)
        continue
      }
    }

    const destino = NODOS[tramo.hacia]!
    let limite = Number.POSITIVE_INFINITY
    let motivo = ''
    let debeReservarCruce = false

    // Control de aproximación a intersecciones y semáforos
    if (destino.tipo === 'cruce') {
      const lineaParada = tramo.longitud - DISTANCIA_PARADA_CRUCE
      const lineaEntradaCruce = tramo.longitud - DISTANCIA_LINEA_CRUCE
      const yaEstaDentroDelCruce = vehiculo.reservado === destino.id && vehiculo.progreso >= lineaParada

      if (!yaEstaDentroDelCruce) {
        const fase = fases.find((f) => f.id === destino.id)
        const cruceOcupado = reservas.has(destino.id) && reservas.get(destino.id) !== vehiculo.id
        const rutaDisponible = actualizarRuta(vehiculo, destino.id, cierres)
        const siguiente = vehiculo.ruta[vehiculo.indice + 1]

        // Comprobar si la salida tras el cruce está libre de atascos
        const salidaLibre = !vehiculos.some(
          (otro) =>
            otro.id !== vehiculo.id &&
            otro.ruta[otro.indice] === siguiente &&
            otro.progreso < DISTANCIA_LIBRE_CRUCE + SEPARACION_SEGURA_VEHICULOS,
        )

        const luzVerde = Boolean(fase && fase[tramo.eje] === 'verde')

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

    // Prevención espacial 3D contra solapamientos entre vehículos de distintas calles o giros
    const miCoord = obtenerCoordenadasVehiculo(vehiculo)
    if (miCoord) {
      for (const otro of vehiculos) {
        if (otro.id === vehiculo.id) continue
        const otraCoord = obtenerCoordenadasVehiculo(otro)
        if (!otraCoord) continue

        const vx = otraCoord.x - miCoord.x
        const vz = otraCoord.z - miCoord.z
        const proyeccion = vx * miCoord.dx + vz * miCoord.dz
        const lateral = Math.abs(vx * -miCoord.dz + vz * miCoord.dx)

        // Si otro vehículo está frente a este en la trayectoria física
        if (proyeccion > -0.1 && proyeccion < SEPARACION_SEGURA_VEHICULOS + 0.4 && lateral < 1.35) {
          const espacioLibre = Math.max(0, proyeccion - SEPARACION_SEGURA_VEHICULOS)
          const limiteEspacial = vehiculo.progreso + espacioLibre
          if (limiteEspacial < limite) {
            limite = limiteEspacial
            motivo = 'vehículo delante'
          }
        }
      }
    }

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
      reservas.set(destino.id, vehiculo.id)
      tiemposReserva.set(destino.id, 0)
    }

    const sobrante = Math.max(0, vehiculo.progreso - tramo.longitud)
    vehiculo.detenido = motivo && vehiculo.progreso <= progresoAnterior + 1e-5 ? motivo : ''

    // Actualizar tiempo de detención para desatascar la simulación si un auto queda sin ruta
    if (vehiculo.detenido) {
      const acumulado = (tiemposBloqueado.get(vehiculo.id) ?? 0) + paso
      tiemposBloqueado.set(vehiculo.id, acumulado)
      if (acumulado > 12 && vehiculo.detenido === 'sin ruta disponible') {
        terminados.add(vehiculo.id)
      }
    } else {
      tiemposBloqueado.delete(vehiculo.id)
    }

    // Liberar reserva del cruce cuando el auto sale completamente a la nueva calle
    if (vehiculo.reservado === tramo.de && vehiculo.progreso + 1e-5 >= DISTANCIA_LIBRE_CRUCE) {
      reservas.delete(vehiculo.reservado)
      tiemposReserva.delete(vehiculo.reservado)
      vehiculo.reservado = null
    }

    // Avance de tramo al completar la longitud
    if (vehiculo.progreso >= tramo.longitud) {
      if (destino.tipo === 'salida') {
        terminados.add(vehiculo.id)
        tiemposBloqueado.delete(vehiculo.id)
        continue
      }
      vehiculo.indice += 1
      vehiculo.progreso = Math.min(sobrante, obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')?.longitud ?? 0)
    }
  }

  return vehiculos.filter((v) => !terminados.has(v.id))
}
