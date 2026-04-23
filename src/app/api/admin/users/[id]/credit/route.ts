import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const adminId = session.user.id
  const { id } = await params
  if (!id) return NextResponse.json({ error: '无效用户' }, { status: 400 })
  if (adminId && id === adminId) {
    return NextResponse.json({ error: '不能操作自己的信用分' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>))
  const deltaRaw = body?.delta
  const setRaw = body?.set

  const hasDelta = typeof deltaRaw === 'number' && Number.isFinite(deltaRaw)
  const hasSet = typeof setRaw === 'number' && Number.isFinite(setRaw)
  if (!hasDelta && !hasSet) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  const u0 = await prisma.user.findUnique({
    where: { id },
    select: { id: true, isDeleted: true, isBanned: true, creditScore: true },
  })
  if (!u0 || u0.isDeleted) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const nextCredit = clamp(hasSet ? setRaw : (u0.creditScore ?? 0) + deltaRaw, 0, 100)
  const shouldBan = nextCredit <= 0

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id },
      data: {
        creditScore: nextCredit,
        ...(shouldBan ? { isBanned: true } : {}),
      },
      select: { id: true, creditScore: true, isBanned: true },
    })
    if (shouldBan) {
      await tx.post.updateMany({
        where: { userId: id },
        data: { status: 'DELISTED', isPinned: false },
      })
    }
    return u
  })

  return NextResponse.json({ ok: true, user: updated })
}

