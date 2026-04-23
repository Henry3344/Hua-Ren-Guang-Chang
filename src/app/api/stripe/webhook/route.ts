import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import {
  POST_PIN_DURATION_DAYS,
  getStripeWebhookSecret,
  getStripeClient,
} from '@/lib/stripePayments'

async function markPaymentStatus(session: Stripe.Checkout.Session, status: 'FAILED' | 'CANCELED' | 'EXPIRED') {
  const paymentId = session.metadata?.paymentId
  if (!paymentId) return
  await prisma.payment.updateMany({
    where: { id: paymentId, fulfilledAt: null },
    data: { status },
  })
}

async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const paymentId = session.metadata?.paymentId
  if (!paymentId) return

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  })
  if (!payment || payment.fulfilledAt) return

  await prisma.$transaction(async (tx) => {
    const lock = await tx.payment.updateMany({
      where: { id: payment.id, fulfilledAt: null },
      data: {
        status: 'COMPLETED',
        fulfilledAt: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === 'string' ? session.payment_intent : payment.stripePaymentIntentId,
        stripeCustomerEmail: session.customer_details?.email || payment.stripeCustomerEmail,
      },
    })
    if (lock.count !== 1) return

    if (payment.kind === 'POST_PIN' && payment.postId) {
      const expiresAt = new Date(Date.now() + POST_PIN_DURATION_DAYS * 24 * 60 * 60 * 1000)
      await tx.post.updateMany({
        where: { id: payment.postId, userId: payment.userId },
        data: { isPinned: true, expiresAt },
      })
      return
    }

    if (payment.kind === 'MERCHANT_APPLY' && payment.merchantId) {
      await tx.merchant.updateMany({
        where: { id: payment.merchantId, userId: payment.userId },
        data: {
          paymentStatus: 'COMPLETED',
          paidAt: new Date(),
          submittedAt: new Date(),
          status: 'PENDING',
          stripeSessionId: session.id,
        },
      })
      return
    }

    if (payment.kind === 'AD_PURCHASE' && payment.adId) {
      await tx.ad.updateMany({
        where: { id: payment.adId, userId: payment.userId },
        data: {
          paymentStatus: 'COMPLETED',
          paidAt: new Date(),
          isActive: true,
          stripeSessionId: session.id,
        },
      })
      return
    }

    if (payment.kind === 'AD_RENEW' && payment.adId && payment.endAt) {
      await tx.ad.updateMany({
        where: { id: payment.adId, userId: payment.userId },
        data: {
          paymentStatus: 'COMPLETED',
          paidAt: new Date(),
          isActive: true,
          endAt: payment.endAt,
          stripeSessionId: session.id,
        },
      })
    }
  })
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    const client = getStripeClient()
    const webhookSecret = getStripeWebhookSecret()
    event = client.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook verification failed', error)
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as Stripe.Checkout.Session
    await fulfillCheckoutSession(session)
  }

  if (event.type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as Stripe.Checkout.Session
    await markPaymentStatus(session, 'FAILED')
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session
    await markPaymentStatus(session, 'EXPIRED')
  }

  return NextResponse.json({ received: true })
}
