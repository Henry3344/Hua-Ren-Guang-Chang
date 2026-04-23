import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { REPORT_REASONS } from '@/lib/reportReasons'

const REASONS = new Set<string>(REPORT_REASONS)

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null
  if (!userId) {
    return NextResponse.json({ error: '请先登录后再举报' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) {
    return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
  }

  if (post.userId === userId) {
    return NextResponse.json({ error: '不能举报自己的帖子' }, { status: 400 })
  }

  let body: { reason?: string; details?: string; contactPhone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : ''
  if (!reason || !REASONS.has(reason)) {
    return NextResponse.json({ error: '请选择有效的举报原因' }, { status: 400 })
  }

  const details = typeof body.details === 'string' && body.details.trim() ? body.details.trim() : null
  const contactPhone =
    typeof body.contactPhone === 'string' && body.contactPhone.trim() ? body.contactPhone.trim() : null

  const existing = await prisma.report.findFirst({
    where: { postId: id, userId },
  })
  if (existing) {
    return NextResponse.json({ success: true, duplicate: true })
  }

  await prisma.$transaction([
    prisma.report.create({
      data: {
        postId: id,
        userId,
        reason,
        details,
        contactPhone,
      },
    }),
    prisma.post.update({
      where: { id },
      data: { isFlagged: true },
    }),
  ])

  return NextResponse.json({ success: true })
}
