import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { REPORT_REASONS } from '@/lib/reportReasons'

const REASONS = new Set<string>(REPORT_REASONS)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const reporterId = (session.user as { id: string }).id
  const { reportedUserId, reason, details, contactPhone } = await req.json()

  if (!reportedUserId || !reason) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  if (reportedUserId === reporterId) {
    return NextResponse.json({ error: '不能举报自己' }, { status: 400 })
  }

  if (!REASONS.has(reason)) {
    return NextResponse.json({ error: '无效的举报原因' }, { status: 400 })
  }

  const phone =
    typeof contactPhone === 'string' && contactPhone.trim() ? contactPhone.trim() : null

  const target = await prisma.user.findUnique({ where: { id: reportedUserId } })
  if (!target || target.isDeleted) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.userReport.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
        details: typeof details === 'string' && details.trim() ? details.trim() : null,
        contactPhone: phone,
      },
    })
  })

  return NextResponse.json({ success: true })
}
