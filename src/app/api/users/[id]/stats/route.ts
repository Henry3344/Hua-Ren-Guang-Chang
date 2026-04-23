import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({
    where: { id },
    select: { createdAt: true },
  })
  if (!user) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const postCount = await prisma.post.count({
    where: { userId: id, status: 'ACTIVE' },
  })

  return NextResponse.json({ postCount, joinedAt: user.createdAt })
}
