'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import type { PostCardPost } from '@/components/PostCard'
import BackToPrev from '@/components/BackToPrev'
import PostsViewModeToggle from '@/components/PostsViewModeToggle'
import { usePostsViewMode } from '@/hooks/usePostsViewMode'
import { Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function FavoritesPage() {
  const { status } = useSession()
  const router = useRouter()
  const { mode, setMode } = usePostsViewMode()
  const [posts, setPosts] = useState<PostCardPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/favorites').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) })
    }
  }, [status, router])

  if (status === 'loading' || loading) return <div className="text-center py-20">加载中...</div>

  return (
    <div className="page-shell-tight">
      <BackToPrev className="mb-6" />
      <div className="page-header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="page-title">我的收藏</h1>
          </div>
          <PostsViewModeToggle mode={mode} onChange={setMode} />
        </div>
        <p className="page-subtitle">收藏后可以统一回看感兴趣的帖子，方便稍后比较与联系。</p>
      </div>
      {posts.length === 0 ? (
        <div className="empty-state">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="mb-4">还没有收藏任何帖子</p>
          <Button asChild><Link href="/posts">去浏览</Link></Button>
        </div>
      ) : mode === 'list' ? (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
