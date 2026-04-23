'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MapPin, Clock, Eye, Pin, ImageIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { jobSeekPriceDisplay, rentSeekSubLabel } from '@/lib/postDisplay'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'

export type PostCardPost = AiRagPostCard & {
  description?: string | null
}

const categoryMap: Record<string, { label: string; color: string; bg: string }> = {
  RENT: { label: '租房', color: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/15 dark:text-sky-300', bg: 'bg-sky-500/5' },
  RENT_SEEK: { label: '找房', color: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/15 dark:text-sky-300', bg: 'bg-sky-500/5' },
  JOB: { label: '招聘', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-300', bg: 'bg-emerald-500/5' },
  JOB_SEEK: { label: '找工', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-300', bg: 'bg-emerald-500/5' },
  SECONDHAND: { label: '二手', color: 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300', bg: 'bg-amber-500/5' },
}

export default function PostCard({
  post,
  variant = 'default',
  linkTarget,
}: {
  post: PostCardPost
  variant?: 'default' | 'compact'
  /** 例：AI 对话里默认新标签打开，避免丢失对话 */
  linkTarget?: '_self' | '_blank'
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])

  const cat = categoryMap[post.category] || { label: post.category, color: '', bg: 'bg-gray-50' }

  const timeAgo = (date: string | Date) => {
    const diff = now - new Date(date).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return '刚刚'
    if (h < 24) return h + '小时前'
    return Math.floor(h / 24) + '天前'
  }

  const priceLabel = post.category === 'JOB'
    ? (post.price != null ? '$' + post.price + '/hr' : '面议')
    : post.category === 'JOB_SEEK'
      ? jobSeekPriceDisplay(post.price, post.jobSalaryUnit)
      : (post.price != null ? '$' + post.price.toLocaleString() : null)

  const imageCount = Array.isArray(post.images) ? post.images.length : 0
  const hasImage = imageCount > 0

  const linkRel = linkTarget === '_blank' ? 'noopener noreferrer' : undefined

  if (variant === 'compact') {
    return (
      <Link
        href={'/posts/' + post.id}
        className="block group h-full"
        target={linkTarget}
        rel={linkRel}
      >
        <div className="relative flex h-full min-h-[5.5rem] flex-row overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm shadow-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/10">
          {post.isPinned && (
            <div className="absolute top-0 right-0 z-10">
              <div className="w-0 h-0 border-l-[28px] border-l-transparent border-t-[28px] border-t-orange-500 rounded-tr-xl" />
              <Pin
                className="absolute top-0.5 right-0.5 w-2.5 h-2.5 text-white"
                style={{ transform: 'rotate(45deg)' }}
              />
            </div>
          )}
          {hasImage ? (
            <div className="relative aspect-[4/3] w-[6.75rem] shrink-0 overflow-hidden bg-muted/70 self-stretch sm:w-28">
              <img
                src={post.images[0]}
                alt={post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {imageCount >= 2 && (
                <span className="absolute bottom-1 left-1 z-10 inline-flex items-center gap-0.5 rounded bg-black/55 text-white text-[9px] font-medium px-1 py-0.5">
                  <ImageIcon className="w-2.5 h-2.5 opacity-90" />
                  {imageCount}
                </span>
              )}
            </div>
          ) : (
            <div className="flex w-[5.5rem] shrink-0 flex-col items-center justify-center gap-0.5 bg-muted/60 text-muted-foreground self-stretch sm:w-24">
              <div className="text-[12px] font-semibold tracking-wide text-foreground/80">华人</div>
              <div className="text-[12px] font-semibold tracking-wide text-foreground/80">广场</div>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-3.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={'rounded-full px-1.5 py-0.5 text-[10px] font-medium ' + cat.color}>
                {cat.label}
              </span>
              {post.isSponsored && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 h-4 border-amber-400/80 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-600/60"
                >
                  赞助推荐
                </Badge>
              )}
              {post.user?.merchant?.status === 'APPROVED' && (
                <Badge
                  variant="secondary"
                  className="text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-primary/20"
                >
                  商家
                </Badge>
              )}
              {post.subCategory && (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  {post.category === 'RENT_SEEK' ? rentSeekSubLabel(post.subCategory) : post.subCategory}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
              {post.title}
            </h3>
            {priceLabel && <div className="text-sm font-bold tabular-nums text-primary">{priceLabel}</div>}
            <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-0.5 border-t border-border/50 pt-1.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-0.5 min-w-0 max-w-[65%]">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{post.location}</span>
              </span>
              <span className="flex items-center gap-0.5 shrink-0 ml-auto">
                <Eye className="w-3 h-3" />
                {post.viewCount}
                <span className="mx-0.5">·</span>
                <Clock className="w-3 h-3" />
                {timeAgo(post.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={'/posts/' + post.id}
      className="block group h-full"
      target={linkTarget}
      rel={linkRel}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/95 shadow-sm shadow-black/5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/10">

        {post.isPinned && (
          <div className="absolute top-0 right-0 z-10">
            <div className="w-0 h-0 border-l-[40px] border-l-transparent border-t-[40px] border-t-orange-500 rounded-tr-xl" />
            <Pin className="absolute top-1 right-1 w-3 h-3 text-white" style={{transform: 'rotate(45deg)'}} />
          </div>
        )}

        {hasImage && (
          <div className="relative aspect-[16/9] overflow-hidden bg-muted/70">
            <img src={post.images[0]} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {imageCount >= 2 && (
              <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-0.5 rounded-md bg-black/55 text-white text-[10px] font-medium px-1.5 py-0.5 backdrop-blur-sm">
                <ImageIcon className="w-3 h-3 opacity-90" />
                {imageCount} 张
              </span>
            )}
          </div>
        )}

        <div className={(hasImage ? 'p-3.5 sm:p-[1.125rem]' : 'p-3.5') + ' flex flex-1 flex-col gap-2.5'}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + cat.color}>
              {cat.label}
            </span>
            {post.isSponsored && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 border-amber-400/80 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-600/60"
              >
                赞助推荐
              </Badge>
            )}
            {post.user?.merchant?.status === 'APPROVED' && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20">
                已认证商家
              </Badge>
            )}
            {post.subCategory && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {post.category === 'RENT_SEEK' ? rentSeekSubLabel(post.subCategory) : post.subCategory}
              </span>
            )}
          </div>

          <h3
            className={
              'font-semibold text-sm leading-snug group-hover:text-primary transition-colors ' +
              (hasImage ? 'line-clamp-2' : 'line-clamp-1')
            }
          >
            {post.title}
          </h3>

          {priceLabel && (
            <div className="text-base font-bold text-primary">{priceLabel}</div>
          )}

          {hasImage ? (
            <p className="text-muted-foreground text-xs line-clamp-1">{post.description}</p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{post.location}</span>
            </span>
            <span className="flex items-center gap-1 shrink-0">
              <Eye className="w-3 h-3" />{post.viewCount}
              <span className="mx-1">·</span>
              <Clock className="w-3 h-3" />{timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
