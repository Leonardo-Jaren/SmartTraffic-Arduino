import { expect, test, type Locator, type Page } from '@playwright/test'

async function seleccionarEnMapa(page: Page, canvas: Locator, boton: string) {
  const caja = await canvas.boundingBox()
  if (!caja) throw new Error('La maqueta no tiene tamaño visible')
  for (const y of [0.32, 0.4, 0.48, 0.56, 0.64, 0.72, 0.8]) {
    for (const x of [0.25, 0.32, 0.39, 0.46, 0.53, 0.6, 0.67, 0.74]) {
      await canvas.click({ position: { x: caja.width * x, y: caja.height * y }, force: true })
      if (await page.getByRole('button', { name: boton }).isVisible()) return
    }
  }
  throw new Error(`No se encontró en la maqueta la acción: ${boton}`)
}

test('maqueta interactiva, controles y desconexión', async ({ page }) => {
  const errores: string[] = []
  page.on('pageerror', (error) => errores.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Vista general.' })).toBeVisible()
  await expect(page.locator('.error-3d')).toHaveCount(0)
  const canvas = page.locator('.escena-3d canvas')
  await expect(canvas).toBeVisible()
  await page.getByRole('button', { name: 'Pausar' }).click()
  await page.getByRole('button', { name: 'Seleccionar semáforo S1, cruce I1' }).click()
  await expect(page.getByText('Semáforo S1 · I1')).toBeVisible()
  await page.getByLabel('Velocidad de vehículos').fill('10')
  await expect(page.getByText('10 km/h', { exact: true }).first()).toBeVisible()
  await page.getByRole('checkbox').uncheck()
  await expect(page.getByText('0 activos', { exact: false })).toBeVisible()

  await seleccionarEnMapa(page, canvas, 'Cerrar este tramo')
  await page.getByRole('button', { name: 'Cerrar este tramo' }).click()
  await expect(page.getByRole('button', { name: 'Volver a abrir tramo' })).toBeVisible()
  await expect(page.getByText('recorridos afectados', { exact: false })).toBeVisible()
  await page.getByRole('button', { name: 'Volver a abrir tramo' }).click()

  await seleccionarEnMapa(page, canvas, 'Agregar al cruce')
  await page.getByRole('button', { name: 'Agregar al cruce' }).click()
  await expect(page.getByText('Luces virtuales añadidas a este cruce: 1.')).toBeVisible()

  const antes = await canvas.screenshot()
  const caja = await canvas.boundingBox()
  if (!caja) throw new Error('No se encuentra el canvas')
  await page.mouse.move(caja.x + caja.width / 2, caja.y + caja.height / 2)
  await page.mouse.down()
  await page.mouse.move(caja.x + caja.width / 2 + 110, caja.y + caja.height / 2 + 20, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(350)
  const despues = await canvas.screenshot()
  expect(antes.equals(despues)).toBe(false)

  await page.locator('.campos-tiempo label').first().locator('input').fill('5')
  await page.getByRole('button', { name: 'Aplicar a simulación' }).click()
  await expect(page.getByText('Principal: entre 15 y 120 s.')).toBeVisible()
  await page.getByRole('button', { name: 'Dispositivo', exact: true }).click()
  await expect(page.getByText('Arduino sin conexión.')).toBeVisible()
  await expect(page.locator('.semaforo-item').filter({ hasText: 'Sin dato' })).toHaveCount(6)
  expect(errores).toEqual([])
})

test('interfaz adaptable en móvil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.locator('.escena-3d canvas')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  await expect(page.getByRole('button', { name: 'Simulación', exact: true })).toBeVisible()
})

test('identifica el simulador serial y oculta su estado al desconectarse', async ({ page }) => {
  let conectado = true
  await page.route('**/api/dispositivo/', async (ruta) => {
    await ruta.fulfill({
      json: {
        fuente: conectado ? 'simulado' : 'arduino',
        conectado,
        modo: conectado ? 'SIMULADO' : 'DESCONECTADO',
        colores: conectado ? ['rojo', 'rojo', 'rojo', 'rojo', 'rojo', 'rojo'] : [],
        ultimo_reporte: null,
        puerto: '/dev/pts/simulado',
        error: '',
        tiempos_confirmados: null,
        ultimo_comando: null,
      },
    })
  })
  await page.goto('/')
  await expect(page.getByText('Simulador serial conectado')).toBeVisible()
  await page.getByRole('button', { name: 'Dispositivo', exact: true }).click()
  await expect(page.getByText('SIMULADOR SERIAL', { exact: true })).toBeVisible()
  await expect(page.getByText('Datos de prueba de un dispositivo simulado', { exact: false })).toBeVisible()
  conectado = false
  await expect(page.getByText('Arduino sin conexión.')).toBeVisible({ timeout: 5000 })
  await expect(page.locator('.semaforo-item').filter({ hasText: 'Sin dato' })).toHaveCount(6)
})
