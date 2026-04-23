import type { Post } from '@prisma/client'
import { AI_RAG_RETURN_LIMIT } from '@/lib/aiSearchRag'

/** AI 助手气泡内展示的帖子卡片（与 PostCard compact 所需字段对齐） */
export type AiRagPostCard = {
  id: string
  title: string
  category: string
  subCategory: string | null
  location: string
  price: number | null
  images: string[]
  viewCount: number
  createdAt: string | Date
  isPinned: boolean
  jobSalaryUnit: string | null
  /** 赞助推荐位插入的单卡，仅用于展示标注 */
  isSponsored?: boolean
  user: {
    merchant: { status: string } | null
  } | null
}

type PostWithUser = Post & {
  user: {
    merchant: { status: string } | null
  } | null
}

export function serializePostForAiRag(
  post: PostWithUser,
  opts?: { isSponsored?: boolean },
): AiRagPostCard {
  return {
    id: post.id,
    title: post.title,
    category: post.category,
    subCategory: post.subCategory,
    location: post.location,
    price: post.price,
    images: Array.isArray(post.images) ? post.images : [],
    viewCount: post.viewCount,
    createdAt:
      post.createdAt instanceof Date ? post.createdAt.toISOString() : String(post.createdAt),
    isPinned: post.isPinned,
    jobSalaryUnit: post.jobSalaryUnit,
    isSponsored: opts?.isSponsored === true ? true : undefined,
    user: post.user
      ? {
          merchant: post.user.merchant,
        }
      : null,
  }
}

export function serializePostsForAiRag(posts: PostWithUser[]): AiRagPostCard[] {
  return posts.map((p) => serializePostForAiRag(p))
}

export type AiSponsorMergeResult = {
  ragCards: AiRagPostCard[]
  /** 与卡片顺序一致，供 LLM 解释与站内编号对齐 */
  mergedPosts: PostWithUser[]
  sponsorId: string | null
}

/** 赞助卡插入点：索引 0 为第一条自然结果之前；禁止 0，保证首条为自然帖。结果多时扩大随机区间以打散预期。 */
export function pickSponsorInsertIndex(trimmedOrganicLen: number): number {
  const L = trimmedOrganicLen
  if (L <= 0) return 0
  if (L === 1) return 1
  const lo = 1
  const hi = L >= 10 ? Math.min(L, 7) : Math.min(L, 3)
  return lo + Math.floor(Math.random() * (hi - lo + 1))
}

/**
 * 在相关列表前段随机插入赞助卡（不占第 1 条；短列表约第 2～4 位，长列表可更靠后；去重；总长不超过 AI_RAG_RETURN_LIMIT）。
 */
export function mergeAiRagPostsWithSponsorSlot(
  organic: PostWithUser[],
  sponsor: PostWithUser | null,
): AiSponsorMergeResult {
  if (organic.length === 0) {
    return { ragCards: [], mergedPosts: [], sponsorId: null }
  }
  if (!sponsor || organic.some((p) => p.id === sponsor.id)) {
    const sl = organic.slice(0, AI_RAG_RETURN_LIMIT)
    return {
      ragCards: serializePostsForAiRag(sl),
      mergedPosts: sl,
      sponsorId: null,
    }
  }
  const trimmed = organic.slice(0, AI_RAG_RETURN_LIMIT - 1)
  const insertAt = pickSponsorInsertIndex(trimmed.length)
  const merged: PostWithUser[] = [
    ...trimmed.slice(0, insertAt),
    sponsor,
    ...trimmed.slice(insertAt),
  ]
  const sid = sponsor.id
  return {
    ragCards: merged.map((p) => serializePostForAiRag(p, { isSponsored: p.id === sid })),
    mergedPosts: merged,
    sponsorId: sid,
  }
}
