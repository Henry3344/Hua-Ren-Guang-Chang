import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = session.user.id
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { post: { include: { user: { select: { id: true, name: true } } } } },
  })
  const posts = favorites.map(f => f.post).filter(p => p.status === 'ACTIVE' || p.status === 'SOLD')
  return NextResponse.json({ posts })
}
