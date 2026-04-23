import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }
  const blockerId = (session.user as { id: string }).id
  const rows = await prisma.block.findMany({
    where: { blockerId },
    orderBy: { createdAt: 'desc' },
    include: {
      blocked: { select: { id: true, name: true, avatar: true, email: true, phone: true } },
    },
  })
  return NextResponse.json({ blocks: rows })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const blockerId = (session.user as { id: string }).id
  const { blockedUserId } = await req.json().catch(() => ({}))

  if (!blockedUserId) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  if (blockedUserId === blockerId) {
    return NextResponse.json({ error: '不能拉黑自己' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: blockedUserId } })
  if (!target || target.isDeleted) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  await prisma.block.upsert({
    where: {
      blockerId_blockedId: { blockerId, blockedId: blockedUserId },
    },
    create: { blockerId, blockedId: blockedUserId },
    update: {},
  })

  await prisma.userFollow.deleteMany({
    where: {
      OR: [
        { followerId: blockerId, followingId: blockedUserId },
        { followerId: blockedUserId, followingId: blockerId },
      ],
    },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }
  const blockerId = (session.user as { id: string }).id
  const { blockedUserId } = await req.json().catch(() => ({}))
  if (!blockedUserId) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  await prisma.block.deleteMany({
    where: { blockerId, blockedId: blockedUserId },
  })
  return NextResponse.json({ success: true })
}
