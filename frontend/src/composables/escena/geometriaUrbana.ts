import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

export const materialUrbano = (color: number, roughness = 0.78) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness: roughness < 0.4 ? 0.18 : 0.02 })

export function piezaUrbana(
  grupo: THREE.Group,
  tamano: [number, number, number],
  material: THREE.Material,
  posicion: [number, number, number],
  radio = 0,
) {
  const geometria = radio ? new RoundedBoxGeometry(...tamano, 2, radio) : new THREE.BoxGeometry(...tamano)
  const pieza = new THREE.Mesh(geometria, material)
  pieza.position.set(...posicion)
  grupo.add(pieza)
  return pieza
}

// Agrupa piezas estáticas del mismo acabado para que las cuatro fachadas no multipliquen draw calls.
// Se llama antes de colocar el edificio en la ciudad, con su transformación raíz todavía identidad.
export function agruparPiezasUrbanas(grupo: THREE.Group) {
  grupo.updateMatrixWorld(true)
  const lotes = new Map<string, { material: THREE.Material; sombra: boolean; geometrias: THREE.BufferGeometry[] }>()
  const originales = new Set<THREE.BufferGeometry>()
  grupo.traverse((objeto) => {
    if (!(objeto instanceof THREE.Mesh) || Array.isArray(objeto.material)) return
    const sombra = objeto.userData.proyectaSombra === true
    const clave = `${objeto.material.uuid}:${sombra}`
    const lote = lotes.get(clave) ?? { material: objeto.material, sombra, geometrias: [] as THREE.BufferGeometry[] }
    const geometria = objeto.geometry.index ? objeto.geometry.toNonIndexed() : objeto.geometry.clone()
    geometria.applyMatrix4(objeto.matrixWorld)
    lote.geometrias.push(geometria)
    lotes.set(clave, lote)
    originales.add(objeto.geometry)
  })
  grupo.clear()
  for (const lote of lotes.values()) {
    const geometria = mergeGeometries(lote.geometrias)
    if (geometria) {
      const malla = new THREE.Mesh(geometria, lote.material)
      malla.userData.proyectaSombra = lote.sombra
      malla.userData.recibeSombra = true
      grupo.add(malla)
    }
    lote.geometrias.forEach((pieza) => pieza.dispose())
  }
  originales.forEach((geometria) => geometria.dispose())
}
