import type { Category } from '@prisma/client'
import type { GetPostsListOptions } from '@/lib/getPostsList'
import { inferSecondhandSub } from '@/lib/aiSearchCategory'
import { filterPostsByStrongKeywords } from '@/lib/aiKeywordPolicy'
import { extractAiQueryKeywords } from '@/lib/aiQueryKeywords'
import { getPostsList } from '@/lib/getPostsList'

/** 与 getPostsList 上限对齐，多取候选再排序截断，减少「仅子类含手机」的帖进不了池 */
const AI_RAG_FETCH_LIMIT = 100
export const AI_RAG_RETURN_LIMIT = 24

/** 二手数码泛搜时交错苹果/三星/Android 等，避免置顶+同品牌占满前排 */
function interleaveByPhoneBrandHint<
  T extends {
    id: string
    title: string
  },
>(posts: T[], limit: number): T[] {
  if (posts.length < 4) return posts.slice(0, limit)
  function bucket(title: string): string {
    const t = title.toLowerCase()
    if (/iphone|苹果|ipad|macbook/.test(t)) return 'apple'
    if (
      /三星|samsung|galaxy/.test(t) ||
      /s2[0-5]\s*(plus|\+|ultra)?|s2[0-5]，/.test(t)
    ) {
      return 'samsung'
    }
    if (/pixel|谷歌|google\s*pixel/.test(t)) return 'pixel'
    if (/小米|华为|oppo|vivo|一加|honor|红米|魅族/.test(t)) return 'cn_oem'
    return 'other'
  }
  const groups = new Map<string, T[]>()
  for (const p of posts) {
    const b = bucket(p.title)
    if (!groups.has(b)) groups.set(b, [])
    groups.get(b)!.push(p)
  }
  if (groups.size < 2) return posts.slice(0, limit)
  const order = ['apple', 'samsung', 'pixel', 'cn_oem', 'other']
  const out: T[] = []
  const seen = new Set<string>()
  let rounds = 0
  while (out.length < limit && rounds < limit) {
    rounds++
    let any = false
    for (const b of order) {
      const g = groups.get(b)
      if (!g?.length) continue
      const next = g.shift()!
      if (seen.has(next.id)) continue
      seen.add(next.id)
      out.push(next)
      any = true
      if (out.length >= limit) break
    }
    if (!any) break
  }
  for (const p of posts) {
    if (out.length >= limit) break
    if (!seen.has(p.id)) out.push(p)
  }
  return out
}

/** 按发帖子类轮转，避免泛搜时同一子类（如全是手机数码）占满列表 */
function interleaveByDistinctSubcategory<
  T extends {
    id: string
    subCategory: string | null
  },
>(posts: T[], limit: number): T[] {
  if (posts.length < 5) return posts.slice(0, limit)
  const groups = new Map<string, T[]>()
  for (const p of posts) {
    const k = (p.subCategory ?? '').trim() || '_other'
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(p)
  }
  if (groups.size < 2) return posts.slice(0, limit)
  const keys = [...groups.keys()].sort((a, b) => a.localeCompare(b))
  const out: T[] = []
  const seen = new Set<string>()
  let rounds = 0
  while (out.length < limit && rounds < limit) {
    rounds++
    let any = false
    for (const k of keys) {
      const g = groups.get(k)
      if (!g?.length) continue
      const next = g.shift()!
      if (seen.has(next.id)) continue
      seen.add(next.id)
      out.push(next)
      any = true
      if (out.length >= limit) break
    }
    if (!any) break
  }
  for (const p of posts) {
    if (out.length >= limit) break
    if (!seen.has(p.id)) out.push(p)
  }
  return out
}

/** 用户已写明细房型/薪资时不再打散排序，避免冲掉强意图 */
function shouldInterleaveSubcategoryMix(userQuery: string): boolean {
  const q = userQuery.trim()
  if (/\d+室\d*厅|两室一厅|一房一厅|主卧|次卧独卫|月租\s*\$?\d{3,}/.test(q)) return false
  if (/月薪|年薪|时薪\s*\$?\d|待遇\s*\d|周薪/.test(q)) return false
  if (q.length > 52) return false
  return true
}

function sortPostsByAiKeywordScore<
  T extends {
    title: string
    description: string
    location: string
    contact: string
    subCategory: string | null
    isPinned: boolean
    createdAt: Date
  },
