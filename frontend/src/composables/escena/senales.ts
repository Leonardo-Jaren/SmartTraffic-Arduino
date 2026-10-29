import * as THREE from 'three'
import { NODOS, obtenerRotacionSemaforo, SEMAFOROS_BASE, TRAMOS } from '../simulacion/mapa'

function triangulo(ancho: number, alto: number) {
  const forma = new THREE.Shape()
  forma.moveTo(-ancho / 2, alto / 2)
  forma.lineTo(0, -alto / 2)
  forma.lineTo(ancho / 2, alto / 2)
  forma.closePath()
  return forma
}

/** Señales pasivas en los seis accesos perpendiculares que no tienen una luz física. */
export function crearSenalesCeda(escena: THREE.Group) {
  const metal = new THREE.MeshStandardMaterial({ color: 0x77868a, metalness: 0.55, roughness: 0.4 })
  const rojo = new THREE.MeshStandardMaterial({ color: 0xb83a35, roughness: 0.65 })
  const blanco = new THREE.MeshStandardMaterial({ color: 0xfff8df, roughness: 0.8 })
  const placa = new THREE.ExtrudeGeometry(triangulo(0.5, 0.45), { depth: 0.035, bevelEnabled: false })
  const centro = new THREE.ShapeGeometry(triangulo(0.34, 0.28))
  const poste = new THREE.CylinderGeometry(0.027, 0.035, 0.94, 8)
  for (const luz of SEMAFOROS_BASE) {
    const eje = luz.eje === 'horizontal' ? 'vertical' : 'horizontal'
    const entrada = TRAMOS.find((tramo) => tramo.hacia === luz.cruce && tramo.eje === eje)!
    const a = NODOS[entrada.de]!,
      b = NODOS[entrada.hacia]!
    const dx = (b.x - a.x) / entrada.longitud
    const dz = (b.z - a.z) / entrada.longitud
    const grupo = new THREE.Group()
    const soporte = new THREE.Mesh(poste, metal)
    soporte.position.y = 0.47
    const borde = new THREE.Mesh(placa, rojo)
    borde.position.y = 1.02
    const cara = new THREE.Mesh(centro, blanco)
    cara.position.set(0, 1.04, 0.038)
    grupo.add(soporte, borde, cara)
    grupo.position.set(b.x - dx * 1.35 - dz * 1.35, 0.22, b.z - dz * 1.35 + dx * 1.35)
    grupo.rotation.y = obtenerRotacionSemaforo(luz.cruce, eje)
    escena.add(grupo)
  }
}
