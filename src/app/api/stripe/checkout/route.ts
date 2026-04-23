import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  AD_MAX_DURATION_DAYS,
  AD_MIN_DURATION_DAYS,
  MERCHANT_APPLY_AMOUNT_CENTS,
  POST_PIN_AMOUNT_CENTS,
  POST_PIN_DURATION_DAYS,
  formatAmountCents,
  getAdDurationDays,
  getAdPurchaseAmountCents,
  getStripeClient,
  resolveBaseUrl,
} from '@/lib/stripePayments'

const PIN_TRIAL_HOURS = 5 as const

type CheckoutRequest =
  | { kind?: 'POST_PIN'; postId: string }
  | { kind: 'MERCHANT_APPLY'; merchantId: string }
  | { kind: 'AD_PURCHASE'; adId: string }
  | { kind: 'AD_RENEW'; adId: string }

function getRequestKind(body: CheckoutRequest): 'POST_PIN' | 'MERCHANT_APPLY' | 'AD_PURCHASE' | 'AD_RENEW' {
  if (!body.kind) return 'POST_PIN'
  return body.kind
}

export async function POST(req: Request) {
  try {
    const stripe = getStripeClient()
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

    const userId = (session.user as { id?: string } | undefined)?.id
    if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })

    const body = (await req.json()) as CheckoutRequest
    const kind = getRequestKind(body)
    const baseUrl = resolveBaseUrl(req)

    if (kind === 'POST_PIN') {
      if (!('postId' in body)) {
        return NextResponse.json({ error: '缺少 postId' }, { status: 400 })
      }
      const postId = body.postId
      const post = await prisma.post.findUnique({ where: { id: postId } })
      if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 })
      if (post.userId !== userId) {
        return NextResponse.json({ error: '无权限' }, { status: 403 })
      }
      if (post.isPinned) {
        return NextResponse.json({ error: '该帖子已在置顶中' }, { status: 400 })
      }

      const account = await prisma.user.findUnique({
        where: { id: userId },
        select: { freePinCredits: true, pinTrialUsedAt: true, isDeleted: true, isBanned: true },
      })
      if (!account || account.isDeleted || account.isBanned) {
        return NextResponse.json({ error: '账号状态异常' }, { status: 403 })
      }

      if (!account.pinTrialUsedAt) {
        const expiresAt = new Date(Date.now() + PIN_TRIAL_HOURS * 60 * 60 * 1000)
        const ok = await prisma.$transaction(async (tx) => {
          const mark = await tx.user.updateMany({
            where: { id: userId, pinTrialUsedAt: null },
            data: { pinTrialUsedAt: new Date() },
          })
          if (mark.count !== 1) return false
          await tx.post.update({
            where: { id: postId },
            data: { isPinned: true, expiresAt },
          })
          return true
        })
        if (ok) {
          return NextResponse.json({
            pinned: true,
            free: true,
            freeType: 'trial',
            freeHours: PIN_TRIAL_HOURS,
            expiresAt: expiresAt.toISOString(),
          })
        }
      }

      if ((account.freePinCredits ?? 0) > 0) {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const ok = await prisma.$transaction(async (tx) => {
          const dec = await tx.user.updateMany({
            where: { id: userId, freePinCredits: { gt: 0 } },
            data: { freePinCredits: { decrement: 1 } },
          })
          if (dec.count !== 1) return false
          await tx.post.update({
            where: { id: postId },
            data: { isPinned: true, expiresAt },
          })
          return true
        })
        if (ok) {
          return NextResponse.json({
            pinned: true,
            free: true,
            freeType: 'credit',
            freeDays: 1,
            expiresAt: expiresAt.toISOString(),
          })
        }
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          kind: 'POST_PIN',
          amountCents: POST_PIN_AMOUNT_CENTS,
          currency: 'usd',
          description: `帖子置顶 ${POST_PIN_DURATION_DAYS} 天：${post.title}`,
          postId,
        },
      })

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `置顶服务 - ${POST_PIN_DURATION_DAYS}天`,
                description: '帖子：' + post.title,
              },
              unit_amount: POST_PIN_AMOUNT_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/dashboard?pinned=1&paid=1`,
        cancel_url: `${baseUrl}/dashboard?checkout=cancelled&kind=post_pin`,
        metadata: {
          checkoutKind: 'POST_PIN',
          paymentId: payment.id,
          postId,
          userId,
        },
      })

      await prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: checkoutSession.id },
      })

      return NextResponse.json({ url: checkoutSession.url })
    }

    if (kind === 'MERCHANT_APPLY') {
      if (!('merchantId' in body)) {
        return NextResponse.json({ error: '缺少 merchantId' }, { status: 400 })
      }
      const merchant = await prisma.merchant.findFirst({
        where: { id: body.merchantId, userId },
      })
      if (!merchant) {
        return NextResponse.json({ error: '商家申请不存在' }, { status: 404 })
      }
      if (merchant.paymentStatus === 'COMPLETED') {
        return NextResponse.json({ error: '该申请已完成支付' }, { status: 400 })
      }

      const payment = await prisma.payment.create({
        data: {
          userId,
          kind: 'MERCHANT_APPLY',
          amountCents: MERCHANT_APPLY_AMOUNT_CENTS,
          currency: 'usd',
          description: `商家入驻审核费：${merchant.companyName}`,
          merchantId: merchant.id,
        },
      })

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '商家入驻审核费',
                description: merchant.companyName,
              },
              unit_amount: MERCHANT_APPLY_AMOUNT_CENTS,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/merchant?merchantPaid=1`,
        cancel_url: `${baseUrl}/merchant/apply?checkout=cancelled`,
        metadata: {
          checkoutKind: 'MERCHANT_APPLY',
          paymentId: payment.id,
          merchantId: merchant.id,
          userId,
        },
      })

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { stripeSessionId: checkoutSession.id },
        }),
        prisma.merchant.update({
          where: { id: merchant.id },
          data: {
            paymentStatus: 'PENDING',
            stripeSessionId: checkoutSession.id,
            status: 'PENDING_PAYMENT',
          },
        }),
      ])

      return NextResponse.json({ url: checkoutSession.url })
    }

    if (!('adId' in body)) {
      return NextResponse.json({ error: '缺少 adId' }, { status: 400 })
    }

    const ad = await prisma.ad.findFirst({
      where: { id: body.adId, userId },
    })
    if (!ad) {
      return NextResponse.json({ error: '广告不存在' }, { status: 404 })
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId },
      select: { id: true, status: true, paymentStatus: true },
    })
    if (!merchant || merchant.status !== 'APPROVED' || merchant.paymentStatus !== 'COMPLETED') {
      return NextResponse.json({ error: '请先完成商家入驻并通过审核' }, { status: 403 })
    }

    if (kind === 'AD_PURCHASE') {
      if (ad.paymentStatus === 'COMPLETED') {
        return NextResponse.json({ error: '该广告已支付' }, { status: 400 })
      }
      const durationDays = getAdDurationDays(ad.startAt, ad.endAt)
      if (durationDays < AD_MIN_DURATION_DAYS || durationDays > AD_MAX_DURATION_DAYS) {
        return NextResponse.json({ error: `广告投放时长需在 ${AD_MIN_DURATION_DAYS}-${AD_MAX_DURATION_DAYS} 天之间` }, { status: 400 })
      }
      const amountCents = getAdPurchaseAmountCents(ad.placement, durationDays)
      const payment = await prisma.payment.create({
        data: {
          userId,
          kind: 'AD_PURCHASE',
          amountCents,
          currency: 'usd',
          description: `${ad.placement} 广告位购买 ${durationDays} 天`,
          adId: ad.id,
          placement: ad.placement,
          startAt: ad.startAt,
          endAt: ad.endAt,
        },
      })

      const checkoutSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: '广告位投放',
                description: `${ad.placement} · ${durationDays} 天 · ${formatAmountCents(amountCents)}`,
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/merchant?adPaid=1&adId=${encodeURIComponent(ad.id)}`,
        cancel_url: `${baseUrl}/merchant?checkout=cancelled&kind=ad_purchase`,
        metadata: {
          checkoutKind: 'AD_PURCHASE',
          paymentId: payment.id,
          adId: ad.id,
          placement: ad.placement,
          userId,
        },
      })

      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { stripeSessionId: checkoutSession.id },
        }),
        prisma.ad.update({
          where: { id: ad.id },
          data: {
            paymentStatus: 'PENDING',
            stripeSessionId: checkoutSession.id,
            isActive: false,
          },
        }),
      ])

      return NextResponse.json({ url: checkoutSession.url })
    }

    if (ad.paymentStatus !== 'COMPLETED') {
      return NextResponse.json({ error: '广告尚未完成首笔支付，暂不可续费' }, { status: 400 })
    }

    const currentDurationDays = Math.min(
      AD_MAX_DURATION_DAYS,
      Math.max(AD_MIN_DURATION_DAYS, getAdDurationDays(ad.startAt, ad.endAt)),
    )
    const renewalStart = ad.endAt > new Date() ? ad.endAt : new Date()
    const renewalEnd = new Date(renewalStart.getTime() + currentDurationDays * 24 * 60 * 60 * 1000)
    const renewalAmountCents = getAdPurchaseAmountCents(ad.placement, currentDurationDays)

    const payment = await prisma.payment.create({
      data: {
        userId,
        kind: 'AD_RENEW',
        amountCents: renewalAmountCents,
        currency: 'usd',
        description: `${ad.placement} 广告续费 ${currentDurationDays} 天`,
        adId: ad.id,
        placement: ad.placement,
        startAt: renewalStart,
        endAt: renewalEnd,
      },
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: '广告位续费',
              description: `${ad.placement} · 续费 ${currentDurationDays} 天 · ${formatAmountCents(renewalAmountCents)}`,
            },
            unit_amount: renewalAmountCents,
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

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err: unknown) {
    console.error('Stripe error:', err)
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err && 'message' in err
          ? String((err as { message: unknown }).message)
          : ''
    return NextResponse.json({ error: message || 'Stripe 错误' }, { status: 500 })
  }
}
