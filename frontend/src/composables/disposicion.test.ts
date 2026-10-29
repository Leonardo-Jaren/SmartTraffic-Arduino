import { describe, expect, it } from 'vitest'
import { ubicacionesIniciales, validarUbicaciones } from './useDisposicionSemaforos'

describe('distribución visual de los seis semáforos', () => {
  it('respeta las seis esquinas y las caras marcadas en el croquis', () => {
    expect(ubicacionesIniciales().map(({ id, esquina, giro }) => [id, esquina, giro])).toEqual([
      ['S1', 'NO', 0],
      ['S2', 'SO', 90],
      ['S3', 'NO', 0],
      ['S4', 'NE', 270],
      ['S5', 'SE', 180],
      ['S6', 'NE', 270],
    ])
  })
  it('restaura una distribución válida sin alterar identificadores', () => {
    const inicial = ubicacionesIniciales()
    expect(validarUbicaciones(inicial)).toBe(true)
    inicial[0]!.esquina = 'SE'
    expect(ubicacionesIniciales()[0]!.esquina).toBe('NO')
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
