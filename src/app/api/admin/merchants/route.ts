import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const merchants = await prisma.merchant.findMany({
    orderBy: [{ status: 'asc' }, { isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  })

  return NextResponse.json({ merchants })
}

