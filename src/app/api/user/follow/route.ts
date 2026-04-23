import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notifyUserNewFollower } from '@/lib/notifications'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const followerId = (session.user as { id: string }).id
  const { followingUserId } = await req.json().catch(() => ({}))

  if (!followingUserId || typeof followingUserId !== 'string') {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  if (followingUserId === followerId) {
    return NextResponse.json({ error: '不能关注自己' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: followingUserId } })
  if (!target || target.isDeleted) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  const blockedEitherWay = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: followerId, blockedId: followingUserId },
        { blockerId: followingUserId, blockedId: followerId },
      ],
    },
  })
  if (blockedEitherWay) {
    return NextResponse.json({ error: '当前无法关注该用户' }, { status: 400 })
  }

  const existing = await prisma.userFollow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId: followingUserId },
    },
  })
  if (existing) {
    return NextResponse.json({ success: true })
  }

  await prisma.userFollow.create({
    data: { followerId, followingId: followingUserId },
  })

  await notifyUserNewFollower(followingUserId, followerId).catch((e) => {
    console.error('notifyUserNewFollower', e)
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const followerId = (session.user as { id: string }).id
  const { followingUserId } = await req.json().catch(() => ({}))

  if (!followingUserId || typeof followingUserId !== 'string') {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  await prisma.userFollow.deleteMany({
    where: { followerId, followingId: followingUserId },
  })

  return NextResponse.json({ success: true })
}
