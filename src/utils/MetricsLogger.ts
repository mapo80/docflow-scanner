export class MetricsLogger {
  private buf: any[] = []
  private readonly key = 'scanner-metrics'
  private lastLog = performance.now()

  push(sample: any) {
    this.buf.push(sample)
    if (this.buf.length > 200) this.buf.shift()
    const now = performance.now()
    if (now - this.lastLog > 2000) {
      // log summary
      const last = this.buf.at(-1) || {}
      console.table([{
        ts: new Date().toISOString(),
        fps: (last.fps ?? 0).toFixed?.(1),
        toMat: (last.perf?.toMat ?? 0).toFixed?.(2),
        detect: (last.perf?.detect ?? 0).toFixed?.(2),
        score: (last.perf?.score ?? 0).toFixed?.(2),
        decision: last.decision,
        docType: last.docType?.label
      }])
      // persist
      try { localStorage.setItem(this.key, JSON.stringify(this.buf.slice(-50))) } catch {}
      this.lastLog = now
    }
  }
}
