import React, { useEffect } from 'react'
import type { PreviewAnalysis } from '../worker/types'

export function OverlayCanvas({ canvasRef, analysis, flags }: { canvasRef: React.RefObject<HTMLCanvasElement>, analysis: PreviewAnalysis | null, flags?: any }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (analysis?.polygon && (flags?.showOverlay ?? true)) {
      const pts = analysis.polygon
      ctx.lineWidth = 3
      ctx.strokeStyle = analysis.decision === 'READY_TO_CAPTURE' ? '#21c55d' : '#eab308'
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.closePath()
      ctx.stroke()
    }
  }, [analysis])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
}
