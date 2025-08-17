import React, { useEffect, useMemo, useRef, useState } from 'react'
import './animations.css'
import { startCamera, stopCamera, applyTrackConstraints } from '../camera/CameraManager'
import { CvWorkerClient } from '../worker/CvWorkerClient'
import { AutoCaptureController, type CaptureState } from '../control/AutoCaptureController'
import { OverlayCanvas } from './OverlayCanvas'
import { PerfHUD } from './PerfHUD'
import { DevPanel } from './DevPanel'
import { MiniGalleryStrip } from './MiniGalleryStrip'
import { SettingsModal } from './SettingsModal'
import { RuntimeConfig } from '../utils/RuntimeConfig'
import { PhotoService } from '../camera/PhotoService'
import { ConfigService } from '../utils/ConfigService'
import { MetricsLogger } from '../utils/MetricsLogger'
import { buildEffectivePolicies } from '../utils/ProfileService'
import type { PreviewAnalysis } from '../worker/types'

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [analysis, setAnalysis] = useState<PreviewAnalysis | null>(null)
  const [state, setState] = useState<CaptureState>('Idle')
  const [finalUrl, setFinalUrl] = useState<string | null>(null)
  const [captures, setCaptures] = useState<string[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [flags, setFlags] = useState(RuntimeConfig.load())
  const [policies, setPolicies] = useState(buildEffectivePolicies())

  const config = useMemo(() => new ConfigService(), [])
  const worker = useMemo(() => new CvWorkerClient(), [])
  const controller = useMemo(() => new AutoCaptureController(config), [config])
  const logger = useMemo(() => new MetricsLogger(), [])

  const doManualCapture = async () => {
    if (!streamRef.current || !analysis?.polygon) return
    const photo = await PhotoService.takePhoto(streamRef.current).catch(() => null)
    if (photo) {
      const result = await worker.warpAndProcess(photo, analysis.polygon)
      const url = URL.createObjectURL(new Blob([result.image], { type: 'image/jpeg' }))
      setFinalUrl(url)
      setCaptures(c => [...c, url])
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !flags.enableAutoCapture) {
        e.preventDefault()
        doManualCapture()
      }
    }
    window.addEventListener('keydown', onKey)

    ;(async () => {
      const policies0 = buildEffectivePolicies()
      await worker.init({
        engineLocation: '/opencv/',
        useThreads: flags.useThreads,
        useSIMD: flags.useSIMD,
        policies: { thresholds: policies0.thresholds, adaptive: policies0.adaptive, features: flags }
      })
      setPolicies(policies0)
      const stream = await startCamera(videoRef.current!)
      streamRef.current = stream
      await applyTrackConstraints(stream, { focusMode: 'continuous' })
      controller.onDecision = async d => {
        setState(d.state)
        if (d.shouldCapture) await doManualCapture()
      }
      const draw = async () => {
        const video = videoRef.current!
        const canvas = canvasRef.current!
        const ctx = canvas.getContext('2d')!
        if (video.readyState >= 2) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          const bmp = await createImageBitmap(canvas)
          const a = await worker.processPreviewFrame(bmp)
          setAnalysis(a)
          logger.push({ fps: undefined, perf: a.perf, decision: a.decision, docType: a.docType?.label })
          controller.ingestAnalysis(a)
          const el = document.getElementById('metricsJson')
          if (el) el.textContent = JSON.stringify(a)
        }
        ;(video as any).requestVideoFrameCallback
          ? (video as any).requestVideoFrameCallback(() => requestAnimationFrame(draw))
          : requestAnimationFrame(draw)
      }
      requestAnimationFrame(draw)
    })()

    return () => {
      window.removeEventListener('keydown', onKey)
      const stream = streamRef.current
      if (stream) stopCamera(stream)
      worker.dispose()
    }
  }, [flags, controller, worker])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '100vh', gap: 12, padding: 12 }}>
      <div style={{ position: 'relative', background: '#111', borderRadius: 8, overflow: 'hidden' }}>
        <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        <button aria-label='Impostazioni' title='Impostazioni' onClick={() => setSettingsOpen(true)}
          style={{ position: 'absolute', top: 8, left: 8, width: 36, height: 36, borderRadius: 18, background: '#0b1020cc', color: '#fff', border: '1px solid #334155' }}>⚙️</button>
        <button id='shutter' aria-label='Scatta' title='Scatta (Space)' onClick={doManualCapture}
          style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', width: 72, height: 72, borderRadius: 36, border: '3px solid #e5e7eb', background: flags.enableAutoCapture ? '#0b102088' : '#22c55e', color: '#000', boxShadow: '0 4px 20px #0007' }}>⭕</button>
        {flags.enablePerfHUD ? <PerfHUD analysis={analysis} /> : null}
        <MiniGalleryStrip items={captures} onOpen={() => {}} onDelete={(i) => setCaptures(c => c.filter((_, idx) => idx !== i))} />
        <OverlayCanvas canvasRef={canvasRef} analysis={analysis} flags={flags} />
        {flags.showDocLabel && analysis?.docType?.label ? (
          <div id='docTypeLabel' style={{ position: 'absolute', top: 8, right: 8, padding: '4px 8px', background: '#0008', color: 'white', borderRadius: 6 }}>
            {analysis.docType.label}
          </div>
        ) : null}
        <div style={{ position: 'absolute', bottom: 8, left: 8, padding: '4px 8px', background: '#0008', color: 'white', borderRadius: 6 }}>
          State: <b>{state}</b>
          <div id='metricsJson' style={{ display: 'none' }}>{analysis ? JSON.stringify(analysis) : ''}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2>Result</h2>
        {finalUrl ? <img id='finalImage' src={finalUrl} style={{ maxWidth: '100%', borderRadius: 8 }} /> : <p>No capture yet.</p>}
        <h3>Gallery</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
          {captures.map((u, i) => <img key={i} src={u} style={{ width: '100%', borderRadius: 6 }} />)}
        </div>
        <h3>Profile</h3>
        <div id='profileId'>{policies.profileId}</div>
        <h3>Metrics</h3>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#f6f8fa', padding: 12, borderRadius: 8 }}>
          {analysis ? JSON.stringify(analysis.quality, null, 2) : 'n/a'}
        </pre>
      </div>
      <DevPanel worker={worker} analysis={analysis} />
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onApply={setFlags} />
    </div>
  )
}

