import { onBeforeUnmount, onMounted, ref } from 'vue'

export function usePantallaCompleta() {
  const contenedor = ref<HTMLElement | null>(null)
  const pantallaCompleta = ref(false)
  let pantallaNativa = false
  let desbordamientoAnterior = ''

  async function abrirPantallaCompleta() {
    if (!contenedor.value || pantallaCompleta.value) return
    desbordamientoAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    pantallaCompleta.value = true
    try {
      if (contenedor.value.requestFullscreen) {
        await contenedor.value.requestFullscreen()
        pantallaNativa = document.fullscreenElement === contenedor.value
      }
    } catch {
      // Se mantiene la vista inmersiva dentro de la ventana cuando el navegador lo impide.
    }
  }

  async function cerrarPantallaCompleta() {
    pantallaCompleta.value = false
    document.body.style.overflow = desbordamientoAnterior
    if (document.fullscreenElement === contenedor.value) await document.exitFullscreen().catch(() => {})
    pantallaNativa = false
  }

  function gestionarPantalla() {
    if (document.fullscreenElement === contenedor.value) pantallaNativa = true
    else if (pantallaNativa) void cerrarPantallaCompleta()
  }

  function gestionarTecla(evento: KeyboardEvent) {
    if (evento.key === 'Escape' && pantallaCompleta.value) void cerrarPantallaCompleta()
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', gestionarPantalla)
    document.addEventListener('keydown', gestionarTecla)
  })
  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', gestionarPantalla)
    document.removeEventListener('keydown', gestionarTecla)
    if (pantallaCompleta.value) void cerrarPantallaCompleta()
  })
  return { contenedor, pantallaCompleta, abrirPantallaCompleta, cerrarPantallaCompleta }
}
