import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('IoU with GT', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('renders overlay canvas', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('canvas')).toBeVisible()
  })
})
