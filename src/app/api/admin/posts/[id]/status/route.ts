import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PostStatus } from '@prisma/client'

const ALLOWED: PostStatus[] = ['PENDING', 'ACTIVE', 'REJECTED', 'EXPIRED', 'SOLD', 'DELISTED']

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  const { id } = await params
  const { status } = await req.json()
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: '无效状态' }, { status: 400 })
  }
  const post = await prisma.post.update({ where: { id }, data: { status } })
  return NextResponse.json({ success: true, post })
}
