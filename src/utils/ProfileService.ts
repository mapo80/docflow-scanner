import baseThresholds from '../config/quality-thresholds.json'
import deviceProfiles from '../config/device-profiles.json'
import adaptive from '../config/adaptive-policy.json'

export type EffectivePolicies = {
  thresholds: typeof baseThresholds
  adaptive: typeof adaptive
  profileId: string
}

function pickProfile(searchParam?: string): { id: string, overrides: any } {
  const urlProfile = searchParam || new URL(self.location.href).searchParams.get('profile') || undefined
  if (urlProfile) {
    const p = (deviceProfiles as any).profiles.find((x:any)=>x.id===urlProfile)
    if (p) return { id: p.id, overrides: p.thresholdOverrides || {} }
  }
  const ua = navigator.userAgent || ''
  const dm = (navigator as any).deviceMemory ? Number((navigator as any).deviceMemory) : undefined
  for (const p of (deviceProfiles as any).profiles) {
    const inc: string[] = p.match?.uaIncludes || []
    const okUA = inc.length ? inc.some(s => ua.includes(s)) : true
    const okMem = p.match?.maxDeviceMemoryGB ? (dm ? dm <= p.match.maxDeviceMemoryGB : true) : true
    if (okUA && okMem) return { id: p.id, overrides: p.thresholdOverrides || {} }
  }
  return { id: (deviceProfiles as any).defaultProfileId, overrides: {} }
}

export function buildEffectivePolicies(searchParam?: string): EffectivePolicies {
  const prof = pickProfile(searchParam)
  const thr = { ...baseThresholds, ...prof.overrides }
  return { thresholds: thr as any, adaptive: adaptive as any, profileId: prof.id }
}
