import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type {
  EstadoDispositivo,
  FaseCruce,
  LuzVirtual,
  Modo,
  Seleccion,
  Vehiculo,
  UbicacionSemaforo,
} from '@/types/trafico'
import { crearDinamicos } from './escena/dinamicos'
import { crearMaqueta } from './escena/maqueta'

interface EstadoEscena {
  vehiculos: Vehiculo[]
  fases: FaseCruce[]
  cierres: Set<string>
  seleccion: Seleccion | null
  virtuales: LuzVirtual[]
  modo: Modo
  mostrarVehiculos: boolean
  dispositivo: EstadoDispositivo
  ubicaciones: UbicacionSemaforo[]
}

export function useEscena3D(
  contenedor: Ref<HTMLElement | null>,
  obtenerEstado: () => EstadoEscena,
  seleccionar: (valor: Seleccion) => void,
) {
  const error = ref('')
  let animacion = 0
  let limpiar: (() => void) | undefined

  onMounted(() => {
    const elemento = contenedor.value
    if (!elemento) return
    try {
      const escena = new THREE.Scene()
      escena.background = new THREE.Color(0xe8efe9)
      const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 150)
      camara.position.set(16, 21, 24)
      const renderizador = new THREE.WebGLRenderer({ antialias: true })
      renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderizador.outputColorSpace = THREE.SRGBColorSpace
      renderizador.shadowMap.enabled = true
      renderizador.shadowMap.type = THREE.PCFSoftShadowMap
      renderizador.toneMapping = THREE.ACESFilmicToneMapping
      renderizador.toneMappingExposure = 1.18
      elemento.appendChild(renderizador.domElement)
      escena.add(new THREE.HemisphereLight(0xe4f0ff, 0x6f8d79, 1.8))
      const sol = new THREE.DirectionalLight(0xffeed2, 3)
      sol.position.set(-8, 18, 12)
      sol.castShadow = true
      const resolucionSombra = window.innerWidth < 700 ? 512 : 1024
      sol.shadow.mapSize.set(resolucionSombra, resolucionSombra)
      Object.assign(sol.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 65 })
      sol.shadow.bias = -0.001
      sol.shadow.normalBias = 0.03
      escena.add(sol)
      const controles = new OrbitControls(camara, renderizador.domElement)
      controles.target.set(0, 0, 0)
      controles.enableDamping = true
      controles.minDistance = 15
      controles.maxDistance = 58
      controles.maxPolarAngle = Math.PI / 2.1
      controles.update()
      const maqueta = crearMaqueta(escena)
      escena.traverse((objeto) => {
        if (objeto instanceof THREE.Mesh) {
          objeto.castShadow = objeto.userData.proyectaSombra === true
          objeto.receiveShadow = objeto.userData.recibeSombra === true
        }
      })
      const dinamicos = crearDinamicos(escena, maqueta)
      const rayo = new THREE.Raycaster()
      const puntero = new THREE.Vector2()
      let inicioX = 0
      let inicioY = 0
      const iniciarPuntero = (evento: PointerEvent) => {
        inicioX = evento.clientX
        inicioY = evento.clientY
      }
      const terminarPuntero = (evento: PointerEvent) => {
        if (Math.hypot(evento.clientX - inicioX, evento.clientY - inicioY) > 5) return
        const area = renderizador.domElement.getBoundingClientRect()
        puntero.set(
          ((evento.clientX - area.left) / area.width) * 2 - 1,
          -((evento.clientY - area.top) / area.height) * 2 + 1,
        )
        rayo.setFromCamera(puntero, camara)
        const impacto = rayo.intersectObjects(maqueta.seleccionables, true)[0]
        if (impacto?.object.userData.tipo) seleccionar(impacto.object.userData as Seleccion)
      }
      renderizador.domElement.addEventListener('pointerdown', iniciarPuntero)
      renderizador.domElement.addEventListener('pointerup', terminarPuntero)
      const ajustar = () => {
        const ancho = elemento.clientWidth || 1
        const alto = elemento.clientHeight || 1
        camara.aspect = ancho / alto
        camara.updateProjectionMatrix()
        renderizador.setSize(ancho, alto)
      }
      const observador = new ResizeObserver(ajustar)
      observador.observe(elemento)
      ajustar()
      const dibujar = () => {
        const estado = obtenerEstado()
        dinamicos.actualizar(
          estado.vehiculos,
          estado.fases,
          estado.cierres,
          estado.seleccion,
          estado.virtuales,
          estado.modo,
          estado.mostrarVehiculos,
          estado.dispositivo,
          estado.ubicaciones,
        )
        controles.update()
        renderizador.render(escena, camara)
        animacion = requestAnimationFrame(dibujar)
      }
      dibujar()
      limpiar = () => {
        observador.disconnect()
        controles.dispose()
        renderizador.domElement.removeEventListener('pointerdown', iniciarPuntero)
        renderizador.domElement.removeEventListener('pointerup', terminarPuntero)
        const geometrias = new Set<THREE.BufferGeometry>()
        const materiales = new Set<THREE.Material>()
        escena.traverse((objeto) => {
          if (objeto instanceof THREE.Mesh) {
            geometrias.add(objeto.geometry)
            const listaMateriales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
            listaMateriales.forEach((material) => materiales.add(material))
          }
        })
        geometrias.forEach((geometria) => geometria.dispose())
        materiales.forEach((material) => material.dispose())
        renderizador.dispose()
        renderizador.domElement.remove()
      }
    } catch {
      error.value = 'No se pudo iniciar la vista 3D. Comprueba que WebGL esté habilitado.'
    }
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(animacion)
    limpiar?.()
  })
  return { error }
}
