import { describe, it, expect } from 'vitest'
import { classifyDocument } from '../../src/worker/docType'

describe('classifyDocument', () => {
  it('detects A4 near 1.414', () => {
    const r = classifyDocument(1.40, 40)
    expect(r.label).toBe('A4')
  })
  it('detects ID1 near 1.586', () => {
    const r = classifyDocument(1.60, 35)
    expect(r.label).toBe('ID1')
  })
  it('detects Receipt when very elongated', () => {
    const r = classifyDocument(3.0, 25)
    expect(r.label).toBe('Receipt')
  })
  it('returns Unknown for ambiguous', () => {
    const r = classifyDocument(1.1, 10)
    expect(r.label).toBe('Unknown')
  })
})
