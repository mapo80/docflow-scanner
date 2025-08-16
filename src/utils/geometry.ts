export type Point = { x: number, y: number }
export type Quad = [Point, Point, Point, Point]

export function polygonArea(pts: Point[]): number {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    a += pts[i].x * pts[j].y - pts[j].x * pts[i].y
  }
  return Math.abs(a / 2)
}
export function centroid(pts: Point[]): Point {
  const a = polygonArea(pts)
  let cx = 0, cy = 0
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length
    const f = pts[i].x * pts[j].y - pts[j].x * pts[i].y
    cx += (pts[i].x + pts[j].x) * f
    cy += (pts[i].y + pts[j].y) * f
  }
  const factor = 1 / (6 * a || 1)
  return { x: cx * factor, y: cy * factor }
}
export function aspectRatio(p: Quad): number {
  const w = Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y)
  const h = Math.hypot(p[3].x - p[0].x, p[3].y - p[0].y)
  return w / (h || 1)
}
export function centerOffsetPct(p: Point, w: number, h: number): number {
  const cx = w / 2, cy = h / 2
  const dx = (p.x - cx) / w
  const dy = (p.y - cy) / h
  return Math.hypot(dx, dy) * 100
}

// Sutherland–Hodgman polygon clipping (convex clip polygon)
function clip(subject: Point[], clipPoly: Point[]): Point[] {
  let output = subject
  for (let i=0;i<clipPoly.length;i++) {
    const A = clipPoly[i]
    const B = clipPoly[(i+1)%clipPoly.length]
    const input = output.slice()
    output = []
    for (let j=0;j<input.length;j++) {
      const P = input[j]
      const Q = input[(j+1)%input.length]
      const inside = (p:Point) => (B.x-A.x)*(p.y-A.y) - (B.y-A.y)*(p.x-A.x) >= 0
      const inter = (): Point => {
        const dx = Q.x - P.x; const dy = Q.y - P.y
        const da = A.x - B.x; const db = A.y - B.y
        const n1 = A.x*B.y - A.y*B.x
        const n2 = P.x*Q.y - P.y*Q.x
        const x = (n1*dx - n2*da) / (dx*db - dy*da)
        const y = (n1*dy - n2*db) / (dx*db - dy*da)
        return { x, y }
      }
      const Pin = inside(P), Qin = inside(Q)
      if (Pin && Qin) output.push(Q)
      else if (Pin && !Qin) output.push(inter())
      else if (!Pin && Qin) { output.push(inter()); output.push(Q) }
    }
  }
  return output
}

export function polygonIoU(p: Point[], q: Point[]): number {
  if (p.length<3 || q.length<3) return 0
  const interPoly = clip(p, q)
  const interArea = polygonArea(interPoly)
  const a1 = polygonArea(p), a2 = polygonArea(q)
  const uni = a1 + a2 - interArea
  return uni>0 ? interArea/uni : 0
}
