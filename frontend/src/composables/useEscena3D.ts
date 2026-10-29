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
import { crearMaqueta, ESCALA_MAQUETA } from './escena/maqueta'
import { calcularDistanciaEncuadre, calcularEncuadre, obtenerPuntosEncuadre } from './escena/encuadre'

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
      const grupoMaqueta = new THREE.Group()
      escena.add(grupoMaqueta)
      const camara = new THREE.PerspectiveCamera(38, 1, 0.02, 30)
      camara.position.set(13 * ESCALA_MAQUETA.x, 17 * ESCALA_MAQUETA.y, 19.5 * ESCALA_MAQUETA.z)
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
      sol.position.set(-0.61, 1.37, 0.91)
      sol.castShadow = true
      const resolucionSombra = window.innerWidth < 700 ? 512 : 1024
      sol.shadow.mapSize.set(resolucionSombra, resolucionSombra)
      Object.assign(sol.shadow.camera, { left: -1.35, right: 1.35, top: 1.3, bottom: -1.3, near: 0.1, far: 4.5 })
      sol.shadow.camera.updateProjectionMatrix()
      sol.shadow.bias = -0.001
      sol.shadow.normalBias = 0.005
      escena.add(sol)
      const controles = new OrbitControls(camara, renderizador.domElement)
      controles.target.set(0, 0, 0)
      controles.enableDamping = true
      controles.minDistance = 0.35
      controles.maxDistance = 6
      controles.maxPolarAngle = Math.PI / 2.1
      controles.update()
      const maqueta = crearMaqueta(grupoMaqueta)
      grupoMaqueta.traverse((objeto) => {
        if (objeto instanceof THREE.Mesh) {
          objeto.castShadow = objeto.userData.proyectaSombra === true
          objeto.receiveShadow = objeto.userData.recibeSombra === true
        }
      })
      const dinamicos = crearDinamicos(grupoMaqueta, maqueta)
      const limites = new THREE.Box3().setFromObject(grupoMaqueta)
      controles.target.copy(limites.getCenter(new THREE.Vector3()))
      const puntosEncuadre = obtenerPuntosEncuadre(grupoMaqueta)
      let vistaAjustadaPorUsuario = false
      const direccionEncuadrada = new THREE.Vector3()
      const marcarZoomManual = () => {
        vistaAjustadaPorUsuario = true
      }
      const rayo = new THREE.Raycaster()
      const puntero = new THREE.Vector2()
      let inicioX = 0
      let inicioY = 0
      const iniciarPuntero = (evento: PointerEvent) => {
        inicioX = evento.clientX
        inicioY = evento.clientY
        if (evento.button !== 0 || evento.pointerType === 'touch') vistaAjustadaPorUsuario = true
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
      renderizador.domElement.addEventListener('wheel', marcarZoomManual, { passive: true })
      const ajustar = () => {
        const ancho = elemento.clientWidth || 1
        const alto = elemento.clientHeight || 1
        const direccion = camara.position.clone().sub(controles.target).normalize()
        const aspecto = ancho / alto
        if (vistaAjustadaPorUsuario) {
          const anterior = calcularDistanciaEncuadre(
            puntosEncuadre,
            controles.target,
            direccion,
            camara.fov,
            camara.aspect,
          )
          const zoom = camara.position.distanceTo(controles.target) / anterior
          const distancia = calcularDistanciaEncuadre(puntosEncuadre, controles.target, direccion, camara.fov, aspecto)
          camara.position.copy(controles.target).addScaledVector(direccion, distancia * zoom)
        } else {
          const encuadre = calcularEncuadre(puntosEncuadre, direccion, camara.fov, aspecto)
          controles.target.copy(encuadre.centro)
          camara.position.copy(controles.target).addScaledVector(direccion, encuadre.distancia)
        }
        camara.aspect = aspecto
        direccionEncuadrada.copy(direccion)
        camara.updateProjectionMatrix()
        controles.update()
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
        // Al girar la vista inicial, mantiene todos los bordes dentro del cuadro.
        // Un zoom o desplazamiento manual conserva después la distancia elegida.
        if (!vistaAjustadaPorUsuario) {
          const direccion = camara.position.clone().sub(controles.target).normalize()
          if (direccion.distanceToSquared(direccionEncuadrada) > 1e-8) {
            const distancia = calcularDistanciaEncuadre(
              puntosEncuadre,
              controles.target,
              direccion,
              camara.fov,
              camara.aspect,
            )
            camara.position.copy(controles.target).addScaledVector(direccion, distancia)
            camara.lookAt(controles.target)
            direccionEncuadrada.copy(direccion)
          }
        }
        renderizador.render(escena, camara)
        animacion = requestAnimationFrame(dibujar)
      }
      dibujar()
      limpiar = () => {
        observador.disconnect()
        controles.dispose()
        renderizador.domElement.removeEventListener('pointerdown', iniciarPuntero)
        renderizador.domElement.removeEventListener('pointerup', terminarPuntero)
        renderizador.domElement.removeEventListener('wheel', marcarZoomManual)
        const geometrias = new Set<THREE.BufferGeometry>()
        const materiales = new Set<THREE.Material>()
        const texturas = new Set<THREE.Texture>()
        escena.traverse((objeto) => {
          if (objeto instanceof THREE.Mesh) {
            geometrias.add(objeto.geometry)
            const listaMateriales = Array.isArray(objeto.material) ? objeto.material : [objeto.material]
            listaMateriales.forEach((material) => {
              materiales.add(material)
              const mapa = 'map' in material ? material.map : null
              if (mapa instanceof THREE.Texture) texturas.add(mapa)
            })
          }
        })
        geometrias.forEach((geometria) => geometria.dispose())
        materiales.forEach((material) => material.dispose())
        texturas.forEach((textura) => textura.dispose())
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
