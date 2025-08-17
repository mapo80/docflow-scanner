import adaptive from '../config/adaptive-policy.json'
import thresholds from '../config/quality-thresholds.json'
import type { PreviewAnalysis } from './types'

type DocTypeLabel = 'A4' | 'ID1' | 'Receipt' | 'Unknown'
type Decision = 'WAITING' | 'HOLD_STEADY' | 'READY_TO_CAPTURE' | 'BAD_LIGHT' | 'TOO_BLURRY' | 'MOVE_CLOSER'

export function decide(quality: PreviewAnalysis['quality'], docType: { label: DocTypeLabel }): Decision {
  const base = adaptive.defaults
  const ov = (adaptive.overrides as any)[docType.label] || {}
  const blurMin = thresholds.blurMin ?? base.blurMin
  const glareMax = thresholds.glarePctMax ?? base.glarePctMax
  const coverageMin = ov.coveragePctMin ?? thresholds.coveragePctMin ?? base.coveragePctMin
  const centerMax = ov.centerOffsetPctMax ?? thresholds.centerOffsetPctMax ?? base.centerOffsetPctMax

  if (quality.blurScore < blurMin) return 'TOO_BLURRY'
  if (quality.coveragePct < coverageMin) return 'MOVE_CLOSER'
  if (quality.centerOffsetPct > centerMax) return 'MOVE_CLOSER'
  if (quality.glarePct > glareMax) return 'BAD_LIGHT'
  return 'READY_TO_CAPTURE'
}
