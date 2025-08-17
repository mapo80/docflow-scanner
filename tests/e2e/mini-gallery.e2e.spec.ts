import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Mini gallery strip', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('settings modal opens and closes', async ({ page }) => {
    await page.goto('/')
    await page.getByLabel('Impostazioni').click()
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await page.getByLabel('Chiudi').click()
    await expect(modal).toBeHidden()
  })
})
