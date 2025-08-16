import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Preview modal flow', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('opens preview after capture and supports retake', async ({ page }) => {
    await page.goto('/')
    // disable autoscatto to control timing
    await page.getByLabel('Impostazioni').click()
    const modal = page.getByRole('dialog')
    await modal.getByText('Autoscatto').click()
    await modal.getByText('Applica').click()

    await page.locator('#shutter').click()
    // Preview modal should appear
    await expect(page.getByRole('dialog').getByText('Anteprima documento')).toBeVisible()
    // Retake path
    await page.getByRole('button', { name: 'Ripeti' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()

    // Capture again and accept
    await page.locator('#shutter').click()
    await expect(page.getByRole('dialog').getByText('Anteprima documento')).toBeVisible()
    await page.getByRole('button', { name: 'Usa questa' }).click()
    await expect(page.getByRole('dialog')).toBeHidden()
    // Final image remains visible
    await expect(page.locator('#finalImage')).toBeVisible()
  })
})
