import type { EstadoDispositivo, Tiempos } from '@/types/trafico'

export async function consultarDispositivo(): Promise<EstadoDispositivo> {
  const respuesta = await fetch('/api/dispositivo/', { cache: 'no-store' })
  if (!respuesta.ok) throw new Error('No se pudo consultar Django.')
  return respuesta.json() as Promise<EstadoDispositivo>
}

export async function enviarTiempos(tiempos: Tiempos): Promise<void> {
  const respuesta = await fetch('/api/dispositivo/configuraciones/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tiempos),
  })
  const datos = (await respuesta.json()) as Record<string, unknown>
  if (!respuesta.ok) throw new Error(typeof datos.detalle === 'string' ? datos.detalle : JSON.stringify(datos))
}
