import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const [reports, total] = await Promise.all([
    prisma.userReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        reporter: { select: { id: true, name: true, email: true, phone: true } },
        reported: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.userReport.count(),
  ])

  return NextResponse.json({ reports, total })
}
