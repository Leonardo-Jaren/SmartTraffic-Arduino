import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ColorSemaforo } from '@/types/trafico'

const COLORES: Record<ColorSemaforo, number> = { rojo: 0xff3939, amarillo: 0xffbe19, verde: 0x20e98a }
const APAGADOS: Record<ColorSemaforo, number> = { rojo: 0x3d1616, amarillo: 0x3c2c0e, verde: 0x103d24 }

export function crearSemaforo() {
  const grupo = new THREE.Group()
  const poste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.095, 1.32, 12),
    new THREE.MeshStandardMaterial({ color: 0x54646b, metalness: 0.58, roughness: 0.36 }),
  )
  poste.position.y = 0.68
  const placaTrasera = new THREE.Mesh(
    new RoundedBoxGeometry(0.56, 1.14, 0.11, 3, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x101a20, metalness: 0.3, roughness: 0.55 }),
  )
  placaTrasera.position.set(0, 1.58, -0.17)
  const carcasa = new THREE.Mesh(
    new RoundedBoxGeometry(0.5, 1.08, 0.34, 4, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x202b32, metalness: 0.25, roughness: 0.48 }),
  )
  carcasa.position.set(0, 1.58, 0)
  grupo.add(poste, placaTrasera, carcasa)
  const pie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.24, 0.14, 16),
    new THREE.MeshStandardMaterial({ color: 0x68767d, metalness: 0.42, roughness: 0.55 }),
  )
  pie.position.y = 0.06
  grupo.add(pie)
  const abrazadera = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12),
    new THREE.MeshStandardMaterial({ color: 0x26353c, metalness: 0.4, roughness: 0.48 }),
  )
  abrazadera.position.y = 1.12
  grupo.add(abrazadera)
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
    const fondoFoco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.118, 0.065, 24),
      new THREE.MeshStandardMaterial({ color: 0x10191d, metalness: 0.15, roughness: 0.72 }),
    )
    fondoFoco.rotation.x = Math.PI / 2
    fondoFoco.position.set(0, 1.94 - indice * 0.34, 0.2)
    grupo.add(fondoFoco)
    const foco = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.092, 0.028, 24),
      new THREE.MeshStandardMaterial({
        color: APAGADOS[color],
        emissive: 0x000000,
        roughness: 0.28,
        metalness: 0.04,
      }),
    )
    foco.rotation.x = Math.PI / 2
    foco.name = `luz-${color}`
    foco.position.set(0, 1.94 - indice * 0.34, 0.246)
    grupo.add(foco)
    const aro = new THREE.Mesh(
      new THREE.TorusGeometry(0.108, 0.018, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x10191d, roughness: 0.72 }),
    )
    aro.position.set(0, foco.position.y, 0.261)
    grupo.add(aro)
    const visera = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.045, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x17252b, roughness: 0.52 }),
    )
    visera.position.set(0, foco.position.y + 0.12, 0.235)
    grupo.add(visera)
    focos[color] = foco
  })
  for (const objeto of [poste, placaTrasera, carcasa, pie, abrazadera]) {
    objeto.castShadow = true
    objeto.userData.proyectaSombra = true
  }
  return { grupo, focos, aroSeleccion }
}

export function colorearSemaforo(semaforo: ReturnType<typeof crearSemaforo>, activo: ColorSemaforo | null) {
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color) => {
    const material = semaforo.focos[color].material as THREE.MeshStandardMaterial
    material.color.setHex(color === activo ? COLORES[color] : APAGADOS[color])
    material.emissive.setHex(color === activo ? COLORES[color] : 0x000000)
    material.emissiveIntensity = color === activo ? 1.1 : 0
  })
}
