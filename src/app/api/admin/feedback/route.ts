import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const take = Math.min(100, Math.max(1, parseInt(searchParams.get('take') || '50', 10) || 50))
  const skip = Math.max(0, parseInt(searchParams.get('skip') || '0', 10) || 0)

  const [items, total] = await Promise.all([
    prisma.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.feedback.count(),
  ])

  return NextResponse.json({ feedback: items, total, skip, take })
}
