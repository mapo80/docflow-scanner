import { test, expect } from '@playwright/test'

const hasFake = !!process.env.FAKE_CAM_Y4M

test.describe('Classification E2E', () => {
  test.skip(!hasFake, 'Requires FAKE_CAM_Y4M')

  test('page shows profile id', async ({ page }) => {
    await page.goto('/')
    const profile = await page.locator('#profileId').innerText()
    expect(profile.length).toBeGreaterThan(0)
  })
})
