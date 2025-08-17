import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Gallery multi-capture', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('shows placeholder when empty', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Nessuno scatto')).toBeVisible()
  })
})
