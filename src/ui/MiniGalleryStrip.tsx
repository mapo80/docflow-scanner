import React from 'react'

export function MiniGalleryStrip({
  items,
  onOpen,
  onDelete
}: {
  items: string[]
  onOpen: (index: number) => void
  onDelete: (index: number) => void
}) {
  const last = items.slice(-4) // show up to 4
  const baseIndex = items.length - last.length
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 100,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 16,
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(180deg, rgba(15,23,42,0.55), rgba(2,6,23,0.55))',
        boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
        border: '1px solid rgba(255,255,255,0.08)',
        alignItems: 'center',
        zIndex: 4
      }}
    >
      {last.length === 0 ? (
        <span style={{ color: '#cbd5e1', fontSize: 12, padding: '6px 10px' }}>Nessuno scatto</span>
      ) : (
        last.map((src, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <button
              aria-label={`Apri anteprima scatto ${baseIndex + i + 1}`}
              onClick={() => onOpen(baseIndex + i)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)',
                padding: 0,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
                background: 'transparent'
              }}
            >
              <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
            <button
              aria-label="Elimina scatto"
              onClick={() => onDelete(baseIndex + i)}
              title="Elimina"
              style={{
                position: 'absolute',
                top: -8,
                right: -8,
                width: 22,
                height: 22,
                borderRadius: 11,
                background: '#ef4444',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  )
}
