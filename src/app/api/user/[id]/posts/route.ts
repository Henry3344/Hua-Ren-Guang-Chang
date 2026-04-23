import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

const postSelect = {
  id: true,
  title: true,
  description: true,
  price: true,
  location: true,
  category: true,
  status: true,
  images: true,
  subCategory: true,
  viewCount: true,
  isPinned: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      merchant: { select: { status: true } },
    },
  },
} satisfies Prisma.PostSelect

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let id: string
  try {
    id = (await params).id
  } catch {
    return NextResponse.json({ error: '请求无效' }, { status: 400 })
  }

  if (!id || id === 'undefined') {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  const session = await getServerSession(authOptions)
  const viewerId = (session?.user as { id?: string } | undefined)?.id

  const { searchParams } = new URL(req.url)
  const view = searchParams.get('view') === 'completed' ? 'completed' : 'published'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20))
  const skip = (page - 1) * limit

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, isDeleted: true, isBanned: true },
  })

  if (!user || user.isDeleted) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  if (viewerId) {
    const blocked = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: { blockerId: viewerId, blockedId: id },
      },
    })
    if (blocked) {
      return NextResponse.json({ error: '无法查看' }, { status: 404 })
    }
  }

  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin
  if (user.isBanned && viewerId !== id && !isAdmin) {
    return NextResponse.json({ error: '无法查看' }, { status: 404 })
  }

  const isSelf = viewerId === id

  const wherePublished: Prisma.PostWhereInput = isSelf
    ? { userId: id, status: { not: 'SOLD' } }
    : { userId: id, status: 'ACTIVE' }

  const whereCompleted: Prisma.PostWhereInput = {
    userId: id,
    status: 'SOLD',
  }

  const where = view === 'completed' ? whereCompleted : wherePublished

  const [total, posts] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: postSelect,
    }),
  ])

  return NextResponse.json({
    view,
    userName: user.name,
    posts,
    total,
    page,
    limit,
    hasMore: skip + posts.length < total,
  })
}
