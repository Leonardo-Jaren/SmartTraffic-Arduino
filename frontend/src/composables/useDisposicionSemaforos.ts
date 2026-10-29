import { computed, ref, watch, type Ref } from 'vue'
import type { Esquina, Seleccion, UbicacionSemaforo } from '@/types/trafico'
import { SEMAFOROS_BASE } from './simulacion/mapa'

const CLAVE = 'smarttraffic.ubicaciones.v1'
export const ESQUINAS: Record<Esquina, { x: number; z: number }> = {
  NO: { x: -1.35, z: -1.35 },
  NE: { x: 1.35, z: -1.35 },
  SO: { x: -1.35, z: 1.35 },
  SE: { x: 1.35, z: 1.35 },
}

export function ubicacionesIniciales(): UbicacionSemaforo[] {
  return SEMAFOROS_BASE.map((s, indice) => ({
    id: s.id,
    esquina: s.dz < 0 ? (s.dx < 0 ? 'NO' : 'NE') : s.dx < 0 ? 'SO' : 'SE',
    giro: indice < 3 ? 90 : 270,
  }))
}

export function validarUbicaciones(valor: unknown): valor is UbicacionSemaforo[] {
  if (!Array.isArray(valor) || valor.length !== 6) return false
  return (
    SEMAFOROS_BASE.every((s) => valor.filter((u) => u?.id === s.id).length === 1) &&
    valor.every((u) => Object.hasOwn(ESQUINAS, u.esquina) && [0, 90, 180, 270].includes(u.giro))
  )
}

export function useDisposicionSemaforos(seleccion: Ref<Seleccion | null>) {
  let inicial = ubicacionesIniciales()
  try {
    const guardado = JSON.parse(localStorage.getItem(CLAVE) || 'null')
    if (validarUbicaciones(guardado)) inicial = guardado
  } catch {
    /* Almacenamiento opcional. */
  }
  const ubicaciones = ref(inicial)
  const ubicacionSeleccionada = computed(() => ubicaciones.value.find((u) => u.id === seleccion.value?.id) ?? null)
  const aviso = ref('')
  watch(
    ubicaciones,
    (valor) => {
      try {
        localStorage.setItem(CLAVE, JSON.stringify(valor))
        aviso.value = ''
      } catch {
        aviso.value = 'El navegador no permite guardar la distribución; se conserva durante esta sesión.'
      }
    },
    { deep: true },
  )

  function reubicar(esquina: Esquina) {
    if (seleccion.value?.tipo !== 'semaforo' || !Object.hasOwn(ESQUINAS, esquina)) return
    if (ubicacionSeleccionada.value) ubicacionSeleccionada.value.esquina = esquina
  }
  function girar() {
    if (seleccion.value?.tipo === 'semaforo' && ubicacionSeleccionada.value)
      ubicacionSeleccionada.value.giro = (ubicacionSeleccionada.value.giro + 90) % 360
  }
  function restaurar() {
    ubicaciones.value = ubicacionesIniciales()
  }
  return { ubicaciones, ubicacionSeleccionada, aviso, reubicar, girar, restaurar }
}