>(posts: T[], keywords: string[]): T[] {
  const lower = keywords.map((k) => k.toLowerCase())
  function score(p: T): number {
    const title = p.title.toLowerCase()
    const desc = p.description.toLowerCase()
    const loc = p.location.toLowerCase()
    const contact = p.contact.toLowerCase()
    const sub = (p.subCategory ?? '').toLowerCase()
    let s = 0
    for (const kk of lower) {
      if (!kk) continue
      if (title.includes(kk)) s += 4
      else if (desc.includes(kk)) s += 2
      else if (sub.includes(kk)) s += 3
      else if (loc.includes(kk)) s += 2
      else if (contact.includes(kk)) s += 1
    }
    return s
  }
  return [...posts].sort((a, b) => {
    const ds = score(b) - score(a)
    if (ds !== 0) return ds
    const dt = b.createdAt.getTime() - a.createdAt.getTime()
    if (dt !== 0) return dt
    return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
  })
}

function requiredAnyOfSpecificityScore<
  T extends {
    title: string
    description: string
    subCategory: string | null
    isPinned: boolean
    createdAt: Date
  },
>(post: T, requiredLower: readonly string[]): number {
  if (requiredLower.length === 0) return 0
  const title = post.title.toLowerCase()
  const desc = post.description.toLowerCase()
  const sub = (post.subCategory ?? '').toLowerCase()
  let score = 0

  for (const rk of requiredLower) {
    if (!rk) continue
    if (title.includes(rk)) score += 10
    if (sub.includes(rk)) score += 7
    if (desc.includes(rk)) score += 4
  }

  return score
}

function rerankByRequiredAnyOfSpecificity<
  T extends {
    title: string
    description: string
    subCategory: string | null
    isPinned: boolean
    createdAt: Date
  },
>(posts: T[], requiredLower: readonly string[], preferredSubCategory?: string): T[] {
  if (requiredLower.length === 0) return posts
  return [...posts].sort((a, b) => {
    const subBonus = (post: T) => {
      if (!preferredSubCategory) return 0
      const sub = (post.subCategory ?? '').trim()
      if (!sub) return 0
      return sub === preferredSubCategory ? 9 : -6
    }
    const ds =
      requiredAnyOfSpecificityScore(b, requiredLower) +
      subBonus(b) -
      (requiredAnyOfSpecificityScore(a, requiredLower) + subBonus(a))
    if (ds !== 0) return ds
    const dt = b.createdAt.getTime() - a.createdAt.getTime()
    if (dt !== 0) return dt
    return (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)
  })
}

