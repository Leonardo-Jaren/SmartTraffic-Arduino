import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { ColorSemaforo } from '@/types/trafico'

const COLORES: Record<ColorSemaforo, number> = { rojo: 0xff2828, amarillo: 0xffaa00, verde: 0x10f080 }
const APAGADOS: Record<ColorSemaforo, number> = { rojo: 0x2c1010, amarillo: 0x282008, verde: 0x082414 }
const GLOW_INTENSIDAD: Record<ColorSemaforo, number> = { rojo: 2.0, amarillo: 1.8, verde: 2.2 }

export interface InterfazSemaforo {
  grupo: THREE.Group
  posteGrupo: THREE.Group
  cabeza: THREE.Group
  brazo: THREE.Mesh
  focos: Record<ColorSemaforo, THREE.Mesh>
  aroSeleccion: THREE.Mesh
}

/** Crea un cabezal óptico realista de 3 luces LED con viseras parasol */
export function crearCabezalOptico(): {
  cabeza: THREE.Group
  focos: Record<ColorSemaforo, THREE.Mesh>
} {
  const cabeza = new THREE.Group()

  // Placa de contraste posterior
  const placa = new THREE.Mesh(
    new RoundedBoxGeometry(0.42, 1.06, 0.03, 3, 0.03),
    new THREE.MeshStandardMaterial({ color: 0x111618, metalness: 0.25, roughness: 0.8 }),
  )
  placa.position.z = -0.09
  cabeza.add(placa)

  // Carcasa principal
  const carcasa = new THREE.Mesh(
    new RoundedBoxGeometry(0.36, 0.98, 0.2, 3, 0.04),
    new THREE.MeshStandardMaterial({ color: 0x1c2429, metalness: 0.4, roughness: 0.45 }),
  )
  cabeza.add(carcasa)

  const focos = {} as Record<ColorSemaforo, THREE.Mesh>
  const posicionesY = [0.3, 0, -0.3]

  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color, i) => {
    const y = posicionesY[i]!

    // Marco exterior de la lente
    const marco = new THREE.Mesh(
      new THREE.TorusGeometry(0.092, 0.016, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x101518, roughness: 0.7 }),
    )
    marco.position.set(0, y, 0.1)
    cabeza.add(marco)

    // Lente semiesférica emisiva
    const lente = new THREE.Mesh(
      new THREE.SphereGeometry(0.082, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({
        color: APAGADOS[color],
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.18,
        metalness: 0.1,
      }),
    )
    lente.rotation.x = Math.PI / 2
    lente.position.set(0, y, 0.095)
    lente.name = `luz-${color}`
    cabeza.add(lente)

    // Visera curva parasol (visera envolvente auténtica)
    const visera = new THREE.Mesh(
      new THREE.CylinderGeometry(0.105, 0.115, 0.11, 14, 1, true, -Math.PI * 0.82, Math.PI * 0.64),
      new THREE.MeshStandardMaterial({
        color: 0x141b20,
        roughness: 0.5,
        side: THREE.DoubleSide,
      }),
    )
    visera.rotation.x = Math.PI / 2 + 0.12
    visera.position.set(0, y + 0.035, 0.14)
    cabeza.add(visera)

    focos[color] = lente
  })

  return { cabeza, focos }
}

/** Semáforo individual o componente de poste dual estilizado */
export function crearSemaforo(opciones: { alturaBrazo?: number } = {}): InterfazSemaforo {
  const grupo = new THREE.Group()
  const posteGrupo = new THREE.Group()

  // Base y poste de acero galvanizado
  const poste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.045, 0.065, 1.55, 14),
    new THREE.MeshStandardMaterial({ color: 0x48555e, metalness: 0.65, roughness: 0.35 }),
  )
  poste.position.y = 0.775

  const pie = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.18, 0.1, 14),
    new THREE.MeshStandardMaterial({ color: 0x364249, metalness: 0.5, roughness: 0.5 }),
  )
  pie.position.y = 0.05

  posteGrupo.add(poste, pie)
  grupo.add(posteGrupo)

  const altura = opciones.alturaBrazo ?? 1.38
  const brazo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.18, 10),
    new THREE.MeshStandardMaterial({ color: 0x2e3a42, metalness: 0.6, roughness: 0.4 }),
  )
  brazo.rotation.x = Math.PI / 2
  brazo.position.set(0, altura, 0.09)
  grupo.add(brazo)

  // Aro de selección interactiva
  const aroSeleccion = new THREE.Mesh(
    new THREE.TorusGeometry(0.28, 0.026, 8, 24),
    new THREE.MeshBasicMaterial({ color: 0x00f0b0 }),
  )
  aroSeleccion.rotation.x = -Math.PI / 2
  aroSeleccion.position.y = 0.07
  aroSeleccion.visible = false
  grupo.add(aroSeleccion)

  const { cabeza, focos } = crearCabezalOptico()
  cabeza.position.set(0, altura, 0.22)
  grupo.add(cabeza)

  for (const obj of [poste, pie, brazo, cabeza]) {
    obj.castShadow = true
    obj.userData.proyectaSombra = true
  }

  return { grupo, posteGrupo, cabeza, brazo, focos, aroSeleccion }
}

/** Aplica color activo a un semáforo iluminando sus ópticas */
export function colorearSemaforo(semaforo: InterfazSemaforo, activo: ColorSemaforo | null) {
  ;(['rojo', 'amarillo', 'verde'] as const).forEach((color) => {
    const material = semaforo.focos[color].material as THREE.MeshStandardMaterial
    const estaActivo = color === activo
    material.color.setHex(estaActivo ? COLORES[color] : APAGADOS[color])
    material.emissive.setHex(estaActivo ? COLORES[color] : 0x000000)
    material.emissiveIntensity = estaActivo ? GLOW_INTENSIDAD[color] : 0
  })
}
