import { prisma } from '@/lib/prisma'

const userSelect = {
  id: true,
  name: true,
  createdAt: true,
  creditScore: true,
  isDeleted: true,
  isBanned: true,
  merchant: { select: { status: true } },
  avatar: true,
} as const

/**
 * 供 RSC 首屏 HTML：不增加浏览量；仅匿名可见的公开帖（ACTIVE/SOLD 且作者未封禁/注销）。
 * 待审核/仅本人可见等由客户端再拉 /api/posts/[id]。
 */
export async function getPostDetailForRsc(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: userSelect,
      },
    },
  })
  if (!post) return null
  if (post.user.isDeleted || post.user.isBanned) return null
  const publicCanView = post.status === 'ACTIVE' || post.status === 'SOLD'
  if (!publicCanView) return null
  return post
}
