import React, { useEffect, useRef } from 'react'

type S = { toMat?: number, detect?: number, score?: number }

export function ProfilerChart({ series }: { series: S[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current; if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width = 420, H = canvas.height = 140
    ctx.clearRect(0,0,W,H)
    const keys: (keyof S)[] = ['toMat','detect','score']
    const max = Math.max(1, ...series.flatMap(s => keys.map(k => Number(s[k]||0))))
    const drawLine = (k: keyof S) => {
      ctx.beginPath()
      series.forEach((s,i) => {
        const x = i/(Math.max(1,series.length-1)) * (W-20) + 10
        const y = H - (Number(s[k]||0)/max)*(H-20) - 10
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y)
      })
      ctx.stroke()
    }
    ctx.strokeStyle = '#666'; ctx.strokeRect(0.5,0.5,W-1,H-1)
    ctx.strokeStyle = '#1f77b4'; drawLine('toMat')
    ctx.strokeStyle = '#ff7f0e'; drawLine('detect')
    ctx.strokeStyle = '#2ca02c'; drawLine('score')
  }, [series])
  return <canvas ref={ref} />
}
