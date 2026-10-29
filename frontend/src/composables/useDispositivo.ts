import { onMounted, onUnmounted, ref } from 'vue'
import type { EstadoDispositivo, Tiempos } from '@/types/trafico'
import { consultarDispositivo, enviarTiempos } from '@/services/dispositivo'

function estadoVacio(): EstadoDispositivo {
  return {
    fuente: 'arduino',
    conectado: false,
    modo: 'DESCONECTADO',
    colores: [],
    ultimo_reporte: null,
    puerto: '',
    error: '',
    tiempos_confirmados: null,
    ultimo_comando: null,
  }
}

export function useDispositivo() {
  const estado = ref<EstadoDispositivo>(estadoVacio())
  const error = ref('')
  const enviando = ref(false)
  let intervalo = 0
  let consultando = false

  async function actualizar() {
    if (consultando) return
    consultando = true
    try {
      estado.value = await consultarDispositivo()
      error.value = ''
    } catch {
      estado.value = estadoVacio()
      error.value = 'No hay conexión con la API de Django.'
    } finally {
      consultando = false
    }
  }

  async function solicitar(tiempos: Tiempos) {
    enviando.value = true
    try {
      await enviarTiempos(tiempos)
      await actualizar()
      return 'Solicitud enviada al puente; espera la confirmación del dispositivo.'
    } catch (fallo) {
      return fallo instanceof Error ? fallo.message : 'No se pudo enviar la configuración.'
    } finally {
      enviando.value = false
    }
  }

  onMounted(() => {
    void actualizar()
    intervalo = window.setInterval(actualizar, 1000)
  })
  onUnmounted(() => window.clearInterval(intervalo))
  return { estado, error, enviando, solicitar, actualizar }
}
