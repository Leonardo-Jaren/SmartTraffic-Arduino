import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { aplicarCalidad, PERFILES_CALIDAD, type CalidadEscena } from './escena/calidad'
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
  desactivados?: Set<string>
}

export function useEscena3D(
  contenedor: Ref<HTMLElement | null>,
  obtenerEstado: () => EstadoEscena,
  seleccionar: (valor: Seleccion) => void,
) {
  const error = ref('')
  const calidad = ref<CalidadEscena>('equilibrada')
  let cambiarVista: (superior: boolean) => void = () => {}
  const vistaGeneral = () => cambiarVista(false)
  const vistaSuperior = () => cambiarVista(true)
  let animacion = 0
  let limpiar: (() => void) | undefined

  onMounted(() => {
    const elemento = contenedor.value
    if (!elemento) return
    try {
      const escena = new THREE.Scene()
      escena.background = new THREE.Color(0xe5ecf1)
      const grupoMaqueta = new THREE.Group()
      escena.add(grupoMaqueta)
      const camara = new THREE.PerspectiveCamera(38, 1, 0.02, 30)
      camara.position.set(13 * ESCALA_MAQUETA.x, 26 * ESCALA_MAQUETA.y, 19.5 * ESCALA_MAQUETA.z)
      const renderizador = new THREE.WebGLRenderer({ antialias: true })
      renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderizador.outputColorSpace = THREE.SRGBColorSpace
      renderizador.shadowMap.enabled = true
      renderizador.shadowMap.type = THREE.PCFShadowMap
      renderizador.toneMapping = THREE.ACESFilmicToneMapping
      renderizador.toneMappingExposure = 1.05
      const generadorEntorno = new THREE.PMREMGenerator(renderizador)
      const sala = new RoomEnvironment()
      const entorno = generadorEntorno.fromScene(sala, 0.04)
      escena.environment = entorno.texture
      escena.environmentIntensity = 0.45
      sala.dispose()
      generadorEntorno.dispose()
      elemento.appendChild(renderizador.domElement)

      // Iluminación arquitectónica de 3 puntos (Sol principal + Relleno celeste + Luz ambiental hemisférica)
      escena.add(new THREE.HemisphereLight(0xeaf4ff, 0x223026, 1.5))
      const sol = new THREE.DirectionalLight(0xfff6e8, 2.9)
      sol.position.set(-0.65, 1.45, 0.88)
      sol.castShadow = true
      const resolucionSombra = window.innerWidth < 700 ? 1024 : 2048
      sol.shadow.mapSize.set(resolucionSombra, resolucionSombra)
      Object.assign(sol.shadow.camera, { left: -1.4, right: 1.4, top: 1.35, bottom: -1.35, near: 0.1, far: 4.8 })
      sol.shadow.camera.updateProjectionMatrix()
      sol.shadow.bias = -0.0004
      sol.shadow.normalBias = 0.002
      renderizador.shadowMap.autoUpdate = false
      aplicarCalidad(renderizador, sol, calidad.value)
      escena.add(sol)

      const luzRelleno = new THREE.DirectionalLight(0x8eb9e4, 0.95)
      luzRelleno.position.set(0.9, 1.05, -0.85)
      escena.add(luzRelleno)
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
          objeto.castShadow = objeto.castShadow || objeto.userData.proyectaSombra === true
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
      cambiarVista = (superior) => {
        vistaAjustadaPorUsuario = false
        const direccion = superior
          ? new THREE.Vector3(0, 1, 0.001).normalize()
          : new THREE.Vector3(1, 1.65, 1.65).normalize()
        camara.position.copy(controles.target).addScaledVector(direccion, 3)
        ajustar()
      }
      const dejarCalidad = watch(calidad, (valor) => {
        aplicarCalidad(renderizador, sol, valor)
        ajustar()
      })
      let visible = true
      let ultimoCuadro = 0
      let ultimaSombra = -Infinity
      const visibilidad = new IntersectionObserver(([entrada]) => {
        visible = entrada?.isIntersecting ?? false
      })
      visibilidad.observe(elemento)
      const dibujar = (ahora: number) => {
        animacion = requestAnimationFrame(dibujar)
        if (document.hidden || !visible) {
          ultimoCuadro = 0
          return
        }
        const intervalo = 1000 / PERFILES_CALIDAD[calidad.value].fps
        if (ahora - ultimoCuadro < intervalo - 0.5) return
        const delta = ultimoCuadro ? Math.min((ahora - ultimoCuadro) / 1000, 0.1) : 1 / 60
        ultimoCuadro = ahora
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
          estado.desactivados,
        )
        controles.update(delta)
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
        if (ahora - ultimaSombra >= 1000 / 30) {
          renderizador.shadowMap.needsUpdate = true
          ultimaSombra = ahora
        }
        renderizador.render(escena, camara)
      }
      animacion = requestAnimationFrame(dibujar)
      limpiar = () => {
        dejarCalidad()
        visibilidad.disconnect()
        observador.disconnect()
        entorno.dispose()
        sol.shadow.dispose()
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
  return { error, calidad, vistaGeneral, vistaSuperior }
}
