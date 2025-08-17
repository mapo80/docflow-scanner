import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Capture flow', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('shutter click does not produce image without analysis', async ({ page }) => {
    await page.goto('/')
    await page.locator('#shutter').click()
    await expect(page.locator('#finalImage')).toHaveCount(0)
  })
})
