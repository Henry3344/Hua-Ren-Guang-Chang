import type { Post } from '@prisma/client'
import { AI_RAG_RETURN_LIMIT } from '@/lib/aiSearchRag'

type Scorable = Pick<
  Post,
  'id' | 'price' | 'createdAt' | 'category' | 'subCategory' | 'isPinned'
> & {
  user?: { merchant?: { status: string } | null } | null
}

/** 各分量均在 [0,1]，再乘权重，避免某一 bonus 单独爆炸 */
const W = {
  /** 略让出给 business_signal，保持总和为 1（可被 MergeScoreOpts 覆盖 retrieval/business） */
  retrieval: 0.3,
  crossTrack: 0.2,
  price: 0.18,
  freshness: 0.16,
  rarityLocal: 0.1,
  /** 认证商家等轻权重信号 */
  business: 0.06,
} as const

export type MergeScoreOpts = {
  retrievalWeight?: number
  businessWeight?: number
  freshnessWeight?: number
}

function clamp01(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x
}

function subcategoryKey(p: Pick<Post, 'category' | 'subCategory'>): string {
  return `${p.category}|${(p.subCategory ?? '').trim().toLowerCase()}`
}

function bucketCountsUnion(posts: Scorable[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of posts) {
    const k = subcategoryKey(p)
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

/** 仅基于当前候选池（多轨并集）：同类 bucket 越少，分略高（权重小，防误导全站） */
function rarityNormInUnion(p: Scorable, counts: Map<string, number>): number {
  const c = counts.get(subcategoryKey(p)) ?? 1
  if (c <= 1) return 1
  if (c === 2) return 0.72
  if (c <= 4) return 0.55
  return 0.38
}

function priceNormInUnion(p: Scorable, priced: Scorable[]): number {
  const nums = priced
    .map((x) => (x.price != null ? Number(x.price) : NaN))
    .filter((n) => Number.isFinite(n))
  if (nums.length === 0) return 0.5
  const pv = p.price != null ? Number(p.price) : NaN
  if (!Number.isFinite(pv)) return 0.5
  const minP = Math.min(...nums)
  const maxP = Math.max(...nums)
  const range = maxP - minP || 1
  return clamp01((maxP - pv) / range)
}

function freshnessNorm(p: Scorable): number {
  const created = p.createdAt instanceof Date ? p.createdAt : new Date(String(p.createdAt))
  const days = (Date.now() - created.getTime()) / 86400000
  return clamp01(Math.exp(-days / 21))
}

function businessNorm(p: Scorable): number {
  return p.user?.merchant?.status === 'APPROVED' ? 1 : 0
}

/**
 * 先相关、后便宜：
 * 价格优势只在「检索相关性已过线」后才充分生效，避免低价但弱相关的帖子靠 price bonus 冲到前排。
 */
function priceGateFromRetrieval(retrieval: number): number {
  if (retrieval <= 0.2) return 0.1
  if (retrieval >= 0.72) return 1
  return clamp01((retrieval - 0.2) / (0.72 - 0.2))
}

export type WeightedTrack<T extends { id: string }> = {
  posts: T[]
  weight: number
  key: string
}

/**
 * 多轨统一评分合并：retrieval / crossTrack / price / freshness / rarityLocal / business 同量纲加权求和。
 */
export function mergeTracksUnifiedScore<T extends { id: string } & Scorable>(
  tracks: WeightedTrack<T>[],
  scoreOpts?: MergeScoreOpts,
): { posts: T[]; crossTrackHitCounts: Record<string, number> } {
  const rw = scoreOpts?.retrievalWeight ?? W.retrieval
  const bw = scoreOpts?.businessWeight ?? W.business
  const fw = scoreOpts?.freshnessWeight ?? W.freshness
  if (tracks.length === 0) {
    return { posts: [], crossTrackHitCounts: {} }
  }

  const maxW = Math.max(...tracks.map((t) => t.weight))
  const idToPost = new Map<string, T>()
  for (const t of tracks) {
    for (const p of t.posts) {
      if (!idToPost.has(p.id)) idToPost.set(p.id, p)
    }
  }
  const union = [...idToPost.values()]
  const priced = union.filter((p) => p.price != null && Number.isFinite(Number(p.price)))
  const subCounts = bucketCountsUnion(union)

  const crossTrackHitCounts: Record<string, number> = {}

  const scored = [...idToPost.keys()].map((id) => {
    let retrieval = 0
    let hits = 0
    for (const t of tracks) {
      const idx = t.posts.findIndex((p) => p.id === id)
      if (idx < 0) continue
      hits++
      const normRank = (t.posts.length - idx) / Math.max(1, t.posts.length)
      const wN = t.weight / maxW
      retrieval = Math.max(retrieval, normRank * wN)
    }
    retrieval = clamp01(retrieval)

    if (hits >= 2) crossTrackHitCounts[id] = hits
    const cross = hits >= 2 ? clamp01((hits - 1) * 0.42) : 0

    const p = idToPost.get(id)!
    const priceS = priceNormInUnion(p, priced)
    const freshS = freshnessNorm(p)
    const rareS = rarityNormInUnion(p, subCounts)
    const bizS = businessNorm(p)
    const priceGate = priceGateFromRetrieval(retrieval)

    const score =
      rw * retrieval +
      W.crossTrack * cross +
      W.price * priceS * priceGate +
      fw * freshS +
      W.rarityLocal * rareS +
      bw * bizS

    return { post: p, score, id, hits }
  })

  scored.sort((a, b) => {
    const ds = b.score - a.score
    if (ds !== 0) return ds
    const ap = a.post.isPinned ? 1 : 0
    const bp = b.post.isPinned ? 1 : 0
    if (ap !== bp) return bp - ap
    return b.post.createdAt.getTime() - a.post.createdAt.getTime()
  })
  return {
    posts: scored.map((s) => s.post).slice(0, AI_RAG_RETURN_LIMIT),
    crossTrackHitCounts,
  }
}
