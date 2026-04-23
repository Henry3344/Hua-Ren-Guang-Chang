import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeLevel } from '@/lib/level'
import { canChangeAfter, nextAllowedChangeAt } from '@/lib/profileCooldown'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  let id: string
  try {
    const p = await params
    id = p.id
  } catch {
    return NextResponse.json({ error: '请求无效' }, { status: 400 })
  }

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  try {
  const session = await getServerSession(authOptions)
  const viewerId = (session?.user as { id?: string } | undefined)?.id

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      avatar: true,
      email: true,
      phone: true,
      creditScore: true,
      level: true,
      isDeleted: true,
      isBanned: true,
      createdAt: true,
      merchant: { select: { status: true } },
      lastNameChangeAt: true,
      lastAvatarChangeAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  if (viewerId) {
    const blocked = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: viewerId, blockedId: id },
      },
    })
    if (blocked) {
      return NextResponse.json({ error: '无法查看该用户' }, { status: 404 })
    }
  }

  if (user.isDeleted) {
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        isDeleted: true,
        creditScore: user.creditScore,
      },
    })
  }

  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin
  if (user.isBanned && viewerId !== id && !isAdmin) {
    return NextResponse.json({ error: '无法查看该用户' }, { status: 404 })
  }

  const [postCount, completedCount, publishedCountSelf, publishedCountPublic, agg, followerCount] =
    await Promise.all([
      prisma.post.count({ where: { userId: id } }),
      prisma.post.count({ where: { userId: id, status: 'SOLD' } }),
      prisma.post.count({ where: { userId: id, status: { not: 'SOLD' } } }),
      prisma.post.count({ where: { userId: id, status: 'ACTIVE' } }),
      prisma.post.aggregate({
        where: { userId: id },
        _sum: { viewCount: true },
      }),
      prisma.userFollow.count({ where: { followingId: id } }),
    ])

  const totalViews = agg._sum.viewCount ?? 0
  const level = computeLevel(postCount, totalViews)

  await prisma.user.update({
    where: { id },
    data: { level },
  })

  const isSelf = viewerId === id
  const publishedCount = isSelf ? publishedCountSelf : publishedCountPublic

  let isFollowing: boolean | undefined
  if (viewerId && viewerId !== id) {
    const f = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: id },
      },
    })
    isFollowing = !!f
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      creditScore: Math.max(0, user.creditScore),
      level,
      createdAt: user.createdAt,
      publishedCount,
      completedCount,
      followerCount,
      merchantStatus: user.merchant?.status ?? null,
      isVerifiedMerchant: user.merchant?.status === 'APPROVED',
      isSelf,
      ...(typeof isFollowing === 'boolean' ? { isFollowing } : {}),
      ...(isSelf
        ? {
            email: user.email,
            username: user.username,
            phone: user.phone,
            canChangeName: canChangeAfter(user.lastNameChangeAt),
            canChangeAvatar: canChangeAfter(user.lastAvatarChangeAt),
            nextNameChangeAt: nextAllowedChangeAt(user.lastNameChangeAt)?.toISOString() ?? null,
            nextAvatarChangeAt: nextAllowedChangeAt(user.lastAvatarChangeAt)?.toISOString() ?? null,
          }
        : {}),
    },
  })
  } catch (e) {
    console.error('GET /api/user/[id]', e)
    return NextResponse.json({ error: '服务器繁忙，请稍后重试' }, { status: 500 })
  }
}
