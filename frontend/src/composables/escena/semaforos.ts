import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ColorSemaforo } from '@/types/trafico'

const COLORES: Record<ColorSemaforo, number> = { rojo: 0xff2828, amarillo: 0xffaa00, verde: 0x10f080 }
const APAGADOS: Record<ColorSemaforo, number> = { rojo: 0x301010, amarillo: 0x2e240b, verde: 0x092616 }
const GLOW_INTENSIDAD: Record<ColorSemaforo, number> = { rojo: 1.8, amarillo: 1.6, verde: 1.9 }

export function crearSemaforo() {
  const grupo = new THREE.Group()

  // Base y poste metálico galvanizado
  const poste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.08, 1.45, 16),
    new THREE.MeshStandardMaterial({ color: 0x48565e, metalness: 0.65, roughness: 0.32 }),
  )
  poste.position.y = 0.73

  const pie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.22, 0.12, 16),
    new THREE.MeshStandardMaterial({ color: 0x3b464c, metalness: 0.5, roughness: 0.45 }),
  )
  pie.position.y = 0.06

  const remateSuperior = new THREE.Mesh(
    new THREE.SphereGeometry(0.075, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x3b464c, metalness: 0.5, roughness: 0.45 }),
  )
  remateSuperior.position.y = 1.45

  // Brazo de soporte horizontal que une poste y cabeza
  const brazoSoporte = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.22, 12),
    new THREE.MeshStandardMaterial({ color: 0x2a353b, metalness: 0.6, roughness: 0.4 }),
  )
  brazoSoporte.rotation.x = Math.PI / 2
  brazoSoporte.position.set(0, 1.6, 0.08)

  // Placa de contraste trasera (típica de semáforos viales)
  const placaTrasera = new THREE.Mesh(
    new RoundedBoxGeometry(0.62, 1.28, 0.04, 3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x111619, metalness: 0.2, roughness: 0.8 }),
  )
  placaTrasera.position.set(0, 1.6, 0.12)

  // Carcasa principal
  const carcasa = new THREE.Mesh(
    new RoundedBoxGeometry(0.48, 1.16, 0.28, 4, 0.06),
    new THREE.MeshStandardMaterial({ color: 0x1e282e, metalness: 0.35, roughness: 0.45 }),
  )
  carcasa.position.set(0, 1.6, 0.25)

  grupo.add(poste, pie, remateSuperior, brazoSoporte, placaTrasera, carcasa)

  // Aro de selección interactiva
  const aroSeleccion = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.03, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x00f0b0 }),
  )
  aroSeleccion.rotation.x = -Math.PI / 2
  aroSeleccion.position.y = 0.08
  aroSeleccion.visible = false
  grupo.add(aroSeleccion)

  const focos = {} as Record<ColorSemaforo, THREE.Mesh>

  // Tres ópticas: rojo (arriba), amarillo (centro), verde (abajo)
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color, indice) => {
    const yCentro = 1.96 - indice * 0.36

    // Aro embellecedor negro exterior
    const marco = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.02, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x12171a, roughness: 0.7 }),
    )
    marco.position.set(0, yCentro, 0.39)
    grupo.add(marco)

    // Lente semiesférica de alta fidelidad
    const lente = new THREE.Mesh(
      new THREE.SphereGeometry(0.095, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: APAGADOS[color],
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.2,
        metalness: 0.1,
      }),
    )
    lente.rotation.x = Math.PI / 2
    lente.position.set(0, yCentro, 0.38)
    lente.name = `luz-${color}`
    grupo.add(lente)

    // Visera curva parasol (cilindro abierto inclinado)
    const visera = new THREE.Mesh(
      new THREE.CylinderGeometry(0.125, 0.135, 0.13, 16, 1, true, -Math.PI * 0.82, Math.PI * 0.64),
      new THREE.MeshStandardMaterial({
        color: 0x141b20,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    )
    visera.rotation.x = Math.PI / 2 + 0.15
    visera.position.set(0, yCentro + 0.04, 0.43)
    grupo.add(visera)

    focos[color] = lente
  })

  for (const objeto of [poste, pie, placaTrasera, carcasa, brazoSoporte]) {
    objeto.castShadow = true
    objeto.userData.proyectaSombra = true
  }

  return { grupo, focos, aroSeleccion }
}

export function colorearSemaforo(semaforo: ReturnType<typeof crearSemaforo>, activo: ColorSemaforo | null) {
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color) => {
    const material = semaforo.focos[color].material as THREE.MeshStandardMaterial
    const estaActivo = color === activo
    material.color.setHex(estaActivo ? COLORES[color] : APAGADOS[color])
    material.emissive.setHex(estaActivo ? COLORES[color] : 0x000000)
    material.emissiveIntensity = estaActivo ? GLOW_INTENSIDAD[color] : 0
  })
}
