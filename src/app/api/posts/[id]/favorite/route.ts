import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: '无效会话' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId: id } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { userId_postId: { userId, postId: id } } })
  } else {
    await prisma.favorite.create({ data: { userId, postId: id } })
  }
  const count = await prisma.favorite.count({ where: { postId: id } })
  return NextResponse.json({ favorited: !existing, count })
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ favorited: false })
  const userId = session.user.id
  if (!userId) return NextResponse.json({ favorited: false })
  const { id } = await params
  const existing = await prisma.favorite.findUnique({
    where: { userId_postId: { userId, postId: id } },
  })
  const count = await prisma.favorite.count({ where: { postId: id } })
  return NextResponse.json({ favorited: !!existing, count })
}
