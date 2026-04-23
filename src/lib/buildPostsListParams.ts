import type { LocationPref } from '@/lib/locationTypes'
import { locationToQuery } from '@/lib/locationPrefs'

/** 分类列表每页帖子数（与客户端列表一致） */
export const LIST_PAGE_LIMIT = 12

/**
 * 与 PostsPageClient 中 fetch /api/posts 使用的查询串一致。
 * `pref === null` 时等同「仅 nationwide」地区（服务端首屏）。
 */
export function buildPostsListParams(
  searchParams: URLSearchParams,
  pref: LocationPref | null,
): URLSearchParams {
  const category = searchParams.get('category') || ''
  const qParam = searchParams.get('q') || ''
  const sub = searchParams.get('sub') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const tr = searchParams.get('tr') || 'all'
  const dir = searchParams.get('dir') || 'desc'
  const pb = searchParams.get('pb') || ''
  const rt = searchParams.get('rt') || ''
  const jwt = searchParams.get('jwt') || ''
  const jtt = searchParams.get('jtt') || ''
  const jl = searchParams.get('jl') || ''
  const ic = searchParams.get('ic') || ''

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (qParam) params.set('q', qParam)
  if (sub) params.set('sub', sub)
  params.set('page', String(page))
  params.set('limit', String(LIST_PAGE_LIMIT))
  params.set('tr', tr)
  params.set('dir', dir)
  if ((category === 'RENT' || category === 'RENT_SEEK') && pb !== '') params.set('pb', pb)
  if ((category === 'RENT' || category === 'RENT_SEEK') && rt !== '') params.set('rt', rt)
  if ((category === 'JOB' || category === 'JOB_SEEK') && jwt !== '') params.set('jwt', jwt)
  if ((category === 'JOB' || category === 'JOB_SEEK') && jtt !== '') params.set('jtt', jtt)
  if ((category === 'JOB' || category === 'JOB_SEEK') && jl !== '') params.set('jl', jl)
  if (category === 'SECONDHAND' && ic !== '') params.set('ic', ic)
  Object.entries(locationToQuery(pref)).forEach(([k, v]) => params.set(k, v))
  return params
}

export function stablePostsQueryKey(params: URLSearchParams): string {
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}
