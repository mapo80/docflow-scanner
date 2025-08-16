import { describe, it, expect } from 'vitest'
// simple ordering heuristic test
type P = {x:number,y:number}
function orderQuad(pts: P[]): P[] {
  const arr = pts.slice().sort((a,b)=> a.y===b.y ? a.x-b.x : a.y-b.y)
  const top = [arr[0], arr[1]].sort((a,b)=>a.x-b.x)
  const bot = [arr[2], arr[3]].sort((a,b)=>a.x-b.x)
  return [top[0], top[1], bot[1], bot[0]]
}
it('orders a simple rectangle TL,TR,BR,BL', () => {
  const poly = [{x:10,y:10},{x:110,y:10},{x:110,y:60},{x:10,y:60}]
  const [tl,tr,br,bl] = orderQuad(poly)
  expect(tl).toEqual({x:10,y:10})
  expect(tr).toEqual({x:110,y:10})
  expect(br).toEqual({x:110,y:60})
  expect(bl).toEqual({x:10,y:60})
})
