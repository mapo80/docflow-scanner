import { describe, it, expect } from 'vitest'
import { polygonIoU } from '../../src/utils/geometry'

const square = (x:number,y:number,s:number) => ([
  {x, y}, {x:x+s, y}, {x:x+s, y:y+s}, {x, y:y+s}
])

describe('polygonIoU', () => {
  it('IoU of identical squares is 1', () => {
    const a = square(0,0,10), b = square(0,0,10)
    expect(polygonIoU(a,b)).toBeCloseTo(1)
  })
  it('IoU of disjoint is 0', () => {
    const a = square(0,0,10), b = square(20,20,5)
    expect(polygonIoU(a,b)).toBeCloseTo(0)
  })
})
