import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Mini gallery strip', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('shows thumbnail after accept and allows delete', async ({ page }) => {
    await page.goto('/')
    // Disable autoscatto
    await page.getByLabel('Impostazioni').click()
    const modal = page.getByRole('dialog')
    await modal.getByText('Autoscatto').click()
    await modal.getByText('Applica').click()

    // Capture -> preview -> accept
    await page.locator('#shutter').click()
    await expect(page.getByRole('dialog').getByText('Anteprima documento')).toBeVisible()
    await page.getByRole('button', { name: 'Usa questa' }).click()

    // Expect a mini-thumbnail to exist
    const openBtns = page.getByRole('button', { name: /Apri anteprima scatto/ })
    await expect(openBtns.first()).toBeVisible()

    // Open existing preview and delete
    await openBtns.first().click()
    await expect(page.getByRole('dialog').getByText('Anteprima documento')).toBeVisible()
    await page.getByRole('button', { name: 'Elimina' }).click()

    // Mini thumb should disappear
    await expect(openBtns.first()).toBeHidden()
  })
})
