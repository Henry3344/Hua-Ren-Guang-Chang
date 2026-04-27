'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import PostCard from '@/components/PostCard'
import { Button } from '@/components/ui/button'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import { buildHomeRecQuery } from '@/lib/homeFeedParams'
import { stablePostsQueryKey } from '@/lib/buildPostsListParams'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'

const AUTO_MS = 5000

type HomeRecommendationsProps = {
  initialPosts?: AiRagPostCard[]
  serverQueryKey?: string
}

export default function HomeRecommendations({
  initialPosts,
  serverQueryKey,
}: HomeRecommendationsProps = {}) {
  const { pref, ready } = useSiteLocation()
  const [loading, setLoading] = useState(true)
  const [posts, setPosts] = useState<AiRagPostCard[]>(initialPosts ?? [])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [noTransition, setNoTransition] = useState(false)
  const indexRef = useRef(0)
  useEffect(() => {
    indexRef.current = index
  }, [index])

  const items = useMemo(
    () => posts.filter((p) => Array.isArray(p.images) && p.images.length > 0),
    [posts],
  )

  const n = items.length

  const slides = useMemo(() => {
    if (n <= 0) return []
    if (n === 1) return [items[0], items[0]]
    return [...items, items[0]]
  }, [items, n])

  const slideCount = slides.length
  /** 轨道总宽 = slideCount × 视口宽；translate 用「轨道宽度」的百分比，避免 w-full 在横向 flex 里算错导致露白 */
  const trackPct = slideCount * 100
  const slidePct = slideCount > 0 ? 100 / slideCount : 0

  const qs = useMemo(() => buildHomeRecQuery(pref).toString(), [pref])

  useEffect(() => {
    if (initialPosts === undefined) return
    queueMicrotask(() => setPosts(initialPosts))
  }, [initialPosts])

  useEffect(() => {
    if (!ready) return
    const params = buildHomeRecQuery(pref)
    if (
      serverQueryKey &&
      stablePostsQueryKey(params) === serverQueryKey &&
      initialPosts !== undefined
    ) {
      queueMicrotask(() => {
        setPosts(initialPosts)
        setLoading(false)
      })
      return
    }
    queueMicrotask(() => setLoading(true))
    fetch('/api/posts/recommendations?' + qs)
      .then((r) => r.json())
      .then((d) => setPosts((d.posts || []) as AiRagPostCard[]))
      .finally(() => setLoading(false))
  }, [qs, ready, serverQueryKey, initialPosts, pref])

  useEffect(() => {
    queueMicrotask(() => setIndex(0))
  }, [qs, n])

  /** 无缝循环：从最后一条滑到首条的克隆，再在 transition 结束后瞬移回 index 0 */
  useEffect(() => {
    if (!noTransition) return
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setNoTransition(false))
    })
    return () => cancelAnimationFrame(id)
  }, [noTransition])

  /** 首张的克隆在末尾，下标恒为 n（slides 长度为 n+1） */
  const cloneIndex = n

  const goForward = useCallback(() => {
    if (n <= 0) return
    if (n === 1) {
      setIndex((i) => (i === 0 ? 1 : i))
      return
    }
    setIndex((i) => {
      // 如果因为某些原因没有触发 transitionend，可能停在克隆页（index === n）
      // 继续 +1 会跑到轨道外导致白屏，所以这里兜底复位到真实第 2 页（index=1）
      if (i >= cloneIndex) {
        setNoTransition(true)
        return 1
      }
      return i === n - 1 ? cloneIndex : i + 1
    })
  }, [n, cloneIndex])

  const goBack = useCallback(() => {
    if (n <= 0) return
    setIndex((i) => {
      // 兜底：如果停在克隆页，先当作在真实第 1 页（index=0）来处理“上一条”
      if (i >= cloneIndex) {
        setNoTransition(true)
        return n - 1
      }
      if (i === 0) {
        setNoTransition(true)
        return n === 1 ? 1 : n - 1
      }
      return i - 1
    })
  }, [n, cloneIndex])

  const handleTrackTransitionEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return
      if (e.propertyName !== 'transform') return
      if (n < 1) return
      if (indexRef.current !== cloneIndex) return
      setNoTransition(true)
      setIndex(0)
    },
    [n, cloneIndex],
  )

  useEffect(() => {
    if (!playing || n < 1) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const t = window.setInterval(goForward, AUTO_MS)
    return () => window.clearInterval(t)
  }, [playing, n, goForward])

  if (!ready || loading) {
    return (
      <div className="w-full min-w-0 flex flex-col">
        <div className="flex items-center justify-between mb-3 gap-2">
          <div className="text-lg font-semibold">猜你喜欢</div>
          <div className="text-xs text-muted-foreground">按当前地区推荐</div>
        </div>
        <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="w-full min-w-0 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
          <div className="text-lg font-semibold">猜你喜欢</div>
          <Link href="/posts" className="text-xs text-muted-foreground hover:text-foreground">
            浏览更多
          </Link>
        </div>

        <div className="relative flex min-h-[320px] flex-1 items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <div>
            <p className="text-sm font-medium text-foreground">当前没有帖子可供展示</p>
            <p className="mt-2 text-xs text-muted-foreground">可以切换地区、浏览全部，或发布第一条信息。</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
        <div className="text-lg font-semibold">猜你喜欢</div>
        <Link href="/posts" className="text-xs text-muted-foreground hover:text-foreground">
          浏览更多
        </Link>
      </div>

      <div className="relative w-full overflow-hidden rounded-2xl border bg-card flex-1 min-h-0">
        <div
          className={
            'flex flex-row ' +
            (noTransition
              ? 'transition-none'
              : 'transition-transform duration-500 ease-out motion-reduce:transition-none')
          }
          style={{
            width: `${trackPct}%`,
            transform: `translateX(-${(index * 100) / slideCount}%)`,
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {slides.map((post, slideIdx) => (
            <div
              key={`${post.id}-${slideIdx}`}
              className="shrink-0 box-border px-3 py-3 sm:px-4 sm:py-4"
              style={{ width: `${slidePct}%` }}
            >
              <PostCard post={post} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="上一条"
          onClick={goBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="下一条"
          onClick={goForward}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 min-w-[5.5rem]"
          onClick={() => setPlaying((p) => !p)}
          aria-pressed={playing}
          aria-label={playing ? '暂停自动播放' : '开始自动播放'}
        >
          {playing ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              暂停
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              播放
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
