import { describe, it, expect } from 'vitest'
import { decide } from '../../src/worker/decision'

const q = (o: Partial<{
  blurScore: number, glarePct: number, coveragePct: number, centerOffsetPct: number, aspectRatio: number, perspectiveTiltDeg: number, stabilityScore: number
}>) => ({
  blurScore: 1, glarePct: 0, coveragePct: 40, centerOffsetPct: 5, aspectRatio: 1.4, perspectiveTiltDeg: 0, stabilityScore: 1, ...o
})

describe('adaptive decide()', () => {
  it('A4 requires higher coverage', () => {
    const d = decide(q({ coveragePct: 25 }), { label: 'A4' } as any)
    expect(d).toBe('MOVE_CLOSER')
  })
  it('Receipt allows lower coverage', () => {
    const d = decide(q({ coveragePct: 22 }), { label: 'Receipt' } as any)
    expect(d).toBe('READY_TO_CAPTURE')
  })
  it('Too blurry blocks capture', () => {
    const d = decide(q({ blurScore: 0.2 }), { label: 'A4' } as any)
    expect(d).toBe('TOO_BLURRY')
  })
})
