import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Long-press radial menu', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('hold on thumbnail shows radial menu and can delete', async ({ page }) => {
    await page.goto('/')
    // Disable autoscatto to control timing
    await page.getByLabel('Impostazioni').click()
    const modal = page.getByRole('dialog')
    await modal.getByText('Autoscatto').click()
    await modal.getByText('Applica').click()

    // Capture and accept
    await page.locator('#shutter').click()
    await expect(page.getByRole('dialog').getByText('Anteprima documento')).toBeVisible()
    await page.getByRole('button', { name: 'Usa questa' }).click()

    const openBtns = page.getByRole('button', { name: /Apri anteprima scatto/ })
    await expect(openBtns.first()).toBeVisible()
    const thumb = openBtns.first()
    // long press ~700ms
    await thumb.dispatchEvent('pointerdown')
    await page.waitForTimeout(750)
    await thumb.dispatchEvent('pointerup')
    // click delete in radial menu (🗑️ has title Elimina)
    await page.getByTitle('Elimina').click()
    await expect(openBtns.first()).toBeHidden()
  })
})
