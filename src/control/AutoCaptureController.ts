import type { PreviewAnalysis } from '../worker/types'
import type { Quad } from '../utils/geometry'
import { ConfigService } from '../utils/ConfigService'

export type CaptureState = 'Idle' | 'Previewing' | 'HoldingSteady' | 'AutoCapturing' | 'Processing' | 'Done'

export class AutoCaptureController {
  private config: ConfigService
  private consecutive = 0
  onDecision?: (d: { state: CaptureState, shouldCapture: boolean, polygon: Quad }) => void

  constructor(config: ConfigService) {
    this.config = config
  }

  ingestAnalysis(a: PreviewAnalysis) {
    if (!a) return
    const flags = this.config.getFeatureFlags()
    const thr = this.config.getQualityThresholds()
    let state: CaptureState = 'Previewing'
    let shouldCapture = false as boolean
    if (a.decision === 'READY_TO_CAPTURE' && a.polygon) {
      this.consecutive++
      state = this.consecutive >= thr.stabilityFrames ? 'AutoCapturing' : 'HoldingSteady'
      if (flags.enableAutoCapture && this.consecutive >= thr.stabilityFrames) {
        shouldCapture = true
        this.consecutive = 0
      }
    } else {
      state = 'Previewing'
      this.consecutive = 0
    }
    this.onDecision?.({ state, shouldCapture, polygon: (a.polygon as any) })
  }
}
