import { describe, it, expect } from 'vitest'
import { polygonArea, centroid, aspectRatio } from '../../src/utils/geometry'

describe('geometry', () => {
  it('area of unit square is 1', () => {
    const pts = [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]
    expect(polygonArea(pts)).toBeCloseTo(1)
  })
  it('centroid of unit square is (0.5,0.5)', () => {
    const pts = [{x:0,y:0},{x:1,y:0},{x:1,y:1},{x:0,y:1}]
    const c = centroid(pts)
    expect(c.x).toBeCloseTo(0.5)
    expect(c.y).toBeCloseTo(0.5)
  })
  it('aspect of 2x1 quad is 2', () => {
    const pts = [{x:0,y:0},{x:2,y:0},{x:2,y:1},{x:0,y:1}] as any
    expect(aspectRatio(pts)).toBeCloseTo(2)
  })
})
