import docTypes from '../config/doc-types.json'

export type DocTypeLabel = 'A4' | 'ID1' | 'Receipt' | 'Unknown'

export function classifyDocument(aspect: number, coveragePct: number): { label: DocTypeLabel, confidence: number } {
  // Normalize aspect to be >= 1 by flipping if needed
  const r = aspect >= 1 ? aspect : (1 / (aspect || 1))
  let best: { label: DocTypeLabel, confidence: number } = { label: 'Unknown', confidence: 0 }
  for (const t of (docTypes as any).types) {
    if (t.name === 'Receipt') {
      if (r >= (t.minLongShortRatio ?? 2.0) && coveragePct >= (t.minCoveragePct ?? 10)) {
        const conf = Math.min(1, (r - (t.minLongShortRatio ?? 2.0)) / 2 + (coveragePct - (t.minCoveragePct ?? 10)) / 100)
        if (conf > best.confidence) best = { label: 'Receipt', confidence: conf }
      }
    } else {
      const target = t.targetAspect
      const tol = (t.aspectTolerancePct ?? 10) / 100
      const within = Math.abs(r - target) <= target * tol
      if (within && coveragePct >= (t.minCoveragePct ?? 0)) {
        const diff = Math.abs(r - target)
        const conf = Math.max(0.2, 1 - diff / (target * tol)) * Math.min(1, coveragePct / Math.max(1, (t.minCoveragePct ?? 1)))
        if (conf > best.confidence) best = { label: t.name as DocTypeLabel, confidence: conf }
      }
    }
  }
  return best
}
