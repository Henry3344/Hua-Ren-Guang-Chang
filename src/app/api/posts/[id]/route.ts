import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          creditScore: true,
          isDeleted: true,
          isBanned: true,
          merchant: { select: { status: true } },
          avatar: true,
        },
      },
    },
  })
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 })

  const userId = session?.user?.id
  const isAdmin = session?.user?.isAdmin
  const isOwner = userId && post.userId === userId

  if (post.user.isDeleted || post.user.isBanned) {
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }
  }

  if (userId && post.userId !== userId) {
    const blocked = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: post.userId } },
    })
    if (blocked) {
      return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
    }
  }

  const publicCanView = post.status === 'ACTIVE' || post.status === 'SOLD'
  if (!publicCanView && !isOwner && !isAdmin) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  await prisma.post.update({ where: { id }, data: { viewCount: { increment: 1 } } })
  return NextResponse.json(post)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 })

  const userId = session.user.id
  const isAdmin = session.user.isAdmin
  if (post.userId !== userId && !isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
