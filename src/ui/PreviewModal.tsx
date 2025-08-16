import React from 'react'

export function PreviewModal({ open, imageUrl, onUse, onRetake, onAnother }:
  { open: boolean, imageUrl: string | null, onUse: ()=>void, onRetake: ()=>void, onAnother: ()=>void }) {
  if (!open) return null
  return (
    <div className='modal-appear' style={{ position:'fixed', inset:0, background:'#0009', display:'grid', placeItems:'center', zIndex:50 }} onClick={onRetake}>
      <div role="dialog" aria-modal="true" className='modal-card' style={{ width:'min(90vw, 900px)', background:'#0b1020', color:'#fff', borderRadius:12, padding:16 }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
          <b>Anteprima documento</b>
          <button onClick={onRetake} aria-label="Chiudi">✕</button>
        </div>
        <div style={{ maxHeight:'70vh', overflow:'auto', display:'grid', placeItems:'center', background:'#0b1020' }}>
          {imageUrl ? <img src={imageUrl} alt="Anteprima" style={{ maxWidth:'100%', maxHeight:'70vh', borderRadius:8 }} /> : <p>Nessuna immagine</p>}
        </div>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
          <button onClick={onRetake}>Ripeti</button>
          <button onClick={onAnother}>Scatta un altro</button>
          <button onClick={onUse} style={{ background:'#22c55e', border:'none', color:'#06240f', padding:'6px 12px', borderRadius:8 }}>Usa questa</button>
        </div>
      </div>
    </div>
  )
}
