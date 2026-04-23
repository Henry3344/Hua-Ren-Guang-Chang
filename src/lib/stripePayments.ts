import Stripe from 'stripe'
import { getSiteUrl } from '@/lib/site'

export const STRIPE_API_VERSION: Stripe.LatestApiVersion = '2026-03-25.dahlia'

export const POST_PIN_AMOUNT_CENTS = 999
export const POST_PIN_DURATION_DAYS = 30
export const MERCHANT_APPLY_AMOUNT_CENTS = 4900
export const AD_MIN_DURATION_DAYS = 1
export const AD_MAX_DURATION_DAYS = 90

const AD_DAILY_RATE_CENTS: Record<string, number> = {
  HOME_TOP: 399,
  HOME_MIDDLE: 299,
  HOME_BOTTOM: 219,
  CATEGORY_TOP: 259,
  CATEGORY_BOTTOM: 189,
  POST_TOP: 199,
  POST_BOTTOM: 149,
  INLINE_FEED: 249,
  AI_ASSISTANT_SPONSOR: 129,
}

export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('缺少 STRIPE_SECRET_KEY')
  }
  return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION })
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    throw new Error('缺少 STRIPE_WEBHOOK_SECRET')
  }
  return secret
}

export function resolveBaseUrl(req: Request): string {
  const origin = req.headers.get('origin')?.trim()
  if (origin) return origin.replace(/\/$/, '')
  try {
    return new URL(req.url).origin.replace(/\/$/, '')
  } catch {
    return getSiteUrl()
  }
}

export function getAdDurationDays(startAt: Date, endAt: Date): number {
  const diffMs = endAt.getTime() - startAt.getTime()
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000))
}

export function getAdPlacementPricePerDayCents(placement: string): number {
  if (placement.startsWith('HOME_TOP')) return AD_DAILY_RATE_CENTS.HOME_TOP
  if (placement.startsWith('HOME_MIDDLE')) return AD_DAILY_RATE_CENTS.HOME_MIDDLE
  if (placement.startsWith('HOME_BOTTOM')) return AD_DAILY_RATE_CENTS.HOME_BOTTOM
  if (placement.startsWith('CATEGORY_TOP')) return AD_DAILY_RATE_CENTS.CATEGORY_TOP
  if (placement.startsWith('CATEGORY_BOTTOM')) return AD_DAILY_RATE_CENTS.CATEGORY_BOTTOM
  if (placement.startsWith('POST_TOP')) return AD_DAILY_RATE_CENTS.POST_TOP
  if (placement.startsWith('POST_BOTTOM')) return AD_DAILY_RATE_CENTS.POST_BOTTOM
  if (placement === 'INLINE_FEED') return AD_DAILY_RATE_CENTS.INLINE_FEED
  if (placement === 'AI_ASSISTANT_SPONSOR') return AD_DAILY_RATE_CENTS.AI_ASSISTANT_SPONSOR
  throw new Error('未知广告位定价：' + placement)
}

export function getAdPurchaseAmountCents(placement: string, durationDays: number): number {
  return getAdPlacementPricePerDayCents(placement) * durationDays
}

export function formatAmountCents(amountCents: number): string {
  return `$${(amountCents / 100).toFixed(2)}`
}
