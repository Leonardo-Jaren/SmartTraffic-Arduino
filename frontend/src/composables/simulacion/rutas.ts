import { ENTRADAS, SALIDAS, TRAMOS } from './mapa'

export function calcularRuta(origen: string, destino: string, cierres: Set<string>): string[] | null {
  const cola: { nodo: string; ruta: string[] }[] = [{ nodo: origen, ruta: [] }]
  const visitados = new Set([origen])
  while (cola.length) {
    const actual = cola.shift()!
    if (actual.nodo === destino) return actual.ruta
    for (const tramo of TRAMOS) {
      if (tramo.de !== actual.nodo || cierres.has(tramo.id) || visitados.has(tramo.hacia)) continue
      visitados.add(tramo.hacia)
      cola.push({ nodo: tramo.hacia, ruta: [...actual.ruta, tramo.id] })
    }
  }
  return null
}

export function describirTramo(id: string): string {
  const tramo = TRAMOS.find((t) => t.id === id)
  return tramo ? `${tramo.calle}: ${tramo.de} → ${tramo.hacia}` : id
}

export function analizarImpactos(cierres: Set<string>) {
  if (!cierres.size) return []
  const impactos: { ruta: string; estado: string }[] = []
  for (const entrada of ENTRADAS)
    for (const salida of SALIDAS) {
      const original = calcularRuta(entrada.id, salida.id, new Set())
      if (!original) continue
      const actual = calcularRuta(entrada.id, salida.id, cierres)
      if (!actual || original.join(',') !== actual.join(',')) {
        impactos.push({
          ruta: `${entrada.id} → ${salida.id}`,
          estado: actual ? 'desvío al destino' : 'destino bloqueado',
        })
      }
    }
  return impactos
}
