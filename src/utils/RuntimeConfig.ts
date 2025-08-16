export type FeatureFlags = {
  showOverlay: boolean
  showDocLabel: boolean
  enableAutoCapture: boolean
  enablePostProcessing: boolean
  enablePerfHUD: boolean
  adaptivePolicy: boolean
  useThreads: boolean
  useSIMD: boolean
}

const KEY = 'scanner-runtime-flags'

const defaults: FeatureFlags = {
  showOverlay: true,
  showDocLabel: true,
  enableAutoCapture: true,
  enablePostProcessing: false,
  enablePerfHUD: false,
  adaptivePolicy: true,
  useThreads: true,
  useSIMD: true
}

export class RuntimeConfig {
  static load(): FeatureFlags {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return { ...defaults }
      const parsed = JSON.parse(raw)
      return { ...defaults, ...parsed }
    } catch { return { ...defaults } }
  }
  static save(flags: FeatureFlags) {
    try { localStorage.setItem(KEY, JSON.stringify(flags)) } catch {}
  }
  static reset() {
    try { localStorage.removeItem(KEY) } catch {}
  }
}
