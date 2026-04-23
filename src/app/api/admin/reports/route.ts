import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  if (typeof Reflect.get(prisma, 'report') === 'undefined') {
    return NextResponse.json(
      { error: '服务端 Prisma 未更新，请重启开发服务器后重试。' },
      { status: 500 },
    )
  }

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        post: {
          include: { user: { select: { id: true, name: true } } },
        },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    }),
    prisma.report.count(),
  ])

  return NextResponse.json({ reports, total })
}
