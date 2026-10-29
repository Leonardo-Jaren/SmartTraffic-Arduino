import { expect, it } from 'vitest'
import * as THREE from 'three'
import { crearVehiculo } from './vehiculos'
import {
  DISTANCIA_LIBRE_CRUCE,
  DISTANCIA_LINEA_CRUCE,
  DISTANCIA_PARADA_CRUCE,
  SEPARACION_SEGURA_VEHICULOS,
} from '../simulacion/mapa'

it('la carrocería completa cabe detrás de la línea de parada y deja espacio en las colas', () => {
  const limites = new THREE.Box3().setFromObject(crearVehiculo(0x53aee4))
  expect(limites.max.z).toBeLessThanOrEqual(DISTANCIA_PARADA_CRUCE - DISTANCIA_LINEA_CRUCE)
  expect(limites.max.z - limites.min.z).toBeLessThan(SEPARACION_SEGURA_VEHICULOS - 0.5)
  expect(DISTANCIA_LIBRE_CRUCE + limites.min.z).toBeGreaterThan(1)
  expect(limites.max.x - limites.min.x).toBeLessThan(1.1)
})
