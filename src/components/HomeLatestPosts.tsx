'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import PostCard from '@/components/PostCard'
import PostsViewModeToggle from '@/components/PostsViewModeToggle'
import { Button } from '@/components/ui/button'
import { ArrowRight, RefreshCw } from 'lucide-react'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import { usePostsViewMode } from '@/hooks/usePostsViewMode'
import { buildHomeLatestQuery } from '@/lib/homeFeedParams'
import { stablePostsQueryKey } from '@/lib/buildPostsListParams'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'

type HomeLatestPostsProps = {
  initialPosts?: AiRagPostCard[]
  serverQueryKey?: string
}

export default function HomeLatestPosts({
  initialPosts,
  serverQueryKey,
}: HomeLatestPostsProps = {}) {
  const { pref, ready } = useSiteLocation()
  const { mode } = usePostsViewMode()
  const [posts, setPosts] = useState<AiRagPostCard[]>(initialPosts ?? [])
  const [loading, setLoading] = useState(true)
  const [shuffleBusy, setShuffleBusy] = useState(false)

  const load = useCallback(
    async (opts: { random: boolean; excludeIds: string[] }) => {
      const params = buildHomeLatestQuery(pref, opts)
      const r = await fetch('/api/posts?' + params.toString())
      const d = await r.json().catch(() => ({}))
      const list = Array.isArray(d.posts) ? d.posts : []
      if (opts.random && list.length === 0) {
        alert('暂无可换批次，请稍后再试或切换地区。')
        return
      }
      setPosts(list as AiRagPostCard[])
    },
    [pref],
  )

  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts)
    }
  }, [initialPosts])

  useEffect(() => {
    if (!ready) return
    const params = buildHomeLatestQuery(pref, { random: false, excludeIds: [] })
    if (
      serverQueryKey &&
      stablePostsQueryKey(params) === serverQueryKey &&
      initialPosts !== undefined
    ) {
      setPosts(initialPosts)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    load({ random: false, excludeIds: [] })
      .then(() => {
        if (!cancelled) setLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setPosts([])
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [pref, ready, load, serverQueryKey, initialPosts])

  async function shuffle() {
    if (posts.length === 0) return
    setShuffleBusy(true)
    const excludeIds = posts.map((p) => p.id)
    try {
      await load({ random: true, excludeIds })
    } finally {
      setShuffleBusy(false)
    }
  }

  if (!ready || loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[140px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border rounded-xl animate-pulse bg-muted/40 row-span-2" />
        ))}
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
        <p className="text-sm font-medium text-foreground">当前没有帖子可供展示</p>
        <p className="mt-2 mb-5 text-xs text-muted-foreground">可以切换地区、浏览全部，或发布第一条信息。</p>
        <Button asChild>
          <Link href="/posts/new">立即发布</Link>
        </Button>
      </div>
    )
  }

  if (mode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.id}>
              <PostCard post={post} variant="compact" />
            </div>
          ))}
        </div>
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={shuffleBusy}
            onClick={shuffle}
            className="gap-2"
          >
            {shuffleBusy ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            换一批
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[140px]">
        {posts.map((post) => {
          const hasImage = Array.isArray(post.images) && post.images.length > 0
          return (
            <div key={post.id} className={hasImage ? 'row-span-2' : 'row-span-1'}>
              <PostCard post={post} />
            </div>
          )
        })}
      </div>
      <div className="flex justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={shuffleBusy}
          onClick={shuffle}
          className="gap-2"
        >
          {shuffleBusy ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          换一批
        </Button>
      </div>
    </div>
  )
}

export function HomeLatestPostsHeader() {
  const { mode, setMode } = usePostsViewMode()
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex flex-wrap items-center gap-3 min-w-0">
        <h2 className="text-xl font-bold shrink-0">最新发布</h2>
        <PostsViewModeToggle mode={mode} onChange={setMode} />
      </div>
      <Link href="/posts" className="text-sm text-primary hover:underline flex items-center gap-1 shrink-0">
        查看全部 <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  )
}
