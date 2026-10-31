import * as THREE from 'three'

export type CalidadEscena = 'equilibrada' | 'detalle' | 'fluida'
export const PERFILES_CALIDAD = {
  equilibrada: { pixeles: 1.5, sombra: 1024, fps: 60, sombras: true },
  detalle: { pixeles: 2, sombra: 2048, fps: 60, sombras: true },
  fluida: { pixeles: 1, sombra: 512, fps: 30, sombras: false },
} as const

export function aplicarCalidad(renderer: THREE.WebGLRenderer, sol: THREE.DirectionalLight, calidad: CalidadEscena) {
  const perfil = PERFILES_CALIDAD[calidad]
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, perfil.pixeles))
  renderer.shadowMap.enabled = perfil.sombras
  if (sol.shadow.mapSize.x !== perfil.sombra) {
    sol.shadow.map?.dispose()
    sol.shadow.map = null
    sol.shadow.mapSize.set(perfil.sombra, perfil.sombra)
  }
  renderer.shadowMap.needsUpdate = true
}
