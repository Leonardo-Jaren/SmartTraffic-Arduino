import { expect, test } from '@playwright/test'

test('la vista a pantalla completa conserva controles y selección, y sale con Escape', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click()
  await expect(page.locator('.aplicacion')).toHaveClass(/vista-inmersiva/)
  await expect(page.locator('.escena-3d canvas')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Control de simulación' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Elemento seleccionado' })).toBeVisible()
  await expect(page.locator('.barra-lateral')).toBeHidden()
  const canvas = page.locator('.escena-3d canvas')
  const caja = await canvas.boundingBox()
  if (!caja) throw new Error('No se encuentra la maqueta')
  let carreteraSeleccionada = false
  for (const y of [0.3, 0.4, 0.5, 0.6, 0.7, 0.8]) {
    for (const x of [0.25, 0.32, 0.39, 0.46, 0.53, 0.6, 0.67, 0.74]) {
      await canvas.click({ position: { x: caja.width * x, y: caja.height * y }, force: true })
      if (await page.getByRole('button', { name: 'Cerrar este tramo' }).isVisible()) {
        carreteraSeleccionada = true
        break
      }
    }
    if (carreteraSeleccionada) break
  }
  expect(carreteraSeleccionada).toBe(true)
  await page.getByRole('button', { name: 'Cerrar este tramo' }).click()
  await expect(page.getByRole('button', { name: 'Volver a abrir tramo' })).toBeVisible()
  await page.getByLabel('Velocidad de vehículos').fill('15')
  await page.keyboard.press('Escape')
  await expect(page.locator('.aplicacion')).not.toHaveClass(/vista-inmersiva/)
  await expect(page.locator('.barra-lateral')).toBeVisible()
  await expect(page.getByLabel('Velocidad de vehículos')).toHaveValue('15')
})

test('la alternativa en ventana funciona cuando el navegador rechaza pantalla completa', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    Object.defineProperty(Element.prototype, 'requestFullscreen', {
      value: () => Promise.reject(new Error('No disponible')),
    })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click()
  await expect(page.locator('.aplicacion')).toHaveClass(/vista-inmersiva/)
  await expect(page.locator('.escena-3d canvas')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Control de simulación' })).toBeVisible()
  await page.getByRole('button', { name: 'Salir de pantalla completa' }).click()
  await expect(page.locator('.aplicacion')).not.toHaveClass(/vista-inmersiva/)
})

test('la vista inmersiva permite cambiar de modo y muestra la desconexión', async ({ page }) => {
  let conectado = true
  await page.route('**/api/dispositivo/', async (ruta) => {
    await ruta.fulfill({ json: {
      fuente: 'arduino', conectado, modo: conectado ? 'ACTIVO' : 'DESCONECTADO',
      colores: conectado ? ['rojo', 'rojo', 'rojo', 'rojo', 'rojo', 'rojo'] : [],
      ultimo_reporte: null, puerto: '', error: '', tiempos_confirmados: null, ultimo_comando: null,
    } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click()
  const barra = page.locator('.inmersiva-barra')
  await barra.getByRole('button', { name: 'Dispositivo' }).click()
  await expect(barra.getByText('Arduino conectado', { exact: true })).toBeVisible()
  conectado = false
  await expect(barra.getByText('Arduino desconectado', { exact: true })).toBeVisible({ timeout: 5000 })
  await barra.getByRole('button', { name: 'Simulación' }).click()
  await expect(barra.getByRole('button', { name: 'Simulación' })).toHaveClass(/elegido/)
})
