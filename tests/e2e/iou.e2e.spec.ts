import { test, expect } from '@playwright/test'
import { readFile } from 'fs/promises'

function iou(polyA: any[], polyB: any[]) {
  // Simple bbox IoU for robustness in E2E (polygon IoU exists in unit tests)
  const bb = (p:any[]) => {
    const xs = p.map(pt=>pt.x), ys = p.map(pt=>pt.y)
    return { x1: Math.min(...xs), y1: Math.min(...ys), x2: Math.max(...xs), y2: Math.max(...ys) }
  }
  const A = bb(polyA), B = bb(polyB)
  const ix1 = Math.max(A.x1, B.x1), iy1 = Math.max(A.y1, B.y1)
  const ix2 = Math.min(A.x2, B.x2), iy2 = Math.min(A.y2, B.y2)
  const iw = Math.max(0, ix2 - ix1), ih = Math.max(0, iy2 - iy1)
  const inter = iw * ih
  const areaA = (A.x2-A.x1)*(A.y2-A.y1)
  const areaB = (B.x2-B.x1)*(B.y2-B.y1)
  const uni = areaA + areaB - inter
  return uni>0 ? inter/uni : 0
}

test.describe('IoU with GT', () => {
  test('polygon bbox IoU >= 0.6 vs GT', async ({ page }) => {
    const clip = process.env.FAKE_CAM_Y4M
    test.skip(!clip, 'Requires FAKE_CAM_Y4M')
    // Derive GT path: replace .y4m with .json in same dir
    const gt = clip.replace(/\.y4m$/,'\.json')
    const gtJson = JSON.parse(await readFile(gt, 'utf-8'))
    await page.goto('/')
    await page.waitForTimeout(2000)
    const text = await page.locator('#metricsJson').innerText()
    const analysis = JSON.parse(text || '{}')
    const poly = analysis?.polygon || analysis?.analysis?.polygon || null
    expect(poly).not.toBeNull()
    const i = iou(poly, gtJson.polygon)
    expect(i).toBeGreaterThanOrEqual(0.6)
  })
})
