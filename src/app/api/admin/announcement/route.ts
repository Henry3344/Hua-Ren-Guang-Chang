import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) return null
  return session
}

export async function GET() {
  const s = await requireAdmin()
  if (!s) return NextResponse.json({ error: '无权限' }, { status: 403 })
  const [a, history] = await Promise.all([
    prisma.announcement.findFirst({ orderBy: { updatedAt: 'desc' } }),
    prisma.announcement.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, enabled: true, lines: true, updatedAt: true, createdAt: true },
    }),
  ])
  return NextResponse.json({
    announcement: a ? { enabled: a.enabled, lines: a.lines } : { enabled: false, lines: [] },
    history,
  })
}

export async function PUT(req: Request) {
  const s = await requireAdmin()
  if (!s) return NextResponse.json({ error: '无权限' }, { status: 403 })

  const { enabled, lines } = await req.json().catch(() => ({}))
  const cleaned =
    Array.isArray(lines)
      ? lines
          .filter((x) => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 10)
      : []

  const created = await prisma.announcement.create({
    data: { enabled: !!enabled, lines: cleaned },
    select: { enabled: true, lines: true },
  })

  return NextResponse.json({ ok: true, announcement: created })
}

