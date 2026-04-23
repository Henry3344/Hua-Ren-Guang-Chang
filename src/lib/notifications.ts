import { prisma } from '@/lib/prisma'
import type { PostStatus } from '@prisma/client'

export async function notifyUserNewFollower(followingUserId: string, followerId: string) {
  const follower = await prisma.user.findUnique({
    where: { id: followerId },
    select: { name: true },
  })
  const label = follower?.name?.trim() || '用户'
  await prisma.notification.create({
    data: {
      userId: followingUserId,
      title: '有人关注了你',
      body: `${label} 关注了你。`,
      kind: 'NEW_FOLLOW',
    },
  })
}

export async function notifyFollowersNewPost(params: {
  authorId: string
  postId: string
  postTitle: string
  status: PostStatus
}) {
  const { authorId, postId, postTitle, status } = params
  const author = await prisma.user.findUnique({
    where: { id: authorId },
    select: { name: true },
  })
  const name = author?.name?.trim() || '用户'

  const follows = await prisma.userFollow.findMany({
    where: { followingId: authorId },
    select: { followerId: true },
  })
  const followerIds = follows.map((f) => f.followerId)
  if (followerIds.length === 0) return

  const blocks = await prisma.block.findMany({
    where: {
      OR: [
        { blockedId: authorId, blockerId: { in: followerIds } },
        { blockerId: authorId, blockedId: { in: followerIds } },
      ],
    },
  })
  const skip = new Set<string>()
  for (const b of blocks) {
    if (b.blockedId === authorId) skip.add(b.blockerId)
    if (b.blockerId === authorId) skip.add(b.blockedId)
  }

  const eligible = followerIds.filter((id) => !skip.has(id))
  if (eligible.length === 0) return

  const t = postTitle.trim()
  const short = t.length > 100 ? t.slice(0, 100) + '…' : t
  const pendingNote = status === 'PENDING' ? '（审核通过后将公开）' : ''
  const body = `《${short}》${pendingNote}\n查看：/posts/${postId}`

  await prisma.notification.createMany({
    data: eligible.map((userId) => ({
      userId,
      title: `${name} 发布了新帖`,
      body,
      kind: 'FOLLOW_POST',
    })),
  })
}
