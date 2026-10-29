import { expect, test } from '@playwright/test'

test('reubica y gira un semáforo, conserva su cruce y restaura la distribución', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Seleccionar semáforo S1, cruce I1' }).click()
  await page.getByLabel('Esquina del semáforo').selectOption('SE')
  await page.getByRole('button', { name: 'Girar 90°' }).click()
  await expect(page.getByText('Semáforo S1 · I1')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Girar 90° · 180°' })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Seleccionar semáforo S1, cruce I1' }).click()
  await expect(page.getByLabel('Esquina del semáforo')).toHaveValue('SE')
  await expect(page.getByRole('button', { name: 'Girar 90° · 180°' })).toBeVisible()
  await page.getByRole('button', { name: 'Pantalla completa', exact: true }).click()
  await expect(page.getByLabel('Esquina del semáforo')).toBeVisible()
  await page.getByRole('button', { name: 'Restaurar distribución inicial' }).click()
  await expect(page.getByLabel('Esquina del semáforo')).toHaveValue('NO')
  await expect(page.getByRole('button', { name: 'Girar 90° · 90°' })).toBeVisible()
})
