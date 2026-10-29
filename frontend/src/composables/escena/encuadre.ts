import * as THREE from 'three'

export function obtenerPuntosEncuadre(objeto: THREE.Object3D) {
  const puntos: THREE.Vector3[] = []
  objeto.updateMatrixWorld(true)
  objeto.traverse((parte) => {
    if (!(parte instanceof THREE.Mesh)) return
    parte.geometry.computeBoundingBox()
    const limites = parte.geometry.boundingBox!
    for (const x of [limites.min.x, limites.max.x])
      for (const y of [limites.min.y, limites.max.y])
        for (const z of [limites.min.z, limites.max.z])
          puntos.push(new THREE.Vector3(x, y, z).applyMatrix4(parte.matrixWorld))
  })
  return puntos
}

function ejesPantalla(direccion: THREE.Vector3) {
  const derecha = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direccion)
  if (derecha.lengthSq() < 1e-8) derecha.set(1, 0, 0)
  derecha.normalize()
  return { derecha, arriba: new THREE.Vector3().crossVectors(direccion, derecha).normalize() }
}

export function calcularDistanciaEncuadre(
  puntos: THREE.Vector3[],
  centro: THREE.Vector3,
  direccion: THREE.Vector3,
  fov: number,
  aspecto: number,
) {
  const { derecha, arriba } = ejesPantalla(direccion)
  const tangente = Math.tan(THREE.MathUtils.degToRad(fov / 2)) * 0.88
  let distancia = 0
  for (const punto of puntos) {
    const esquina = punto.clone().sub(centro)
    distancia = Math.max(
      distancia,
      esquina.dot(direccion) + Math.abs(esquina.dot(derecha)) / (tangente * aspecto),
      esquina.dot(direccion) + Math.abs(esquina.dot(arriba)) / tangente,
    )
  }
  return distancia
}

/** Centra la silueta visible, incluyendo la perspectiva del borde delantero. */
export function calcularEncuadre(puntos: THREE.Vector3[], direccion: THREE.Vector3, fov: number, aspecto: number) {
  const centro = new THREE.Box3().setFromPoints(puntos).getCenter(new THREE.Vector3())
  const { derecha, arriba } = ejesPantalla(direccion)
  const tangente = Math.tan(THREE.MathUtils.degToRad(fov / 2))
  for (let paso = 0; paso < 5; paso++) {
    const distancia = calcularDistanciaEncuadre(puntos, centro, direccion, fov, aspecto)
    const min = new THREE.Vector2(Infinity, Infinity)
    const max = new THREE.Vector2(-Infinity, -Infinity)
    for (const punto of puntos) {
      const relativo = punto.clone().sub(centro)
      const profundidad = distancia - relativo.dot(direccion)
      const pantalla = new THREE.Vector2(
        relativo.dot(derecha) / (profundidad * tangente * aspecto),
        relativo.dot(arriba) / (profundidad * tangente),
      )
      min.min(pantalla)
      max.max(pantalla)
    }
    const desplazamiento = min.add(max).multiplyScalar(0.5)
    centro.addScaledVector(derecha, desplazamiento.x * distancia * tangente * aspecto)
    centro.addScaledVector(arriba, desplazamiento.y * distancia * tangente)
  }
  return { centro, distancia: calcularDistanciaEncuadre(puntos, centro, direccion, fov, aspecto) }
}
