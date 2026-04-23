import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const MAX_TEXT = 220
const MAX_ITEMS = 30

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  const items = await prisma.riskExposureItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json({ items })
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) {
    return NextResponse.json({ error: '文案不能为空' }, { status: 400 })
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json({ error: `文案最长 ${MAX_TEXT} 字` }, { status: 400 })
  }
  const count = await prisma.riskExposureItem.count()
  if (count >= MAX_ITEMS) {
    return NextResponse.json({ error: `最多 ${MAX_ITEMS} 条，请先删除` }, { status: 400 })
  }
  const last = await prisma.riskExposureItem.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  const sortOrder = (last?.sortOrder ?? -1) + 1
  const item = await prisma.riskExposureItem.create({
    data: { text, sortOrder },
  })
  return NextResponse.json({ ok: true, item })
}
