import { computed, ref, watch, type Ref } from 'vue'
import type { Esquina, Seleccion, UbicacionSemaforo } from '@/types/trafico'
import { obtenerRotacionSemaforo, SEMAFOROS_BASE } from './simulacion/mapa'

const CLAVE = 'smarttraffic.ubicaciones.v2'
export const ESQUINAS: Record<Esquina, { x: number; z: number }> = {
  NO: { x: -1.35, z: -1.35 },
  NE: { x: 1.35, z: -1.35 },
  SO: { x: -1.35, z: 1.35 },
  SE: { x: 1.35, z: 1.35 },
}

export function ubicacionesIniciales(): UbicacionSemaforo[] {
  return SEMAFOROS_BASE.map((semaforo) => {
    const rotacion = ((obtenerRotacionSemaforo(semaforo.cruce, 'horizontal') * 180) / Math.PI + 360) % 360
    return {
      id: semaforo.id,
      esquina: semaforo.dz < 0 ? (semaforo.dx < 0 ? 'NO' : 'NE') : semaforo.dx < 0 ? 'SO' : 'SE',
      giro: Math.round(rotacion / 90) * 90 % 360,
    }
  })
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
