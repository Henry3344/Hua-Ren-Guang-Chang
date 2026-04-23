import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { id } = await params
  const { isActive, autoRenew } = await req.json()

  const existing = await prisma.ad.findFirst({ where: { id, userId } })
  if (!existing) {
    return NextResponse.json({ error: '不存在' }, { status: 404 })
  }
  if (existing.paymentStatus !== 'COMPLETED') {
    return NextResponse.json({ error: '广告尚未支付完成，暂不可调整投放状态' }, { status: 400 })
  }

  const data: { isActive?: boolean; autoRenew?: boolean } = {}
  if (typeof isActive === 'boolean') data.isActive = isActive
  if (typeof autoRenew === 'boolean') data.autoRenew = autoRenew

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: '无有效字段' }, { status: 400 })
  }

  const ad = await prisma.ad.update({
    where: { id },
    data,
    include: {
      post: { select: { id: true, title: true, status: true } },
    },
  })

  return NextResponse.json({ success: true, ad })
}
