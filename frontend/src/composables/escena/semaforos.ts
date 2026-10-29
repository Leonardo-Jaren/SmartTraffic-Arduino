import * as THREE from 'three'
import type { ColorSemaforo } from '@/types/trafico'

const COLORES: Record<ColorSemaforo, number> = { rojo: 0xf0655e, amarillo: 0xffca54, verde: 0x4be092 }
const APAGADOS: Record<ColorSemaforo, number> = { rojo: 0x542e2d, amarillo: 0x564924, verde: 0x28533a }

export function crearSemaforo() {
  const grupo = new THREE.Group()
  const poste = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, 1.05, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x4a5961 }),
  )
  poste.position.y = 0.53
  const carcasa = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.98, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x202b32 }),
  )
  carcasa.position.y = 1.22
  grupo.add(poste, carcasa)
  const pie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.2, 0.12, 12),
    new THREE.MeshStandardMaterial({ color: 0x68767d, roughness: 0.65 }),
  )
  pie.position.y = 0.06
  grupo.add(pie)
  const aroSeleccion = new THREE.Mesh(
    new THREE.TorusGeometry(0.29, 0.035, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x39e2b0 }),
  )
  aroSeleccion.rotation.x = -Math.PI / 2
  aroSeleccion.position.y = 0.08
  aroSeleccion.visible = false
  grupo.add(aroSeleccion)
  const focos = {} as Record<ColorSemaforo, THREE.Mesh>
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color, indice) => {
    const foco = new THREE.Mesh(
      new THREE.SphereGeometry(0.125, 12, 10),
      new THREE.MeshStandardMaterial({ color: APAGADOS[color], emissive: 0x000000 }),
    )
    foco.position.set(0, 1.52 - indice * 0.3, 0)
    grupo.add(foco)
    const visera = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.045, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x17252b }),
    )
    visera.position.set(0, 1.67 - indice * 0.3, 0.13)
    grupo.add(visera)
    focos[color] = foco
  })
  grupo.traverse((objeto) => {
    if (objeto instanceof THREE.Mesh) objeto.castShadow = true
  })
  return { grupo, focos, aroSeleccion }
}

export function colorearSemaforo(semaforo: ReturnType<typeof crearSemaforo>, activo: ColorSemaforo | null) {
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color) => {
    const material = semaforo.focos[color].material as THREE.MeshStandardMaterial
    material.color.setHex(color === activo ? COLORES[color] : APAGADOS[color])
    material.emissive.setHex(color === activo ? COLORES[color] : 0x000000)
    material.emissiveIntensity = color === activo ? 0.7 : 0
  })
}
