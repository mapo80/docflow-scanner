import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Manual capture mode', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('shutter button is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#shutter')).toBeVisible()
  })
})
