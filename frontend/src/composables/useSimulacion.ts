import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import type { Eje, LuzVirtual, Tiempos, Vehiculo } from '@/types/trafico'
import { CRUCES, METROS_POR_UNIDAD, VELOCIDAD_OLA } from './simulacion/mapa'
import { calcularFase, TIEMPOS_INICIALES, validarTiempos } from './simulacion/luces'
import { avanzarVehiculos, crearVehiculo } from './simulacion/vehiculos'

export function useSimulacion() {
  const activo = ref(true)
  const mostrarVehiculos = ref(true)
  const cantidad = ref(8)
  const velocidad = ref(30)
  const limiteVelocidad = ref(80)
  const tiempo = ref(0)
  const tiempos = reactive<Tiempos>({ ...TIEMPOS_INICIALES })
  const cierres = ref(new Set<string>())
  const vehiculos = ref<Vehiculo[]>([])
  const lucesVirtuales = ref<LuzVirtual[]>([])
  const fases = computed(() => CRUCES.map((id) => calcularFase(id, tiempo.value, tiempos)))
  const detenidos = computed(() => vehiculos.value.filter((v) => v.detenido).length)
  const errorTiempos = ref('')
  let siguienteVehiculo = 0
  let siguienteLuz = 1
  let anterior = 0
  let animacion = 0
  let ultimoIngreso = 0

  function avanzar(ahora: number) {
    if (!anterior) anterior = ahora
    const delta = Math.min((ahora - anterior) / 1000, 0.1)
    anterior = ahora
    if (activo.value) {
      tiempo.value += delta
      if (mostrarVehiculos.value) {
        vehiculos.value = avanzarVehiculos(vehiculos.value, delta, cierres.value, fases.value, velocidad.value)
        if (vehiculos.value.length > cantidad.value) vehiculos.value.splice(cantidad.value)
        if (vehiculos.value.length < cantidad.value && tiempo.value - ultimoIngreso > 0.7) {
          const nuevo = crearVehiculo(siguienteVehiculo++, vehiculos.value, cierres.value)
          if (nuevo) vehiculos.value.push(nuevo)
          ultimoIngreso = tiempo.value
        }
      }
    }
    animacion = requestAnimationFrame(avanzar)
  }

  function alternarCierre(id: string) {
    const nuevos = new Set(cierres.value)
    if (nuevos.has(id)) nuevos.delete(id)
    else nuevos.add(id)
    cierres.value = nuevos
  }

  function reiniciar() {
    tiempo.value = 0
    vehiculos.value = []
    cierres.value = new Set()
    ultimoIngreso = 0
    activo.value = true
  }

  function aplicarTiempos(nuevos: Tiempos): boolean {
    const error = validarTiempos(nuevos)
    errorTiempos.value = error || ''
    if (error) return false
    Object.assign(tiempos, nuevos)
    tiempo.value = 0
    vehiculos.value = []
    return true
  }

  function agregarLuz(cruce: string, eje: Eje) {
    lucesVirtuales.value.push({ id: siguienteLuz++, cruce, eje })
  }

  function quitarLuz(id: number) {
    lucesVirtuales.value = lucesVirtuales.value.filter((luz) => luz.id !== id)
  }

  function cambiarLimite(valor: number) {
    limiteVelocidad.value = Math.max(20, Math.min(120, Math.round(valor || 80)))
    velocidad.value = Math.min(velocidad.value, limiteVelocidad.value)
  }

  onMounted(() => {
    animacion = requestAnimationFrame(avanzar)
  })
  onUnmounted(() => cancelAnimationFrame(animacion))
  return {
    activo,
    mostrarVehiculos,
    cantidad,
    velocidad,
    limiteVelocidad,
    tiempo,
    tiempos,
    cierres,
    vehiculos,
    fases,
    lucesVirtuales,
    detenidos,
    errorTiempos,
    metrosPorUnidad: METROS_POR_UNIDAD,
    velocidadOla: VELOCIDAD_OLA,
    alternarCierre,
    reiniciar,
    aplicarTiempos,
    agregarLuz,
    quitarLuz,
    cambiarLimite,
  }
}
