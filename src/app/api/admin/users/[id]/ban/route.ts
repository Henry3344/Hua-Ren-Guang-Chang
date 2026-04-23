import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  if (!id) return NextResponse.json({ error: '无效用户' }, { status: 400 })

  const adminId = (session.user as { id?: string }).id
  if (id === adminId) {
    return NextResponse.json({ error: '不能封禁自己' }, { status: 400 })
  }

  const { banned } = await req.json().catch(() => ({}))
  const isBanned = !!banned

  const u = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        isBanned,
        ...(isBanned ? { creditScore: 0 } : {}),
      },
      select: { id: true, isBanned: true, creditScore: true },
    })
    if (isBanned) {
      await tx.post.updateMany({
        where: { userId: id },
        data: { status: 'DELISTED', isPinned: false },
      })
    }
    return updated
  })

  return NextResponse.json({ ok: true, user: u })
}
