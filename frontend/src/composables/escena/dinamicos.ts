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
import { NODOS, RADIO_GIRO_VEHICULO, SEMAFOROS_BASE, obtenerRotacionSemaforo, obtenerTramo } from '../simulacion/mapa'
import { obtenerColorSemaforo } from '../simulacion/semaforos'
import type { crearMaqueta } from './maqueta'
import { colorearSemaforo, crearSemaforo } from './semaforos'
import { animarVehiculo, crearVehiculo } from './vehiculos'

function pintar(mesh: THREE.Mesh, color: number) {
  ;(mesh.material as THREE.MeshStandardMaterial).color.setHex(color)
}

function liberarObjeto(objeto: THREE.Object3D) {
  const geometrias = new Set<THREE.BufferGeometry>()
  const materialesUnicos = new Set<THREE.Material>()
  objeto.traverse((parte) => {
    if (parte instanceof THREE.Mesh) {
      geometrias.add(parte.geometry)
      const materiales = Array.isArray(parte.material) ? parte.material : [parte.material]
      materiales.forEach((material) => materialesUnicos.add(material))
    }
  })
  geometrias.forEach((geometria) => geometria.dispose())
  materialesUnicos.forEach((material) => material.dispose())
}

function calcularGiro(
  entrada: { x: number; z: number },
  salida: { x: number; z: number },
  cruce: { x: number; z: number },
  porcentaje: number,
) {
  const radio = RADIO_GIRO_VEHICULO
  const inicio = { x: cruce.x - entrada.x * radio, z: cruce.z - entrada.z * radio }
  const control1 = { x: cruce.x - entrada.x * radio * 0.45, z: cruce.z - entrada.z * radio * 0.45 }
  const control2 = { x: cruce.x + salida.x * radio * 0.45, z: cruce.z + salida.z * radio * 0.45 }
  const fin = { x: cruce.x + salida.x * radio, z: cruce.z + salida.z * radio }
  const t = THREE.MathUtils.clamp(porcentaje, 0, 1)
  const inverso = 1 - t
  const x =
    inverso ** 3 * inicio.x + 3 * inverso ** 2 * t * control1.x + 3 * inverso * t ** 2 * control2.x + t ** 3 * fin.x
  const z =
    inverso ** 3 * inicio.z + 3 * inverso ** 2 * t * control1.z + 3 * inverso * t ** 2 * control2.z + t ** 3 * fin.z
  const dx =
    3 * inverso ** 2 * (control1.x - inicio.x) +
    6 * inverso * t * (control2.x - control1.x) +
    3 * t ** 2 * (fin.x - control2.x)
  const dz =
    3 * inverso ** 2 * (control1.z - inicio.z) +
    6 * inverso * t * (control2.z - control1.z) +
    3 * t ** 2 * (fin.z - control2.z)
  return { x, z, dx, dz }
}

function obtenerPosicionVehiculo(vehiculo: Vehiculo, tramo: NonNullable<ReturnType<typeof obtenerTramo>>) {
  const anterior = vehiculo.ruta[vehiculo.indice - 1] ? obtenerTramo(vehiculo.ruta[vehiculo.indice - 1]!) : undefined
  const siguiente = vehiculo.ruta[vehiculo.indice + 1] ? obtenerTramo(vehiculo.ruta[vehiculo.indice + 1]!) : undefined
  const direccion = (id: string) => {
    const segmento = obtenerTramo(id)
    if (!segmento) return null
    const a = NODOS[segmento.de]!
    const b = NODOS[segmento.hacia]!
    return { x: (b.x - a.x) / segmento.longitud, z: (b.z - a.z) / segmento.longitud }
  }

  if (siguiente && tramo.hacia === siguiente.de && NODOS[tramo.hacia]?.tipo === 'cruce') {
    const entrada = direccion(tramo.id)
    const salida = direccion(siguiente.id)
    const cruce = NODOS[tramo.hacia]!
    if (entrada && salida && Math.abs(entrada.x * salida.x + entrada.z * salida.z) < 0.98) {
      const inicioGiro = tramo.longitud - RADIO_GIRO_VEHICULO
      if (vehiculo.progreso >= inicioGiro)
        return calcularGiro(entrada, salida, cruce, (vehiculo.progreso - inicioGiro) / (RADIO_GIRO_VEHICULO * 2))
    }
  }

  if (anterior && anterior.hacia === tramo.de && NODOS[tramo.de]?.tipo === 'cruce') {
    const entrada = direccion(anterior.id)
    const salida = direccion(tramo.id)
    const cruce = NODOS[tramo.de]!
    if (
      entrada &&
      salida &&
      Math.abs(entrada.x * salida.x + entrada.z * salida.z) < 0.98 &&
      vehiculo.progreso <= RADIO_GIRO_VEHICULO
    ) {
      return calcularGiro(entrada, salida, cruce, 0.5 + vehiculo.progreso / (RADIO_GIRO_VEHICULO * 2))
    }
  }

  const a = NODOS[tramo.de]!
  const b = NODOS[tramo.hacia]!
  const proporcion = THREE.MathUtils.clamp(vehiculo.progreso / tramo.longitud, 0, 1)
  return {
    x: a.x + (b.x - a.x) * proporcion,
    z: a.z + (b.z - a.z) * proporcion,
    dx: (b.x - a.x) / tramo.longitud,
    dz: (b.z - a.z) / tramo.longitud,
  }
}

export function crearDinamicos(escena: THREE.Group, maqueta: ReturnType<typeof crearMaqueta>) {
  const autos = new Map<number, THREE.Group>()
  const luces = new Map<number, ReturnType<typeof crearSemaforo>>()
  const semaforos = SEMAFOROS_BASE.map((datos) => {
    const semaforo = crearSemaforo()
    const nodo = NODOS[datos.cruce]!
    semaforo.grupo.position.set(nodo.x + datos.dx, 0.2, nodo.z + datos.dz)
    semaforo.grupo.rotation.y = obtenerRotacionSemaforo(datos.cruce, datos.eje)
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
      const posicion = obtenerPosicionVehiculo(vehiculo, tramo)
      const distancia = objeto.userData.ubicado
        ? Math.hypot(posicion.x - objeto.position.x, posicion.z - objeto.position.z)
        : 0
      animarVehiculo(objeto, distancia, Boolean(vehiculo.detenido))
      objeto.userData.ubicado = true
      objeto.position.set(posicion.x, 0.22, posicion.z)
      objeto.rotation.y = Math.atan2(posicion.dx, posicion.dz)
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
      luz.grupo.rotation.y = obtenerRotacionSemaforo(virtual.cruce, virtual.eje)
      const fase = fases.find((f) => f.id === virtual.cruce)
      const color = modo === 'simulacion' && fase ? fase[virtual.eje] : null
      colorearSemaforo(luz, color)
    }
  }
  return { actualizar }
}
