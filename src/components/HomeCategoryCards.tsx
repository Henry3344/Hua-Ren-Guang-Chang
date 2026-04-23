'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight, Home, Briefcase, ShoppingBag, Store } from 'lucide-react'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import { locationToQuery } from '@/lib/locationPrefs'
import { HOME_SUBS, MERCHANT_CATEGORY_CHIPS } from '@/lib/homeCategorySubs'

function formatCount(n: number) {
  return String(n)
}

function buildPostsHref(qsBase: string, category: string, sub?: string) {
  const p = new URLSearchParams(qsBase)
  p.set('category', category)
  if (sub) p.set('sub', sub)
  return '/posts?' + p.toString()
}

function SubChip({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-md border border-border/80 bg-background/80 px-2.5 py-1 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
    >
      {children}
    </Link>
  )
}

/** 标签最多约四行，超出裁切；右下角「全部」与商家黄页同款 */
function CategoryChipsWithAll({
  allHref,
  children,
  linkClassName,
}: {
  allHref: string
  children: ReactNode
  linkClassName: string
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-x-2 sm:gap-y-2">
      <div className="relative min-h-0 min-w-0 flex-1">
        <div className="max-h-[9rem] overflow-hidden">
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-7 bg-gradient-to-t from-muted/25 to-transparent"
          aria-hidden
        />
      </div>
      <Link
        href={allHref}
        className={
          'inline-flex shrink-0 items-center gap-0.5 self-end text-xs sm:text-sm hover:underline font-medium ' +
          linkClassName
        }
      >
        全部
        <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden />
      </Link>
    </div>
  )
}

function CategoryCardFrame({
  Icon,
  watermark,
  headerBgClass,
  watermarkClass,
  iconClass,
  children,
  chips,
}: {
  Icon: LucideIcon
  watermark: string
  headerBgClass: string
  watermarkClass: string
  iconClass: string
  children: ReactNode
  chips: ReactNode
}) {
  return (
    <div className="group rounded-xl border overflow-hidden flex flex-col min-h-0 bg-card shadow-sm">
      <div
        className={
          'relative overflow-hidden px-3 pt-3 pb-3 sm:px-4 sm:pt-4 sm:pb-3 min-h-[6.75rem] sm:min-h-[7.25rem] ' +
          headerBgClass
        }
      >
        <span
          className={
            'pointer-events-none absolute -right-1 top-1/2 -translate-y-1/2 text-[3.25rem] sm:text-[4rem] font-black leading-none select-none tracking-tighter ' +
            watermarkClass
          }
          aria-hidden
        >
          {watermark}
        </span>
        <Icon
          className={
            'pointer-events-none absolute -bottom-2 -right-1 w-[6.5rem] h-[6.5rem] sm:w-[7.5rem] sm:h-[7.5rem] opacity-[0.22] transition-transform duration-300 ease-out group-hover:scale-110 group-hover:opacity-[0.3] ' +
            iconClass
          }
          strokeWidth={1.15}
          aria-hidden
        />
        <div className="relative z-10">{children}</div>
      </div>
      <div className="p-3 sm:p-3 flex flex-col gap-0 bg-muted/25 border-t border-border/60 min-h-0">
        {chips}
      </div>
    </div>
  )
}

