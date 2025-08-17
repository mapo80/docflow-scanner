import type { Point, Quad } from '../utils/geometry'

export type PreviewAnalysis = {
  polygon: Quad | null
  quality: {
    blurScore: number
    glarePct: number
    coveragePct: number
    centerOffsetPct: number
    aspectRatio: number
    perspectiveTiltDeg: number
    stabilityScore: number
  }
  decision: 'WAITING' | 'HOLD_STEADY' | 'READY_TO_CAPTURE' | 'BAD_LIGHT' | 'TOO_BLURRY' | 'MOVE_CLOSER'
  perf: Record<string, number>
  docType?: { label: string, confidence?: number }
}

export type FinalDocument = {
  image: ArrayBuffer
  postproc: { clahe: boolean, denoise: boolean, adaptiveThreshold: boolean }
  meta: { width: number, height: number, pipelineTimings: Record<string, number> }
}

export type InitMsg = { type: 'init', engineLocation: string, useThreads: boolean, useSIMD: boolean, policies: { thresholds: any, adaptive: any, features: any } }
export type UpdatePoliciesMsg = { type: 'updatePolicies', policies: { thresholds: any, adaptive: any, features: any } }
export type PreviewMsg = { type: 'preview', bitmap: ImageBitmap }
export type WarpMsg = { type: 'warp', blob: Blob, polygon: Quad, postProcess?: boolean }
export type DisposeMsg = { type: 'dispose' }

export type WorkerIn = InitMsg | UpdatePoliciesMsg | PreviewMsg | WarpMsg | DisposeMsg
export type WorkerOut = { type: 'analysis', data: PreviewAnalysis } | { type: 'final', data: FinalDocument } | { type: 'log', data: string }
