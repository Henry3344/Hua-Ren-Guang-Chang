import type { LocationPref } from '@/lib/locationTypes'

export const LOCATION_STORAGE_KEY = 'hq-site-loc-v1'

export function readLocationPref(): LocationPref | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as LocationPref
    if (!p || typeof p !== 'object' || !('scope' in p)) return null
    return p
  } catch {
    return null
  }
}

export function writeLocationPref(pref: LocationPref): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(pref))
}

export function locationToQuery(pref: LocationPref | null): Record<string, string> {
  if (!pref || pref.scope === 'nationwide') {
    return { locScope: 'nationwide' }
  }
  if (pref.scope === 'state' && pref.stateZh) {
    return { locScope: 'state', locState: pref.stateZh }
  }
  if (pref.scope === 'metro' && pref.stateZh) {
    const q: Record<string, string> = {
      locScope: 'metro',
      locState: pref.stateZh,
    }
    if (pref.cityZh) q.locCity = pref.cityZh
    if (pref.areaZh) q.locArea = pref.areaZh
    return q
  }
  return { locScope: 'nationwide' }
}
