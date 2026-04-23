import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdPlacement, isAdType } from '@/lib/adConstants'
import { AD_MAX_DURATION_DAYS, AD_MIN_DURATION_DAYS, getAdDurationDays } from '@/lib/stripePayments'

function activeWhere(placement: string) {
  const now = new Date()
  return {
    placement,
    isActive: true,
    paymentStatus: 'COMPLETED' as const,
    startAt: { lte: now },
    endAt: { gte: now },
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const placement = searchParams.get('placement')
  if (!placement || !isAdPlacement(placement)) {
    return NextResponse.json({ error: '缺少或无效的 placement' }, { status: 400 })
  }

  const ads = await prisma.ad.findMany({
    where: activeWhere(placement),
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      post: {
        select: {
          id: true,
          title: true,
          images: true,
          category: true,
          status: true,
        },
      },
    },
  })

  const visible = ads.filter((a) => {
    if (a.type !== 'PINNED' || !a.postId) return true
    return a.post?.status === 'ACTIVE' || a.post?.status === 'SOLD'
  })

  return NextResponse.json({ ads: visible })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const merchant = await prisma.merchant.findUnique({
    where: { userId },
    select: { id: true, status: true, paymentStatus: true },
  })
  if (!merchant || merchant.status !== 'APPROVED' || merchant.paymentStatus !== 'COMPLETED') {
    return NextResponse.json({ error: '请先完成商家入驻并通过审核' }, { status: 403 })
  }

  const body = await req.json()
  const {
    type,
    placement,
    targetUrl,
    postId,
    startAt: startRaw,
    endAt: endRaw,
    autoRenew,
  } = body

  if (!type || !placement || !startRaw || !endRaw) {
    return NextResponse.json({ error: '缺少必填项' }, { status: 400 })
  }
  if (!isAdType(type) || !isAdPlacement(placement)) {
    return NextResponse.json({ error: '无效的类型或 placement' }, { status: 400 })
  }

  const startAt = new Date(startRaw)
  const endAt = new Date(endRaw)
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json({ error: '请填写有效的时间段' }, { status: 400 })
  }
  const durationDays = getAdDurationDays(startAt, endAt)
  if (durationDays < AD_MIN_DURATION_DAYS || durationDays > AD_MAX_DURATION_DAYS) {
    return NextResponse.json({ error: `广告投放时长需在 ${AD_MIN_DURATION_DAYS}-${AD_MAX_DURATION_DAYS} 天之间` }, { status: 400 })
  }

  if (type === 'PINNED') {
    if (!postId) {
      return NextResponse.json({ error: '置顶广告需要关联帖子 postId' }, { status: 400 })
    }
    const post = await prisma.post.findFirst({
      where: { id: postId, userId },
    })
    if (!post) {
      return NextResponse.json({ error: '帖子不存在或无权关联' }, { status: 400 })
    }
  } else if (postId) {
    return NextResponse.json({ error: '仅 PINNED 类型可填写 postId' }, { status: 400 })
  }

  const ad = await prisma.ad.create({
    data: {
      userId,
      type,
      placement,
      targetUrl: targetUrl || null,
      postId: type === 'PINNED' ? postId : null,
      startAt,
      endAt,
      isActive: false,
      autoRenew: typeof autoRenew === 'boolean' ? autoRenew : false,
      paymentStatus: 'PENDING',
      paidAt: null,
      stripeSessionId: null,
    },
    include: {
      post: {
        select: { id: true, title: true, images: true, category: true, status: true },
      },
    },
  })

  return NextResponse.json({ success: true, ad })
}
