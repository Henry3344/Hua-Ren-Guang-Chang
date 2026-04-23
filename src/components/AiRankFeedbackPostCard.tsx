'use client'

import { useCallback, useEffect, useRef } from 'react'
import PostCard from '@/components/PostCard'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'

type Props = {
  post: AiRagPostCard
  position: number
  traceId: string
  onRankClick: () => number
}

/**
 * AI 推荐列表中的帖子卡片：上报曝光、停留、点击（用于排序学习与权重校准）。
 */
export default function AiRankFeedbackPostCard({ post, position, traceId, onRankClick }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const sentImp = useRef(false)
  const dwellTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const visibleRef = useRef(false)
  const accDwell = useRef(0)

  const send = useCallback(
    async (payload: Record<string, unknown>) => {
      try {
        await fetch('/api/ai-search/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ traceId, postId: post.id, position, ...payload }),
        })
      } catch {
        /* 埋点失败不影响浏览 */
      }
    },
    [traceId, post.id, position],
  )

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const ob = new IntersectionObserver(
      (entries) => {
        const vis = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.38)
        visibleRef.current = vis
        if (vis && !sentImp.current) {
          sentImp.current = true
          void send({ kind: 'impression' })
        }
        if (vis && !dwellTimer.current) {
          dwellTimer.current = setInterval(() => {
            if (!visibleRef.current) return
            accDwell.current += 10_000
            if (accDwell.current <= 120_000) {
              void send({ kind: 'dwell', dwellMs: accDwell.current })
            }
          }, 10_000)
        }
        if (!vis && dwellTimer.current) {
          clearInterval(dwellTimer.current)
          dwellTimer.current = null
        }
      },
      { threshold: [0, 0.38, 0.6] },
    )
    ob.observe(el)
    return () => {
      ob.disconnect()
      if (dwellTimer.current) clearInterval(dwellTimer.current)
    }
  }, [send])

  const handleClickCapture = () => {
    const seq = onRankClick()
    void send({ kind: 'click', clickSeq: seq })
  }

  return (
    <div ref={rootRef} onClickCapture={handleClickCapture}>
      <PostCard post={post} variant="compact" linkTarget="_blank" />
    </div>
  )
}
