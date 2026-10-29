import { describe, expect, it } from 'vitest'
import { ubicacionesIniciales, validarUbicaciones } from './useDisposicionSemaforos'

describe('distribución visual de los seis semáforos', () => {
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
