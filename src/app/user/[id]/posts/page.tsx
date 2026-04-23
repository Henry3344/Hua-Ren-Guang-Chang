'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import PostCard from '@/components/PostCard'
import type { PostCardPost } from '@/components/PostCard'
import BackToPrev from '@/components/BackToPrev'
import { Loader2, Package, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'

function UserPostsInner() {
  const params = useParams()
  const searchParams = useSearchParams()
  const rawId = params?.id
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''
  const view = searchParams.get('view') === 'completed' ? 'completed' : 'published'
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const [loading, setLoading] = useState(() => Boolean(id))
  const [err, setErr] = useState('')
  const [data, setData] = useState<{
    posts: PostCardPost[]
    userName: string | null
    total: number
    hasMore: boolean
    page: number
    limit: number
  } | null>(null)

  const tabBase = '/user/' + encodeURIComponent(id) + '/posts'

  const tabPublishedHref = useMemo(() => tabBase + '?view=published', [tabBase])
  const tabCompletedHref = useMemo(() => tabBase + '?view=completed', [tabBase])

  function pageHref(p: number) {
    const sp = new URLSearchParams()
    sp.set('view', view)
    if (p > 1) sp.set('page', String(p))
    return tabBase + '?' + sp.toString()
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false
    queueMicrotask(() => {
      setLoading(true)
      setErr('')
    })
    fetch(
      '/api/user/' + encodeURIComponent(id) + '/posts?view=' + view + '&page=' + page + '&limit=20',
      { cache: 'no-store' }
    )
      .then(async (r) => {
        const j = await r.json().catch(() => ({}))
        if (cancelled) return
        if (!r.ok) {
          setErr(typeof j.error === 'string' ? j.error : '加载失败')
          setData(null)
          return
        }
        setData({
          posts: Array.isArray(j.posts) ? j.posts : [],
          userName: j.userName ?? null,
          total: typeof j.total === 'number' ? j.total : 0,
          hasMore: !!j.hasMore,
          page: typeof j.page === 'number' ? j.page : page,
          limit: typeof j.limit === 'number' ? j.limit : 20,
        })
      })
      .catch(() => {
        if (!cancelled) {
          setErr('网络异常，请稍后重试')
          setData(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, view, page])

  if (!id) {
    return (
      <div className="max-w-3xl mx-auto px-safe py-8">
        <p className="text-center text-muted-foreground">无效的用户链接</p>
      </div>
    )
  }

  const displayName = data?.userName || '用户'
  const title = view === 'completed' ? `${displayName}的已完成` : `${displayName}的发布`

  return (
    <div className="max-w-3xl mx-auto px-safe py-6 sm:py-8">
      <BackToPrev className="mb-6" fallbackHref={id ? '/user/' + id : '/'} />

      <div className="mb-6">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {view === 'completed' ? '含已成交的租房、招聘、二手等' : '不含已标记为已完成的帖子'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant={view === 'published' ? 'default' : 'outline'} size="sm" asChild>
          <Link href={tabPublishedHref} scroll={false} className="inline-flex items-center gap-1.5">
            <Package className="w-4 h-4" />
            已发布
          </Link>
        </Button>
        <Button variant={view === 'completed' ? 'default' : 'outline'} size="sm" asChild>
          <Link href={tabCompletedHref} scroll={false} className="inline-flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4" />
            已完成
          </Link>
        </Button>
      </div>

      {loading && (
        <div className="flex justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      )}

      {!loading && err && (
        <div className="text-center py-12 text-muted-foreground">{err}</div>
      )}

      {!loading && !err && data && (
        <>
          {data.posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-xl bg-muted/20">
              暂无内容
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          )}

          {data.total > data.limit && (
            <div className="flex items-center justify-center gap-3 mt-8">
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={pageHref(page - 1)} scroll={false}>
                    上一页
                  </Link>
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled>
                  上一页
                </Button>
              )}
              <span className="text-sm text-muted-foreground tabular-nums">
                第 {page} 页 · 共 {data.total} 条
              </span>
              {data.hasMore ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={pageHref(page + 1)} scroll={false}>
                    下一页
                  </Link>
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled>
                  下一页
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function UserPostsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-safe py-20 flex justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <UserPostsInner />
    </Suspense>
  )
}
