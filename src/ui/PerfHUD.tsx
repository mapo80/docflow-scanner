import React, { useEffect, useRef, useState } from 'react'
import type { PreviewAnalysis } from '../worker/types'

export function PerfHUD({ analysis }: { analysis: PreviewAnalysis | null }) {
  const [fps, setFps] = useState(0)
  const last = useRef<number>(performance.now())
  const frames = useRef<number[]>([])

  useEffect(() => {
    const now = performance.now()
    const dt = now - last.current
    last.current = now
    if (dt > 0 && dt < 1000) {
      const cur = 1000 / dt
      frames.current.push(cur)
      if (frames.current.length > 30) frames.current.shift()
      const avg = frames.current.reduce((a,b)=>a+b,0) / frames.current.length
      setFps(avg)
    }
  }, [analysis])

  const step = analysis?.perf || {}
  return (
    <div style={{position:'absolute', top:8, right:8, background:'#000a', color:'#fff', padding:'8px 10px', borderRadius:8, fontFamily:'ui-monospace', fontSize:12}}>
      <div><b>FPS:</b> {fps.toFixed(1)}</div>
      <div><b>toMat:</b> {Number(step.toMat||0).toFixed(2)} ms</div>
      <div><b>detect:</b> {Number(step.detect||0).toFixed(2)} ms</div>
      <div><b>score:</b> {Number(step.score||0).toFixed(2)} ms</div>
    </div>
  )
}
