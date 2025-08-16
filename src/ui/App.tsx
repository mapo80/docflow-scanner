import React, { useEffect, useMemo, useRef, useState } from 'react'
import './animations.css'
import { startCamera, stopCamera, applyTrackConstraints } from '../camera/CameraManager'
import { CvWorkerClient } from '../worker/CvWorkerClient'
import { AutoCaptureController, CaptureState } from '../control/AutoCaptureController'
import { OverlayCanvas } from './OverlayCanvas'
import { PerfHUD } from './PerfHUD'
import { DevPanel } from './DevPanel'
import { MiniGalleryStrip } from './MiniGalleryStrip'
import { SettingsModal } from './SettingsModal'
import { PreviewModal } from './PreviewModal'
import { RuntimeConfig, type FeatureFlags } from '../utils/RuntimeConfig'
import { PhotoService } from '../camera/PhotoService'
import { ConfigService } from '../utils/ConfigService'
import { MetricsLogger } from '../utils/MetricsLogger'
import { runBenchmark } from '../bench/benchmark'
import { buildEffectivePolicies } from '../utils/ProfileService'
import type { PreviewAnalysis } from '../worker/types'

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [analysis, setAnalysis] = useState<PreviewAnalysis | null>(null)
  const [state, setState] = useState<CaptureState>('Idle')
  const [finalUrl, setFinalUrl] = useState<string | null>(null)
    const [captures, setCaptures] = useState<string[]>([])
    const [previewOpen, setPreviewOpen] = useState(false)
    const [previewExistingIdx, setPreviewExistingIdx] = useState<number | null>(null)
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [flags, setFlags] = useState(RuntimeConfig.load())
    const [policies, setPolicies] = useState(buildEffectivePolicies())

  const config = useMemo(() => new ConfigService(), [])
  const worker = useMemo(() => new CvWorkerClient(), [])
  const controller = useMemo(() => new AutoCaptureController(config), [config])
    const logger = useMemo(() => new MetricsLogger(), [])

  useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' && !flags.enableAutoCapture) { e.preventDefault(); doManualCapture() } }
      window.addEventListener('keydown', onKey)
      useEffect(() => {
      const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' && !flags.enableAutoCapture) { e.preventDefault(); doManualCapture() } }
      window.addEventListener('keydown', onKey)
            const url = new URL(window.location.href)
            if (url.searchParams.get('benchmark') === '1') {
              const start = performance.now()
              const handler = (e:any) => { console.log('[benchmark:done]', e.detail) }
              window.addEventListener('benchmark:done', handler)
              runBenchmark(start, 10000, () => (window as any).__analysis)
              return () => window.removeEventListener('benchmark:done', handler)
            }
          }, [])

    (async () => {
      const policies0 = buildEffectivePolicies()
        await worker.init({ engineLocation: '/opencv/', useThreads: flags.useThreads, useSIMD: flags.useSIMD, policies: { ...policies0, features: flags } })
        setPolicies(policies0)
      const stream = await startCamera(videoRef.current!)
        streamRef.current = stream
      await applyTrackConstraints(stream, { focusMode: 'continuous' })
      controller.onDecision = async (decision) => {
        setState(decision.state)
        if (decision.shouldCapture && videoRef.current) {
          const photo = await PhotoService.takePhoto(stream).catch(() => null)
          if (photo) {
            const result = await worker.warpAndProcess(photo, decision.polygon)
            const url = URL.createObjectURL(new Blob([result.image], { type: 'image/jpeg' }))
            setFinalUrl(url)
          }
        }
      }
      const video = videoRef.current!
      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      const draw = async () => { (window as any).__analysis = analysis
        if (video.readyState >= 2) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const bitmap = await createImageBitmap(canvas)
          const a = await worker.processPreviewFrame(bitmap)
          setAnalysis(a)
            logger.push({ fps: undefined, perf: a.perf, decision: a.decision, docType: a.docType })
          controller.ingestAnalysis(a)
        }
        // sync to video frames if available
        ;(video as any).requestVideoFrameCallback ?
          (video as any).requestVideoFrameCallback(() => requestAnimationFrame(draw)) :
          requestAnimationFrame(draw)
      }
      requestAnimationFrame(draw)

      return () => { window.removeEventListener('keydown', onKey);
        stopCamera(stream)
        worker.dispose()
      }
    })()
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', gap: 12, padding: 12 }}>
      <div style={{ position: 'relative', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          <button aria-label='Impostazioni' title='Impostazioni' onClick={()=>setSettingsOpen(true)} style={{ position:'absolute', top:8, left:8, width:36, height:36, borderRadius:18, background:'#0b1020cc', color:'#fff', border:'1px solid #334155' }}>⚙️</button>
          <button id='shutter' aria-label='Scatta' title='Scatta (Space)' onClick={doManualCapture}
            style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', width:72, height:72, borderRadius:36, border:'3px solid #e5e7eb', background: flags.enableAutoCapture ? '#0b102088' : '#22c55e', color:'#000', boxShadow:'0 4px 20px #0007' }}>
            ⭕
          </button>
          {featureFlags.enablePerfHUD ? <PerfHUD analysis={analysis} /> : null}
          <MiniGalleryStrip items={captures} onOpen={(i)=>{ setPreviewExistingIdx(i); setFinalUrl(captures[i]); setPreviewOpen(true) }} onDelete={(i)=>{ setCaptures(c=>c.filter((_,idx)=>idx!==i)) }} />
        <OverlayCanvas canvasRef={canvasRef} analysis={analysis} flags={flags} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '4px 8px', background: '#0008', color: 'white', borderRadius: 6 }}>
          State: <b>{state}</b>
        <div id="metricsJson" style={{display:'none'}}>{analysis ? JSON.stringify(analysis) : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Result</h2>
        {finalUrl ? <img id="finalImage" src={finalUrl} style={{ maxWidth: '100%', borderRadius: 8 }} /> : <p>No capture yet.</p>}
          <h3>Gallery</h3>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(120px, 1fr))', gap:8 }}>
            {captures.map((u, i)=> <img key={i} src={u} style={{ width:'100%', borderRadius:6 }} />)}
          </div>
        <h3>Profile</h3>
          <div id="profileId">{policies.profileId}</div>
          <h3>DocType</h3>
          <div id="docTypeLabel">{analysis ? `${analysis.docType.label} (${Math.round((analysis.docType.confidence||0)*100)}%)` : 'n/a'}</div>
          <h3>Metrics</h3>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
          {analysis ? JSON.stringify(analysis.quality, null, 2) : 'n/a'}
        </pre>
      </div>
    </div>
  )
}
