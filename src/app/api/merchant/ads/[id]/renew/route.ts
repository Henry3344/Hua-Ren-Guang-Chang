import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  AD_MAX_DURATION_DAYS,
  AD_MIN_DURATION_DAYS,
  formatAmountCents,
  getAdDurationDays,
  getAdPurchaseAmountCents,
  getStripeClient,
  resolveBaseUrl,
} from '@/lib/stripePayments'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const { id } = await params

  const ad = await prisma.ad.findFirst({ where: { id, userId } })
  if (!ad) {
    return NextResponse.json({ error: '不存在' }, { status: 404 })
  }
  if (ad.paymentStatus !== 'COMPLETED') {
    return NextResponse.json({ error: '广告尚未完成首笔支付，暂不可续费' }, { status: 400 })
  }

  const durationDays = Math.min(
    AD_MAX_DURATION_DAYS,
    Math.max(AD_MIN_DURATION_DAYS, getAdDurationDays(ad.startAt, ad.endAt)),
  )
  const renewalStart = ad.endAt > new Date() ? ad.endAt : new Date()
  const renewalEnd = new Date(renewalStart.getTime() + durationDays * 24 * 60 * 60 * 1000)
  const amountCents = getAdPurchaseAmountCents(ad.placement, durationDays)
  const payment = await prisma.payment.create({
    data: {
      userId,
      kind: 'AD_RENEW',
      amountCents,
      currency: 'usd',
      description: `${ad.placement} 广告续费 ${durationDays} 天`,
      adId: ad.id,
      placement: ad.placement,
      startAt: renewalStart,
      endAt: renewalEnd,
    },
  })

  const stripe = getStripeClient()
  const baseUrl = resolveBaseUrl(req)
  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: '广告位续费',
            description: `${ad.placement} · 续费 ${durationDays} 天 · ${formatAmountCents(amountCents)}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${baseUrl}/merchant?renewed=1&adId=${encodeURIComponent(ad.id)}`,
    cancel_url: `${baseUrl}/merchant?checkout=cancelled&kind=ad_renew`,
    metadata: {
      checkoutKind: 'AD_RENEW',
      paymentId: payment.id,
      adId: ad.id,
      placement: ad.placement,
      userId,
    },
  })

  await prisma.payment.update({
    where: { id: payment.id },
    data: { stripeSessionId: checkoutSession.id },
  })

  return NextResponse.json({
    success: true,
    url: checkoutSession.url,
  })
}
