import { describe, it, expect } from 'vitest'
import { TelemetryExporter } from '../../src/utils/TelemetryExporter'

describe('TelemetryExporter', () => {
  it('emits CSV with headers and rows', () => {
    const t = new TelemetryExporter()
    t.start()
    t.push({ ts: 0, decision:'READY_TO_CAPTURE', docType:'A4', perf:{ detect: 10 }, quality:{ blurScore: 0.5 } })
    t.stop()
    const csv = t.toCSV()
    expect(csv).toContain('ts,decision,docType')
    expect(csv).toContain('READY_TO_CAPTURE')
  })
})
