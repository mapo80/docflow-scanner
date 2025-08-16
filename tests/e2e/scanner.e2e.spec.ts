import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Scanner E2E', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M pointing to a .y4m clip')

  test('renders and shows state', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=State:')).toBeVisible()
    // Wait some frames
    await page.waitForTimeout(1500)
    // Verify overlay canvas present
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })
})
