import * as THREE from 'three'
import type {
  EstadoDispositivo,
  FaseCruce,
  LuzVirtual,
  Modo,
  Seleccion,
  Vehiculo,
  UbicacionSemaforo,
} from '@/types/trafico'
import { ESQUINAS } from '../useDisposicionSemaforos'
import { NODOS, SEMAFOROS_BASE, obtenerTramo } from '../simulacion/mapa'
import { obtenerColorSemaforo } from '../simulacion/semaforos'
import type { crearMaqueta } from './maqueta'
import { colorearSemaforo, crearSemaforo } from './semaforos'

const COLORES = { rojo: 0xe35d5d, amarillo: 0xf6bf51, verde: 0x45cd8a }

function pintar(mesh: THREE.Mesh, color: number) {
  ;(mesh.material as THREE.MeshStandardMaterial).color.setHex(color)
}

function liberarObjeto(objeto: THREE.Object3D) {
  objeto.traverse((parte) => {
    if (parte instanceof THREE.Mesh) {
      parte.geometry.dispose()
      const materiales = Array.isArray(parte.material) ? parte.material : [parte.material]
      materiales.forEach((material) => material.dispose())
    }
  })
}

function crearVehiculo(color: number) {
  const grupo = new THREE.Group()
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 1.05), new THREE.MeshStandardMaterial({ color }))
  const cabina = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.18, 0.48),
    new THREE.MeshStandardMaterial({ color: 0x324958 }),
  )
  cabina.position.y = 0.22
  grupo.add(cuerpo, cabina)
  return grupo
}

export function crearDinamicos(escena: THREE.Scene, maqueta: ReturnType<typeof crearMaqueta>) {
  const autos = new Map<number, THREE.Group>()
  const luces = new Map<number, ReturnType<typeof crearSemaforo>>()
  const semaforos = SEMAFOROS_BASE.map((datos, indice) => {
    const semaforo = crearSemaforo()
    const nodo = NODOS[datos.cruce]!
    semaforo.grupo.position.set(nodo.x + datos.dx, 0.2, nodo.z + datos.dz)
    semaforo.grupo.rotation.y = indice < 3 ? Math.PI / 2 : -Math.PI / 2
    semaforo.grupo.traverse((objeto) => {
      objeto.userData = { tipo: 'semaforo', id: datos.id }
    })
    escena.add(semaforo.grupo)
    maqueta.seleccionables.push(semaforo.grupo)
    return semaforo
  })

  function actualizar(
    vehiculos: Vehiculo[],
    fases: FaseCruce[],
    cierres: Set<string>,
    seleccion: Seleccion | null,
    virtuales: LuzVirtual[],
    modo: Modo,
    mostrarVehiculos: boolean,
    dispositivo: EstadoDispositivo,
    ubicaciones: UbicacionSemaforo[],
  ) {
    semaforos.forEach((semaforo, indice) => {
      const datos = SEMAFOROS_BASE[indice]!
      semaforo.aroSeleccion.visible = seleccion?.tipo === 'semaforo' && seleccion.id === datos.id
      const ubicacion = ubicaciones.find((u) => u.id === datos.id)
      if (ubicacion) {
        const nodo = NODOS[datos.cruce]!
        const esquina = ESQUINAS[ubicacion.esquina]
        semaforo.grupo.position.set(nodo.x + esquina.x, 0.2, nodo.z + esquina.z)
        semaforo.grupo.rotation.y = (ubicacion.giro * Math.PI) / 180
      }
      colorearSemaforo(semaforo, obtenerColorSemaforo(indice, modo, fases, dispositivo))
    })
    for (const [id, calle] of maqueta.calles) {
      pintar(
        calle,
        cierres.has(id) ? 0xb95550 : seleccion?.tipo === 'tramo' && seleccion.id === id ? 0x4a8792 : 0x343e49,
      )
    }
    for (const [id, cruce] of maqueta.cruces) {
      pintar(cruce, seleccion?.tipo === 'cruce' && seleccion.id === id ? 0x4a8792 : 0x303a45)
      const indicador = maqueta.indicadores.get(id)!
      const fase = fases.find((f) => f.id === id)
      pintar(indicador.horizontal, modo === 'simulacion' && fase ? COLORES[fase.horizontal] : 0x849196)
      pintar(indicador.vertical, modo === 'simulacion' && fase ? COLORES[fase.vertical] : 0x849196)
    }
    const visibles = mostrarVehiculos && modo === 'simulacion' ? vehiculos : []
    for (const [id, objeto] of autos) {
      if (!visibles.some((v) => v.id === id)) {
        escena.remove(objeto)
        liberarObjeto(objeto)
        autos.delete(id)
      }
    }
    for (const vehiculo of visibles) {
      let objeto = autos.get(vehiculo.id)
      if (!objeto) {
        objeto = crearVehiculo(vehiculo.color)
        autos.set(vehiculo.id, objeto)
        escena.add(objeto)
      }
      const tramo = obtenerTramo(vehiculo.ruta[vehiculo.indice] || '')
      if (!tramo) continue
      const a = NODOS[tramo.de]!
      const b = NODOS[tramo.hacia]!
      const proporcion = vehiculo.progreso / tramo.longitud
      objeto.position.set(a.x + (b.x - a.x) * proporcion, 0.43, a.z + (b.z - a.z) * proporcion)
      objeto.rotation.y = Math.atan2(b.x - a.x, b.z - a.z)
    }
    for (const [id, luz] of luces) {
      if (!virtuales.some((v) => v.id === id)) {
        escena.remove(luz.grupo)
        const indice = maqueta.seleccionables.indexOf(luz.grupo)
        if (indice >= 0) maqueta.seleccionables.splice(indice, 1)
        liberarObjeto(luz.grupo)
        luces.delete(id)
      }
    }
    for (const virtual of virtuales) {
      let luz = luces.get(virtual.id)
      if (!luz) {
        luz = crearSemaforo()
        luces.set(virtual.id, luz)
        escena.add(luz.grupo)
        luz.grupo.traverse((objeto) => {
          objeto.userData = { tipo: 'luz', id: String(virtual.id) }
        })
        maqueta.seleccionables.push(luz.grupo)
      }
      const n = NODOS[virtual.cruce]!
      luz.aroSeleccion.visible = seleccion?.tipo === 'luz' && seleccion.id === String(virtual.id)
      const indice = virtuales
        .filter((luz) => luz.cruce === virtual.cruce && luz.eje === virtual.eje)
        .findIndex((luz) => luz.id === virtual.id)
      luz.grupo.position.set(
        n.x + (virtual.eje === 'horizontal' ? 1.35 : -1.35) + (indice % 3) * 0.32,
        0.2,
        n.z + (virtual.eje === 'horizontal' ? -1.3 : 1.3) + Math.floor(indice / 3) * 0.32,
      )
      const indiceCruce = Number(virtual.cruce.slice(1)) - 1
      luz.grupo.rotation.y =
        virtual.eje === 'horizontal'
          ? indiceCruce < 3
            ? Math.PI / 2
            : -Math.PI / 2
          : indiceCruce % 3 === 1
            ? Math.PI
            : 0
      const fase = fases.find((f) => f.id === virtual.cruce)
      const color = modo === 'simulacion' && fase ? fase[virtual.eje] : null
      colorearSemaforo(luz, color)
    }
  }
  return { actualizar }
}
