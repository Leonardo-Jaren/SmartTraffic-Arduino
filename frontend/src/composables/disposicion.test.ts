import { describe, expect, it } from 'vitest'
import { ubicacionesIniciales, validarUbicaciones } from './useDisposicionSemaforos'

describe('distribución visual de los nueve semáforos', () => {
  it('respeta las esquinas y las caras orientadas hacia el tráfico que vigilan', () => {
    expect(ubicacionesIniciales().map(({ id, esquina, giro }) => [id, esquina, giro])).toEqual([
      ['S1', 'SO', 0],
      ['S2', 'SO', 90],
      ['S3', 'SO', 0],
      ['S4', 'NO', 270],
      ['S5', 'NE', 180],
      ['S6', 'NO', 270],
      ['S7', 'SO', 180],
      ['S8', 'NO', 0],
      ['S9', 'NO', 0],
    ])
  })
  it('restaura una distribución válida sin alterar identificadores', () => {
    const inicial = ubicacionesIniciales()
    expect(validarUbicaciones(inicial)).toBe(true)
    inicial[0]!.esquina = 'SE'
    expect(ubicacionesIniciales()[0]!.esquina).toBe('SO')
  })
  it('rechaza datos dañados, duplicados o giros no permitidos', () => {
    expect(validarUbicaciones(null)).toBe(false)
    const datos = ubicacionesIniciales()
    datos[1]!.id = 'S1'
    expect(validarUbicaciones(datos)).toBe(false)
    const otro = ubicacionesIniciales()
    otro[0]!.giro = 45
    expect(validarUbicaciones(otro)).toBe(false)
  })
})
