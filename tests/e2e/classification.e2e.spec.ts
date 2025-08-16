import { writeFile } from 'fs/promises'
import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Classification E2E', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('A4 classification appears on overlay/label', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(1500)
    await expect(page.locator('#docTypeLabel')).toBeVisible()
      const metrics = await page.locator('#metricsJson').innerText()
      await writeFile(`tests/reports/metrics-${Date.now()}.json`, metrics || '{}')
      await page.screenshot({ path: `tests/reports/snap-${Date.now()}.png`, fullPage: true })
    const label = await page.locator('#docTypeLabel').innerText()
    // In this scenario we assume FAKE_CAM_Y4M points to an A4-like clip
    // The CI will call with the proper file
    expect(label).toContain('A4')
  })
})
