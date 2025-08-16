  export type TelemetrySample = {
    ts: number
    decision?: string
    docType?: string
    perf?: Record<string, number>
    quality?: Record<string, number>
  }

  export class TelemetryExporter {
    private samples: TelemetrySample[] = []
    private recording = false

    start() { this.recording = true }
    stop() { this.recording = false }
    isRecording() { return this.recording }

    push(sample: TelemetrySample) {
      if (this.recording) this.samples.push(sample)
    }

    clear() { this.samples = [] }

    toJSONBlob(): Blob {
      return new Blob([JSON.stringify(this.samples, null, 2)], { type: 'application/json' })
    }

    toCSV(): string {
      const headers = new Set<string>(['ts','decision','docType'])
      for (const s of this.samples) {
        Object.keys(s.perf||{}).forEach(k=>headers.add('perf.'+k))
        Object.keys(s.quality||{}).forEach(k=>headers.add('quality.'+k))
      }
      const cols = Array.from(headers)
      const rows = [cols.join(',')]
      for (const s of this.samples) {
        const row = cols.map(c => {
          if (c==='ts') return new Date(s.ts).toISOString()
          if (c==='decision') return s.decision ?? ''
          if (c==='docType') return s.docType ?? ''
          if (c.startsWith('perf.')) return String(s.perf?.[c.slice(5)] ?? '')
          if (c.startsWith('quality.')) return String(s.quality?.[c.slice(8)] ?? '')
          return ''
        })
        rows.push(row.map(v => /[",
]/.test(v) ? `"${String(v).replace(/"/g,'""')}"` : v).join(','))
      }
      return rows.join('\n')
    }

    downloadJSON(filename='telemetry.json') {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(this.toJSONBlob())
      a.download = filename
      a.click()
    }

    downloadCSV(filename='telemetry.csv') {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(new Blob([this.toCSV()], { type: 'text/csv' }))
      a.download = filename
      a.click()
    }
  }
