import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Manual capture mode', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('can disable autoscatto and capture via shutter', async ({ page }) => {
    await page.goto('/')
    // Open settings
    await page.getByLabel('Impostazioni').click()
    // Toggle Autoscatto off
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await modal.getByText('Autoscatto').click()
    await modal.getByText('Applica').click()
    // Click shutter
    await page.locator('#shutter').click()
    // Expect a result image to appear
    await expect(page.locator('#finalImage')).toBeVisible({ timeout: 5000 })
  })
})
