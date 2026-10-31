import type { Vehiculo } from '@/types/trafico'
import { obtenerTramo } from './mapa'

function entradaDelMovimiento(coche: Vehiculo, cruce: string) {
  const actual = obtenerTramo(coche.ruta[coche.indice] ?? '')
  return actual?.de === cruce ? obtenerTramo(coche.ruta[coche.indice - 1] ?? '') : actual
}

/** Los rectos de una misma aproximación pueden formar un pelotón por ambos carriles.
 * Los giros se mantienen exclusivos hasta despejar el cruce. */
export function movimientosCompatibles(a: Vehiculo, b: Vehiculo, cruce: string) {
  const entradaA = entradaDelMovimiento(a, cruce)
  const entradaB = entradaDelMovimiento(b, cruce)
  if (!entradaA || entradaA.id !== entradaB?.id) return false
  const esRecto = (coche: Vehiculo) => {
    const actual = obtenerTramo(coche.ruta[coche.indice] ?? '')
    const salida = actual?.de === cruce ? actual : obtenerTramo(coche.ruta[coche.indice + 1] ?? '')
    return salida?.calle === entradaA.calle
  }
  return esRecto(a) && esRecto(b)
}
