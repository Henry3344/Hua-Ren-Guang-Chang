import { PostStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { AI_ASSISTANT_SPONSOR_PLACEMENT } from '@/lib/adConstants'

/**
 * 取当前有效的 AI 助手赞助单卡（placement=`AI_ASSISTANT_SPONSOR`，绑定 post）。
 * 与列表 API 一致：帖 ACTIVE/SOLD，作者未封禁、未注销。
 */
export async function fetchSponsoredPostForAiSearch() {
  const now = new Date()
  const ad = await prisma.ad.findFirst({
    where: {
      placement: AI_ASSISTANT_SPONSOR_PLACEMENT,
      isActive: true,
      startAt: { lte: now },
      endAt: { gte: now },
      postId: { not: null },
      post: {
        status: { in: [PostStatus.ACTIVE, PostStatus.SOLD] },
        user: { isBanned: false, isDeleted: false },
      },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              merchant: { select: { status: true } },
            },
          },
        },
      },
    },
  })
  return ad?.post ?? null
}
