import type { Category, Post } from '@prisma/client'
import {
  mergeTracksUnifiedScore,
  type MergeScoreOpts,
  type WeightedTrack,
} from '@/lib/aiUnifiedRetrievalMerge'

type ScorablePost = Pick<
  Post,
  'id' | 'price' | 'createdAt' | 'category' | 'subCategory' | 'isPinned'
> & {
  user?: { merchant?: { status: string } | null } | null
}

/** 原句轨权重大于任意改写轨 */
export const WEIGHT_ORIGINAL_QUERY = 1.58
export const WEIGHT_REWRITE_VARIANTS = [1.0, 0.94, 0.88] as const
/** 弱约束泛词轨：仅作召回兜底，权重最低 */
export const WEIGHT_WEAK_FALLBACK = 0.48
/** 默认弱兜底（租房向）；二手/招聘等场景请用 pickWeakFallbackQuery */
export const WEAK_FALLBACK_RETRIEVE_QUERY = '出租 房源 住宅 租房'
/** 泛词召回：勿含「手机/数码」等单品类词，避免与箱包/家具等检索串味 */
export const WEAK_FALLBACK_SECONDHAND_QUERY = '闲置 转让 便宜 二手 同城 个人'
export const WEAK_FALLBACK_JOB_QUERY = '招聘 兼职 全职 时薪 招工'

export function pickWeakFallbackQuery(category: Category | undefined): string {
  if (category === 'SECONDHAND') return WEAK_FALLBACK_SECONDHAND_QUERY
  if (category === 'JOB' || category === 'JOB_SEEK') return WEAK_FALLBACK_JOB_QUERY
  if (category === 'RENT' || category === 'RENT_SEEK') return WEAK_FALLBACK_RETRIEVE_QUERY
  return WEAK_FALLBACK_RETRIEVE_QUERY
}

/** 原句命中条数 ≥ 此值则跳过多候选改写 Groq + 多轨扩展（渐进检索）；略低以多走改写轨换召回 */
export const PROGRESSIVE_MIN_ORIGINAL_HITS = 8
/** 合并后仍偏少时再拉一条弱约束检索 */
export const WEAK_MERGE_MAX_POSTS = 9

export type { WeightedTrack, MergeScoreOpts }

/** 名称保留；内部为统一量纲评分（retrieval/cross/price/fresh/rarity_local/business） */
export function mergeMultiTrackPostLists<T extends ScorablePost>(
  tracks: WeightedTrack<T>[],
  scoreOpts?: MergeScoreOpts,
) {
  return mergeTracksUnifiedScore(tracks, scoreOpts)
}

export function mergeKeywordTokens(a: readonly string[], b: readonly string[]): string[] {
  return mergeManyKeywordTokens([a, b])
}

export function mergeManyKeywordTokens(arrays: ReadonlyArray<readonly string[]>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const arr of arrays) {
    for (const x of arr) {
      const t = String(x).trim()
      if (!t) continue
      const k = t.toLowerCase()
      if (seen.has(k)) continue
      seen.add(k)
      out.push(t)
      if (out.length >= 22) return out
    }
  }
  return out
}
