import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

/** Fusiona piezas estáticas por acabado, conservando los pivotes de las ruedas. */
export function optimizarVehiculo(grupo: THREE.Group) {
  const lotes = new Map<THREE.Material, THREE.Mesh[]>()
  for (const objeto of grupo.children) {
    if (!(objeto instanceof THREE.Mesh) || Array.isArray(objeto.material)) continue
    const lote = lotes.get(objeto.material) ?? []
    lote.push(objeto)
    lotes.set(objeto.material, lote)
  }
  for (const [material, piezas] of lotes) {
    if (piezas.length < 2) continue
    const geometrias = piezas.map((pieza) => {
      pieza.updateMatrix()
      const geometria = pieza.geometry.index ? pieza.geometry.toNonIndexed() : pieza.geometry.clone()
      geometria.deleteAttribute('uv')
      return geometria.applyMatrix4(pieza.matrix)
    })
    const fusion = mergeGeometries(geometrias)
    geometrias.forEach((geometria) => geometria.dispose())
    if (!fusion) continue
    const malla = new THREE.Mesh(fusion, material)
    malla.castShadow = piezas.some((pieza) => pieza.castShadow)
    malla.userData.proyectaSombra = malla.castShadow
    grupo.add(malla)
    piezas.forEach((pieza) => {
      grupo.remove(pieza)
      pieza.geometry.dispose()
    })
  }
}
