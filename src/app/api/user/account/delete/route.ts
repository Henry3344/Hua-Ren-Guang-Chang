import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { reason, detail } = await req.json()

  const reasons = ['不想使用了', '信息不准确', '隐私原因', '其他']
  if (!reason || !reasons.includes(reason)) {
    return NextResponse.json({ error: '请选择删除原因' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.isDeleted) {
    return NextResponse.json({ error: '账号状态异常' }, { status: 400 })
  }

  const randomPwd = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)

  await prisma.$transaction(async (tx) => {
    await tx.block.deleteMany({
      where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
    })
    await tx.post.deleteMany({ where: { userId } })
    await tx.favorite.deleteMany({ where: { userId } })
    await tx.ad.deleteMany({ where: { userId } })
    await tx.merchant.deleteMany({ where: { userId } })
    await tx.user.update({
      where: { id: userId },
      data: {
        isDeleted: true,
        deletionReason: reason,
        deletionDetail: typeof detail === 'string' && detail.trim() ? detail.trim() : null,
        password: randomPwd,
        name: user.name,
        email: user.email,
        phone: user.phone,
        creditScore: user.creditScore,
      },
    })
  })

  return NextResponse.json({ success: true })
}
