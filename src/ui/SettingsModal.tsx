import React, { useEffect, useState } from 'react'
import type { FeatureFlags } from '../utils/RuntimeConfig'
import { RuntimeConfig } from '../utils/RuntimeConfig'

export function SettingsModal({ open, onClose, onApply }: { open: boolean, onClose: () => void, onApply: (flags: FeatureFlags) => void }) {
  const [flags, setFlags] = useState<FeatureFlags>(RuntimeConfig.load())

  useEffect(() => {
    if (open) setFlags(RuntimeConfig.load())
  }, [open])

  const Row = ({ id, label }: { id: keyof FeatureFlags, label: string }) => (
    <label style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0' }}>
      <input type="checkbox" checked={!!(flags as any)[id]} onChange={e => setFlags({ ...flags, [id]: e.target.checked } as any)} />
      <span>{label}</span>
    </label>
  )

  const apply = () => {
    RuntimeConfig.save(flags)
    onApply(flags)
    onClose()
  }

  if (!open) return null
  return (
    <div style={{ position:'absolute', inset:0, background:'#0007', display:'grid', placeItems:'center' }} onClick={onClose}>
      <div role="dialog" aria-modal="true" style={{ width:360, background:'#0b1020', color:'#fff', borderRadius:12, padding:16 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <b>Impostazioni</b>
          <button onClick={onClose} aria-label="Chiudi">✕</button>
        </div>
        <div style={{ display:'grid', gap:4 }}>
          <Row id="showOverlay" label="Mostra overlay (bounding box)" />
          <Row id="showDocLabel" label="Mostra etichetta documento" />
          <Row id="enableAutoCapture" label="Autoscatto" />
          <Row id="enablePostProcessing" label="Post-processing (CLAHE + threshold)" />
          <Row id="enablePerfHUD" label="HUD prestazioni" />
          <Row id="adaptivePolicy" label="Policy adattiva per tipo documento" />
          <Row id="useThreads" label="WASM Threads (richiede COOP/COEP)" />
          <Row id="useSIMD" label="WASM SIMD" />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <button onClick={onClose}>Annulla</button>
          <button onClick={apply} style={{ background:'#22c55e', color:'#06240f', border:'none', padding:'6px 12px', borderRadius:8 }}>Applica</button>
        </div>
      </div>
    </div>
  )
}
