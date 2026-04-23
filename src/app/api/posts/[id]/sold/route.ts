import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })
  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  if (post.userId !== session.user.id) return NextResponse.json({ error: '无权限' }, { status: 403 })
  const updated = await prisma.post.update({ where: { id }, data: { status: 'SOLD' } })
  return NextResponse.json({ success: true, post: updated })
}
