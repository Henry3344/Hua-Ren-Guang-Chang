import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  if (typeof Reflect.get(prisma, 'ad') === 'undefined') {
    return NextResponse.json(
      { error: '服务端 Prisma 未更新，请重启开发服务器后重试。' },
      { status: 500 },
    )
  }
  const ads = await prisma.ad.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      post: {
        select: { id: true, title: true, status: true },
      },
    },
  })

  return NextResponse.json({ ads })
}
