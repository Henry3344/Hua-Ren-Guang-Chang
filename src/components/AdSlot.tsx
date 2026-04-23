'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CircleHelp, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPlacementLabel, pairPlacements, type AdBannerPairBase } from '@/lib/adConstants'

export type AdRecord = {
  id: string
  type: string
  placement: string
  targetUrl: string | null
  postId: string | null
  post?: {
    id: string
    title: string
    images: string[]
    category: string
    status: string
  } | null
}

export function AdDisplay({
  ad,
  variant = 'banner',
  className = '',
}: {
  ad: AdRecord
  variant?: 'banner' | 'inline' | 'compact'
  className?: string
}) {
  const router = useRouter()
  const impressionSent = useRef(false)

  useEffect(() => {
    if (impressionSent.current) return
    impressionSent.current = true
    fetch('/api/ads/' + ad.id + '/impression', { method: 'POST' }).catch(() => {})
  }, [ad.id])

  const handleClick = useCallback(() => {
    fetch('/api/ads/' + ad.id + '/click', { method: 'POST' }).catch(() => {})
    let href = ''
    if (ad.type === 'PINNED' && ad.postId) {
      href = '/posts/' + ad.postId
    } else if (ad.targetUrl) {
      href = ad.targetUrl
    }
    if (!href) return
    if (href.startsWith('http://') || href.startsWith('https://')) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      router.push(href)
    }
  }, [ad, router])

  const title =
    ad.type === 'PINNED' && ad.post?.title
      ? ad.post.title
      : ad.targetUrl
        ? '推广链接'
        : '推广'

  /** 各 variant 统一为与首页置顶位相同的尺寸与结构（左侧 80×80 + 文案区） */
  const inner = (
    <div className="flex items-start gap-3">
      {ad.post?.images?.[0] && ad.type === 'PINNED' ? (
        <img src={ad.post.images[0]} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Megaphone className="h-8 w-8 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium line-clamp-2">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">赞助内容 · 广告</p>
      </div>
    </div>
  )

  const borderClass =
    variant === 'banner'
      ? 'border rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 p-3 sm:p-4 hover:border-primary/40 transition-colors'
      : 'border rounded-xl bg-card p-3 sm:p-4 hover:border-primary/40 transition-colors'

  return (
    <button
      type="button"
      onClick={handleClick}
      className={borderClass + ' w-full text-left ' + className}
    >
      {inner}
    </button>
  )
}

function AdWhyLink({ iconClass = 'w-4 h-4' }: { iconClass?: string }) {
  return (
    <Link
      href="/advertising"
      className="inline-flex shrink-0 items-center justify-center text-muted-foreground hover:text-primary transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      title="为什么要在本网站投广告？"
      aria-label="为什么要在本网站投广告？查看说明"
      onClick={(e) => e.stopPropagation()}
    >
      <CircleHelp className={iconClass} strokeWidth={2} />
    </Link>
  )
}

/** 与首页置顶位（inline）同一套招租框尺寸与布局；compact 用于双列横幅半宽 */
function AdPlaceholder({
  placement,
  className = '',
  compact = false,
}: {
  placement: string
  className?: string
  compact?: boolean
}) {
  const label = getPlacementLabel(placement)
  const href = `/merchant?placement=${encodeURIComponent(placement)}`

  if (compact) {
    return (
      <div
        className={
          'rounded-xl border border-dashed border-primary/25 bg-muted/20 p-2.5 sm:p-3 min-w-0 ' +
          className
        }
      >
        <div className="flex w-full min-w-0 flex-col gap-3 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <div className="min-w-0 flex-1 flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground leading-snug flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span>此广告位招租</span>
              <AdWhyLink />
            </p>
            <p className="text-xs leading-snug text-muted-foreground">{label}</p>
          </div>
          <Button asChild size="sm" className="shrink-0 text-sm h-9 w-full sm:w-auto">
            <Link href={href}>申请在此展示广告</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        'flex flex-col gap-3 rounded-xl border border-dashed border-primary/25 bg-muted/20 p-3 sm:flex-row sm:items-center sm:p-4 ' +
        className
      }
    >
      <div className="flex h-20 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-primary/30 bg-primary/5 text-sm font-medium text-muted-foreground sm:w-28">
        横幅
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-base font-medium text-foreground flex flex-wrap items-center gap-x-1 gap-y-0.5">
          <span>此广告位招租</span>
          <AdWhyLink iconClass="w-[1.125rem] h-[1.125rem]" />
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>
      <Button asChild className="w-full shrink-0 sm:w-auto">
        <Link href={href}>申请在此展示广告</Link>
      </Button>
    </div>
  )
}

function AdSlotInner({
  placement,
  className = '',
  variant = 'banner',
  compact = false,
}: {
  placement: string
  className?: string
  variant?: 'banner' | 'inline' | 'compact'
  compact?: boolean
}) {
  const [ad, setAd] = useState<AdRecord | null>(null)
  const [resolved, setResolved] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/ads?placement=' + encodeURIComponent(placement))
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const list = (d.ads || []) as AdRecord[]
        if (list.length > 0) {
          setAd(list[Math.floor(Math.random() * list.length)])
        } else {
          setAd(null)
        }
      })
      .catch(() => {
        if (!cancelled) setAd(null)
      })
      .finally(() => {
        if (!cancelled) setResolved(true)
      })
    return () => {
      cancelled = true
    }
  }, [placement])

  if (!resolved) return null
  if (ad) return <AdDisplay ad={ad} variant={variant} className={className} />
  return <AdPlaceholder placement={placement} className={className} compact={compact} />
}

export function AdSlot(props: {
  placement: string
  className?: string
  variant?: 'banner' | 'inline' | 'compact'
  compact?: boolean
}) {
  return <AdSlotInner key={props.placement} {...props} />
}

/** 同一横幅位左右各半，独立投放 key（*_LEFT / *_RIGHT） */
export function AdSlotPair({
  base,
  className = '',
  variant = 'banner',
}: {
  base: AdBannerPairBase
  className?: string
  variant?: 'banner' | 'inline' | 'compact'
}) {
  const [left, right] = pairPlacements(base)
  return (
    <div className={'grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0 ' + className}>
      <AdSlot placement={left} variant={variant} compact />
      <AdSlot placement={right} variant={variant} compact />
    </div>
  )
}
