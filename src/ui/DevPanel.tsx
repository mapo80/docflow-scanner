import React, { useEffect, useMemo, useState } from 'react'
import { CvWorkerClient } from '../worker/CvWorkerClient'
import { buildEffectivePolicies } from '../utils/ProfileService'
import { TelemetryExporter } from '../utils/TelemetryExporter'
import type { PreviewAnalysis } from '../worker/types'
import { ProfilerChart } from './ProfilerChart'
import { RuntimeConfig } from '../utils/RuntimeConfig'

export function DevPanel({ worker, analysis }:{ worker: CvWorkerClient, analysis: PreviewAnalysis | null }) {
  const base = useMemo(()=>buildEffectivePolicies(), [])
  const [thr, setThr] = useState<any>(base.thresholds)
  const [adaptive] = useState<any>(base.adaptive)
  const features = useMemo(() => RuntimeConfig.load(), [])
  const [series, setSeries] = useState<any[]>([])
  const [tel] = useState(()=> new TelemetryExporter())

  useEffect(() => {
    const url = new URL(window.location.href)
    if (url.searchParams.get('devpanel') !== '1') return
    const id = setInterval(()=>{
      if (analysis?.perf) {
        setSeries(s => {
          const next = [...s, analysis.perf]
          if (next.length>60) next.shift()
          return next
        })
        tel.push({ ts: Date.now(), decision: analysis.decision, docType: analysis.docType?.label, perf: analysis.perf, quality: analysis.quality })
      }
    }, 200)
    return () => clearInterval(id)
  }, [analysis])

  const apply = async () => {
    await worker.updatePolicies({ thresholds: thr, adaptive, features })
  }
  const reset = async () => {
    const b = buildEffectivePolicies()
    setThr(b.thresholds); await worker.updatePolicies({ thresholds: b.thresholds, adaptive: b.adaptive, features })
  }
  const url = new URL(window.location.href)
  const visible = url.searchParams.get('devpanel') === '1'
  if (!visible) return null

  return (
    <div style={{position:'absolute', bottom:12, right:12, width:460, background:'#0b1020cc', color:'#fff', padding:12, borderRadius:12, fontFamily:'ui-sans-serif', fontSize:13}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <b>Dev Panel</b>
        <div>
          <button onClick={()=>tel.start()}>Start Rec</button>
          <button onClick={()=>tel.stop()}>Stop</button>
          <button onClick={()=>tel.downloadJSON()}>JSON</button>
          <button onClick={()=>tel.downloadCSV()}>CSV</button>
        </div>
      </div>
      <div style={{marginTop:8}}>
        <label>Blur min: {thr.blurMin.toFixed?.(2)}</label>
        <input type="range" min="0.1" max="0.8" step="0.01" value={thr.blurMin} onChange={e=>setThr({...thr, blurMin: Number(e.target.value)})} />
        <label>Glare max (%): {thr.glarePctMax}</label>
        <input type="range" min="0" max="10" step="0.1" value={thr.glarePctMax} onChange={e=>setThr({...thr, glarePctMax: Number(e.target.value)})} />
        <label>Coverage min (%): {thr.coveragePctMin}</label>
        <input type="range" min="10" max="60" step="1" value={thr.coveragePctMin} onChange={e=>setThr({...thr, coveragePctMin: Number(e.target.value)})} />
        <label>Center offset max (%): {thr.centerOffsetPctMax}</label>
        <input type="range" min="5" max="20" step="1" value={thr.centerOffsetPctMax} onChange={e=>setThr({...thr, centerOffsetPctMax: Number(e.target.value)})} />
      </div>
      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button onClick={apply}>Apply to worker</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div style={{marginTop:8}}>
        <ProfilerChart series={series} />
      </div>
    </div>
  )
}