export default function HomeCategoryCards() {
  const { pref, ready } = useSiteLocation()
  const [counts, setCounts] = useState<Record<string, number>>({
    RENT: 0,
    RENT_SEEK: 0,
    JOB: 0,
    JOB_SEEK: 0,
    SECONDHAND: 0,
  })

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(locationToQuery(pref)).forEach(([k, v]) => p.set(k, v))
    return p.toString()
  }, [pref])

  useEffect(() => {
    if (!ready) return
    let cancelled = false
    fetch('/api/posts/counts?' + qs)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        const c = d.counts || {}
        setCounts({
          RENT: typeof c.RENT === 'number' ? c.RENT : 0,
          RENT_SEEK: typeof c.RENT_SEEK === 'number' ? c.RENT_SEEK : 0,
          JOB: typeof c.JOB === 'number' ? c.JOB : 0,
          JOB_SEEK: typeof c.JOB_SEEK === 'number' ? c.JOB_SEEK : 0,
          SECONDHAND: typeof c.SECONDHAND === 'number' ? c.SECONDHAND : 0,
        })
      })
      .catch(() => {})
    const t = window.setInterval(() => {
      fetch('/api/posts/counts?' + qs)
        .then((r) => r.json())
        .then((d) => {
          if (cancelled) return
          const c = d.counts || {}
          setCounts({
            RENT: typeof c.RENT === 'number' ? c.RENT : 0,
            RENT_SEEK: typeof c.RENT_SEEK === 'number' ? c.RENT_SEEK : 0,
            JOB: typeof c.JOB === 'number' ? c.JOB : 0,
            JOB_SEEK: typeof c.JOB_SEEK === 'number' ? c.JOB_SEEK : 0,
            SECONDHAND: typeof c.SECONDHAND === 'number' ? c.SECONDHAND : 0,
          })
        })
        .catch(() => {})
    }, 30000)
    return () => {
      cancelled = true
      window.clearInterval(t)
    }
  }, [qs, ready])

  const rentTotal = (counts.RENT || 0) + (counts.RENT_SEEK || 0)
  const jobTotal = (counts.JOB || 0) + (counts.JOB_SEEK || 0)

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <CategoryCardFrame
          Icon={Home}
          watermark="RENT"
          headerBgClass="bg-gradient-to-br from-sky-200/88 via-sky-100/75 to-blue-50/90"
          watermarkClass="text-sky-900/[0.07]"
          iconClass="text-sky-600"
          chips={
            <CategoryChipsWithAll allHref={buildPostsHref(qs, 'RENT')} linkClassName="text-sky-900/90">
              {HOME_SUBS.RENT.map((sub) => (
                <SubChip key={`r-${sub}`} href={buildPostsHref(qs, 'RENT', sub)}>
                  {sub}
                </SubChip>
              ))}
            </CategoryChipsWithAll>
          }
        >
          <Link
            href={buildPostsHref(qs, 'RENT')}
            className="font-semibold text-base leading-tight hover:underline underline-offset-4 text-sky-950 drop-shadow-sm"
          >
            租房 / 找房 · {formatCount(rentTotal)}条
          </Link>
        </CategoryCardFrame>

        <CategoryCardFrame
          Icon={Briefcase}
          watermark="JOB"
          headerBgClass="bg-gradient-to-br from-emerald-200/88 via-emerald-100/75 to-green-50/90"
          watermarkClass="text-emerald-900/[0.07]"
          iconClass="text-emerald-600"
          chips={
            <CategoryChipsWithAll allHref={buildPostsHref(qs, 'JOB')} linkClassName="text-emerald-900/90">
              {HOME_SUBS.JOB.map((sub) => (
                <SubChip key={`j-${sub}`} href={buildPostsHref(qs, 'JOB', sub)}>
                  {sub}
                </SubChip>
              ))}
            </CategoryChipsWithAll>
          }
        >
          <Link
            href={buildPostsHref(qs, 'JOB')}
            className="font-semibold text-base leading-tight hover:underline underline-offset-4 text-emerald-950 drop-shadow-sm"
          >
            招聘 / 找工 · {formatCount(jobTotal)}条
          </Link>
        </CategoryCardFrame>

        <CategoryCardFrame
          Icon={ShoppingBag}
          watermark="USED"
          headerBgClass="bg-gradient-to-br from-fuchsia-200/88 via-pink-100/75 to-violet-50/90"
          watermarkClass="text-fuchsia-900/[0.07]"
          iconClass="text-fuchsia-600"
          chips={
            <CategoryChipsWithAll allHref={buildPostsHref(qs, 'SECONDHAND')} linkClassName="text-fuchsia-900/90">
              {HOME_SUBS.SECONDHAND.map((sub) => (
                <SubChip key={sub} href={buildPostsHref(qs, 'SECONDHAND', sub)}>
                  {sub}
                </SubChip>
              ))}
            </CategoryChipsWithAll>
          }
        >
          <Link
            href={buildPostsHref(qs, 'SECONDHAND')}
            className="font-semibold text-base leading-tight hover:underline underline-offset-4 text-fuchsia-950 drop-shadow-sm"
          >
            二手 · {formatCount(counts.SECONDHAND || 0)}条
          </Link>
        </CategoryCardFrame>

        <CategoryCardFrame
          Icon={Store}
          watermark="SHOP"
          headerBgClass="bg-gradient-to-br from-amber-200/88 via-yellow-100/75 to-orange-50/90"
          watermarkClass="text-amber-900/[0.07]"
          iconClass="text-amber-800"
          chips={
            <CategoryChipsWithAll allHref="/yellowpages" linkClassName="text-amber-900/90">
              {MERCHANT_CATEGORY_CHIPS.map((cat) => (
                <Link
                  key={cat}
                  href={cat ? `/yellowpages?category=${encodeURIComponent(cat)}` : '/yellowpages'}
                  className="inline-flex items-center rounded-md border border-border/80 bg-background/80 px-2.5 py-1 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {cat}
                </Link>
              ))}
            </CategoryChipsWithAll>
          }
        >
          <Link
            href="/yellowpages"
            className="font-semibold text-base leading-tight hover:underline underline-offset-4 text-amber-950 drop-shadow-sm"
          >
            商家黄页
          </Link>
        </CategoryCardFrame>
      </div>
    </div>
  )
}
