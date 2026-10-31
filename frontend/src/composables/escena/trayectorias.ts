import * as THREE from 'three'
import type { Vehiculo } from '@/types/trafico'
import { ANCHO_CARRIL, NODOS, RADIO_GIRO_VEHICULO, obtenerTramo } from '../simulacion/mapa'

function calcularGiro(
  entrada: { x: number; z: number },
  salida: { x: number; z: number },
  cruce: { x: number; z: number },
  porcentaje: number,
  lateral: number,
) {
  const radio = RADIO_GIRO_VEHICULO
  const inicio = {
    x: cruce.x - entrada.z * lateral - entrada.x * radio,
    z: cruce.z + entrada.x * lateral - entrada.z * radio,
  }
  const control1 = {
    x: cruce.x - entrada.z * lateral - entrada.x * radio * 0.45,
    z: cruce.z + entrada.x * lateral - entrada.z * radio * 0.45,
  }
  const control2 = {
    x: cruce.x - salida.z * lateral + salida.x * radio * 0.45,
    z: cruce.z + salida.x * lateral + salida.z * radio * 0.45,
  }
  const fin = { x: cruce.x - salida.z * lateral + salida.x * radio, z: cruce.z + salida.x * lateral + salida.z * radio }
  const t = THREE.MathUtils.clamp(porcentaje, 0, 1)
  const inverso = 1 - t
  const x =
    inverso ** 3 * inicio.x + 3 * inverso ** 2 * t * control1.x + 3 * inverso * t ** 2 * control2.x + t ** 3 * fin.x
  const z =
    inverso ** 3 * inicio.z + 3 * inverso ** 2 * t * control1.z + 3 * inverso * t ** 2 * control2.z + t ** 3 * fin.z
  const dx =
    3 * inverso ** 2 * (control1.x - inicio.x) +
    6 * inverso * t * (control2.x - control1.x) +
    3 * t ** 2 * (fin.x - control2.x)
  const dz =
    3 * inverso ** 2 * (control1.z - inicio.z) +
    6 * inverso * t * (control2.z - control1.z) +
    3 * t ** 2 * (fin.z - control2.z)
  return { x, z, dx, dz }
}

export function obtenerPosicionVehiculo(vehiculo: Vehiculo, tramo: NonNullable<ReturnType<typeof obtenerTramo>>) {
  const lateral = ((vehiculo.carril ?? 0) - 0.5) * ANCHO_CARRIL
  const anterior = vehiculo.ruta[vehiculo.indice - 1] ? obtenerTramo(vehiculo.ruta[vehiculo.indice - 1]!) : undefined
  const siguiente = vehiculo.ruta[vehiculo.indice + 1] ? obtenerTramo(vehiculo.ruta[vehiculo.indice + 1]!) : undefined
  const direccion = (id: string) => {
    const segmento = obtenerTramo(id)
    if (!segmento) return null
    const a = NODOS[segmento.de]!
    const b = NODOS[segmento.hacia]!
    return { x: (b.x - a.x) / segmento.longitud, z: (b.z - a.z) / segmento.longitud }
  }

  if (siguiente && tramo.hacia === siguiente.de && NODOS[tramo.hacia]?.tipo === 'cruce') {
    const entrada = direccion(tramo.id)
    const salida = direccion(siguiente.id)
    const cruce = NODOS[tramo.hacia]!
    if (entrada && salida && Math.abs(entrada.x * salida.x + entrada.z * salida.z) < 0.98) {
      const inicioGiro = tramo.longitud - RADIO_GIRO_VEHICULO
      if (vehiculo.progreso >= inicioGiro)
        return calcularGiro(
          entrada,
          salida,
          cruce,
          (vehiculo.progreso - inicioGiro) / (RADIO_GIRO_VEHICULO * 2),
          lateral,
        )
    }
  }

  if (anterior && anterior.hacia === tramo.de && NODOS[tramo.de]?.tipo === 'cruce') {
    const entrada = direccion(anterior.id)
    const salida = direccion(tramo.id)
    const cruce = NODOS[tramo.de]!
    if (
      entrada &&
      salida &&
      Math.abs(entrada.x * salida.x + entrada.z * salida.z) < 0.98 &&
      vehiculo.progreso <= RADIO_GIRO_VEHICULO
    ) {
      return calcularGiro(entrada, salida, cruce, 0.5 + vehiculo.progreso / (RADIO_GIRO_VEHICULO * 2), lateral)
    }
  }

  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const proporcion = THREE.MathUtils.clamp(vehiculo.progreso / tramo.longitud, 0, 1)
  return {
    x: a.x + (b.x - a.x) * proporcion - ((b.z - a.z) / tramo.longitud) * lateral,
    z: a.z + (b.z - a.z) * proporcion + ((b.x - a.x) / tramo.longitud) * lateral,
    dx: (b.x - a.x) / tramo.longitud,
    dz: (b.z - a.z) / tramo.longitud,
  }
}
