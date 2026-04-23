import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ notifications: [] })
  const userId = session.user.id as string | undefined
  if (!userId) return NextResponse.json({ notifications: [] })

  const notifications = await prisma.notification.findMany({
    where: { OR: [{ userId }, { userId: null }] },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })
  return NextResponse.json({ notifications })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const userId = session.user.id as string | undefined
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { ids } = await req.json().catch(() => ({}))
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: true })
  }

  await prisma.notification.updateMany({
    where: { id: { in: ids }, userId },
    data: { isRead: true },
  })
  return NextResponse.json({ ok: true })
}