function buildKeywordTokens(userQuery: string): string[] {
  const extracted = extractAiQueryKeywords(userQuery)
  if (extracted.length > 0) return extracted
  const crude = userQuery.replace(/[，。、；：！？…·～~\-—（）()\[\]「」『』《》"'“”‘’\s]+/g, ' ').trim()
  if (!crude) return []
  const segs = crude.split(/\s+/).filter((x) => x.replace(/[^\u4e00-\u9fffA-Za-z0-9]/g, '').length >= 2)
  if (segs.length > 0) return segs.slice(0, 14)
  const cjk = crude.match(/[\u4e00-\u9fff]{2,}/g)
  if (cjk && cjk.length) return cjk.slice(0, 14)
  return crude.length >= 2 ? [crude.slice(0, 60)] : []
}

export type AiLocationPayload = {
  locScope?: string
  locState?: string
  locCity?: string
  locArea?: string
}

export type AiSearchFilters = {
  category?: Category
  sub?: string
}

/**
 * 从用户自然语言中拆出关键词，按「任一词命中」做站内 OR 检索，再按命中度排序；
 * 若同时存在强词与弱词（如「手机」与「二手」），去掉仅命中弱词的帖子，减少品类串扰。
 */
export async function retrievePostsForAiQuery(
  userQuery: string,
  location: AiLocationPayload | undefined,
  filters: AiSearchFilters | undefined,
  viewerId: string | null,
  /** 由路由根据意图推断或用户指定；单一大类时收窄检索 */
  categoryIn?: Category[],
  opts?: {
    priceMin?: number | null
    priceMax?: number | null
    keywordOverride?: string[]
    /** 必须至少命中其中一个（用于 item/brand/model 等品类词，避免仅靠地点命中混入无关结果） */
    requiredAnyOf?: string[]
  },
) {
  const tokens =
    Array.isArray(opts?.keywordOverride) && opts!.keywordOverride!.length > 0
      ? opts!.keywordOverride!.map((s) => String(s).trim()).filter(Boolean)
      : buildKeywordTokens(userQuery)
  if (tokens.length === 0) {
    return { posts: [], total: 0, keywordsUsed: [] as string[] }
  }

  const params = new URLSearchParams()
  params.set('limit', String(AI_RAG_FETCH_LIMIT))
  params.set('page', '1')

  const loc = location ?? {}
  const scope = loc.locScope || 'nationwide'
  params.set('locScope', scope)
  if (loc.locState) params.set('locState', loc.locState)
  if (loc.locCity) params.set('locCity', loc.locCity)
  if (loc.locArea) params.set('locArea', loc.locArea)

  if (filters?.category) params.set('category', filters.category)
  if (filters?.sub) params.set('sub', filters.sub)

  const listOpts: GetPostsListOptions = { keywordOrTokens: tokens }
  const resolvedCategoryIn =
    filters?.category != null
      ? [filters.category]
      : categoryIn && categoryIn.length > 0
        ? categoryIn
        : undefined
  if (resolvedCategoryIn && resolvedCategoryIn.length > 0) {
    listOpts.categoryIn = resolvedCategoryIn
  }
  if (opts?.priceMin != null) listOpts.priceMin = opts.priceMin
  if (opts?.priceMax != null) listOpts.priceMax = opts.priceMax
  const { posts } = await getPostsList(params, viewerId, listOpts)
  const sorted = sortPostsByAiKeywordScore(posts, tokens)
  const filtered = filterPostsByStrongKeywords(sorted, tokens)
  const required =
    (opts?.requiredAnyOf ?? [])
      .map((s) => String(s).trim())
      .filter(Boolean)
      .slice(0, 8) || []
  const requiredLower = required.map((s) => s.toLowerCase())
  let finalList =
    requiredLower.length === 0
      ? filtered
      : filtered.filter((p) => {
          const blob = `${p.title}\n${p.description}\n${p.location}\n${p.contact}\n${p.subCategory ?? ''}`.toLowerCase()
          return requiredLower.some((rk) => blob.includes(rk))
        })

  const onlySecondhand =
    resolvedCategoryIn?.length === 1 && resolvedCategoryIn[0] === 'SECONDHAND'
  const explicitSecondhandItemLocked = onlySecondhand && requiredLower.length > 0
  const phoneish =
    tokens.some((k) => /手机|iphone|数码|苹果|三星|安卓|pixel|华为|小米/i.test(k)) ||
    /手机|iphone|数码/.test(userQuery)
  const jobScope =
    resolvedCategoryIn?.length === 1 && resolvedCategoryIn[0] === 'JOB'
  const rentScope =
    !!resolvedCategoryIn &&
    resolvedCategoryIn.length > 0 &&
    resolvedCategoryIn.every((c) => c === 'RENT' || c === 'RENT_SEEK')
  const mixOk = shouldInterleaveSubcategoryMix(userQuery)
  const cap = Math.max(AI_RAG_RETURN_LIMIT, finalList.length)

  if (explicitSecondhandItemLocked) {
    // 已有明确商品/品牌/型号约束时，优先保持“像不像同一个东西”，不要再为了多样性打散。
    finalList = rerankByRequiredAnyOfSpecificity(
      finalList,
      requiredLower,
      inferSecondhandSub(userQuery),
    )
  } else if (onlySecondhand && phoneish && finalList.length >= 4) {
    finalList = interleaveByPhoneBrandHint(finalList, cap)
  } else if (onlySecondhand && !phoneish && finalList.length >= 5 && mixOk) {
    finalList = interleaveByDistinctSubcategory(finalList, cap)
  } else if (jobScope && finalList.length >= 6 && mixOk) {
    finalList = interleaveByDistinctSubcategory(finalList, cap)
  } else if (rentScope && finalList.length >= 6 && mixOk) {
    finalList = interleaveByDistinctSubcategory(finalList, cap)
  }

  return {
    posts: finalList.slice(0, AI_RAG_RETURN_LIMIT),
    total: finalList.length,
    keywordsUsed: tokens,
  }
}
