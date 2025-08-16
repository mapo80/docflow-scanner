import { describe, it, expect } from 'vitest'
import { ConfigService } from '../../src/utils/ConfigService'

describe('config service', () => {
  it('loads thresholds', () => {
    const cfg = new ConfigService()
    const t = cfg.getQualityThresholds()
    expect(t.blurMin).toBeGreaterThan(0)
    expect(t.stabilityFrames).toBeGreaterThan(0)
  })
})
