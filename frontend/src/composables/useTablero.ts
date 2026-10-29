import { computed, reactive, ref, watch } from 'vue'
import type { Eje, Modo, Seleccion, Tiempos } from '@/types/trafico'
import { validarTiempos } from './simulacion/luces'
import { analizarImpactos, describirTramo } from './simulacion/rutas'
import { useDispositivo } from './useDispositivo'
import { useSimulacion } from './useSimulacion'
import { SEMAFOROS_BASE } from './simulacion/mapa'
import { useDisposicionSemaforos } from './useDisposicionSemaforos'

export function useTablero() {
  const simulacion = useSimulacion()
  const dispositivo = useDispositivo()
  const modo = ref<Modo>('simulacion')
  const seleccion = ref<Seleccion | null>(null)
  const disposicion = useDisposicionSemaforos(seleccion)
  const ejeNuevo = ref<Eje>('horizontal')
  const borrador = reactive<Tiempos>({ ...simulacion.tiempos })
  const mensaje = ref('')
  const descripcionSeleccion = computed(() => {
    if (!seleccion.value) return 'Selecciona una calle o un cruce en la maqueta.'
    if (seleccion.value.tipo === 'tramo') return describirTramo(seleccion.value.id)
    if (seleccion.value.tipo === 'cruce') return `Intersección ${seleccion.value.id}`
    if (seleccion.value.tipo === 'semaforo') {
      const semaforo = SEMAFOROS_BASE.find((item) => item.id === seleccion.value?.id)
      return `Semáforo ${seleccion.value.id} · ${semaforo?.cruce ?? ''}`
    }
    return `Semáforo virtual ${seleccion.value.id}`
  })
  const listaCierres = computed(() => [...simulacion.cierres.value].map((id) => ({ id, nombre: describirTramo(id) })))
  const impactos = computed(() => analizarImpactos(simulacion.cierres.value))

  watch(modo, (nuevo) => {
    mensaje.value = ''
    if (nuevo === 'dispositivo') simulacion.activo.value = false
  })

  async function aplicarTiempos() {
    const copia = { ...borrador }
    const error = validarTiempos(copia)
    if (error) {
      mensaje.value = error
      return
    }
    if (modo.value === 'simulacion') {
      simulacion.aplicarTiempos(copia)
      mensaje.value = 'Tiempos aplicados solo a la simulación.'
    } else {
      mensaje.value = await dispositivo.solicitar(copia)
    }
  }

  function agregarLuzSeleccionada() {
    if (seleccion.value?.tipo === 'cruce') simulacion.agregarLuz(seleccion.value.id, ejeNuevo.value)
  }

  function quitarLuzSeleccionada() {
    if (seleccion.value?.tipo === 'luz') simulacion.quitarLuz(Number(seleccion.value.id))
    seleccion.value = null
  }

  function cambiarSeleccion(valor: Seleccion) {
    seleccion.value = valor
  }
  return {
    simulacion,
    disposicion,
    dispositivo,
    modo,
    seleccion,
    ejeNuevo,
    borrador,
    mensaje,
    descripcionSeleccion,
    listaCierres,
    impactos,
    aplicarTiempos,
    agregarLuzSeleccionada,
    quitarLuzSeleccionada,
    cambiarSeleccion,
  }
}
