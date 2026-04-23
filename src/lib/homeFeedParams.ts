import { locationToQuery } from '@/lib/locationPrefs'
import type { LocationPref } from '@/lib/locationTypes'

/** 与 HomeLatestPosts 中 fetch /api/posts 的查询一致 */
export function buildHomeLatestQuery(
  pref: LocationPref | null,
  opts: { random: boolean; excludeIds: string[] },
) {
  const params = new URLSearchParams({ page: '1', limit: '10' })
  Object.entries(locationToQuery(pref)).forEach(([k, v]) => params.set(k, v))
  if (opts.random && opts.excludeIds.length) {
    params.set('random', '1')
    params.set('exclude', opts.excludeIds.join(','))
  }
  return params
}

/** 与 HomeRecommendations 中 fetch /api/posts/recommendations 的查询一致 */
export function buildHomeRecQuery(pref: LocationPref | null) {
  const p = new URLSearchParams()
  Object.entries(locationToQuery(pref)).forEach(([k, v]) => p.set(k, v))
  p.set('limit', '18')
  return p
}
