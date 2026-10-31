// Diagnóstico determinista, sin navegador ni hardware.
// Ejecutar desde frontend: node scripts/medir-flujo.mjs [--comparar=COMMIT]
import ts from 'typescript'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const frontend = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), 'smarttraffic-flujo-'))
const archivos = []
const aleatorioOriginal = Math.random

async function medir(revision, etiqueta) {
  for (const nombre of ['mapa', 'rutas', 'luces', 'vehiculos', ...(!revision ? ['movimientos'] : [])]) {
    const relativo = `src/composables/simulacion/${nombre}.ts`
    const fuente = revision
      ? execFileSync('git', ['show', `${revision}:frontend/${relativo}`], { cwd: frontend, encoding: 'utf8' })
      : fs.readFileSync(path.join(frontend, relativo), 'utf8')
    const codigo = ts
      .transpileModule(fuente, {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      })
      .outputText.replace(/from '\.\/(\w+)'/g, (_, modulo) => `from './${etiqueta}-${modulo}.mjs'`)
    const archivo = path.join(carpeta, `${etiqueta}-${nombre}.mjs`)
    fs.writeFileSync(archivo, codigo)
    archivos.push(archivo)
  }
  const cargar = (modulo) => import(pathToFileURL(path.join(carpeta, `${etiqueta}-${modulo}.mjs`)))
  const { CRUCES } = await cargar('mapa')
  const { calcularFase, TIEMPOS_SIMULACION, TIEMPOS_INICIALES } = await cargar('luces')
  const { avanzarVehiculos, crearVehiculo } = await cargar('vehiculos')
  const objetivo = Number(process.argv.find((arg) => arg.startsWith('--cantidad='))?.split('=')[1] ?? 24)
  let semilla = 7147
  Math.random = () => {
    semilla = (semilla * 16807) % 2147483647
    return (semilla - 1) / 2147483646
  }
  let coches = [],
    siguiente = 0,
    ultimoIngreso = -1
  let detenidos = 0,
    muestras = 0,
    salidas = 0,
    todosDetenidos = 0
  for (let paso = 0; paso < 3000; paso++) {
    const tiempo = paso / 10
    const fases = CRUCES.map((id) => calcularFase(id, tiempo, TIEMPOS_SIMULACION ?? TIEMPOS_INICIALES))
    const anteriores = coches.length
    coches = avanzarVehiculos(coches, 0.1, new Set(), fases, 45)
    salidas += anteriores - coches.length
    if (coches.length < objetivo && tiempo - ultimoIngreso >= 0.7) {
      const coche = crearVehiculo(siguiente++, coches, new Set())
      if (coche) coches.push(coche)
      ultimoIngreso = tiempo
    }
    if (tiempo > 30) {
      const parados = coches.filter((coche) => coche.detenido).length
      detenidos += parados
      muestras += coches.length
      if (coches.length && parados === coches.length) todosDetenidos += 0.1
    }
  }
  return {
    version: revision ?? 'trabajo actual',
    duracionSegundos: 300,
    objetivo,
    velocidadKmh: 45,
    salidas,
    porcentajeTiempoDetenido: Math.round((100 * detenidos) / muestras),
    segundosTodosDetenidos: Math.round(todosDetenidos),
    presentesAlFinal: coches.length,
  }
}

try {
  const comparar = process.argv.find((arg) => arg.startsWith('--comparar='))?.split('=')[1]
  if (comparar) console.log(JSON.stringify(await medir(comparar, 'antes'), null, 2))
  console.log(JSON.stringify(await medir(null, 'actual'), null, 2))
} finally {
  Math.random = aleatorioOriginal
  archivos.forEach((archivo) => fs.unlinkSync(archivo))
  fs.rmdirSync(carpeta)
}
