'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Trash2, PlusCircle, Eye, Pin, Loader2, CheckCircle, Pencil, ShoppingBag } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'

const categoryMap: Record<string, string> = {
  RENT: '租房',
  RENT_SEEK: '找房',
  JOB: '招聘',
  JOB_SEEK: '找工',
  SECONDHAND: '二手',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE:   { label: '上架中',   color: 'bg-green-100 text-green-700' },
  PENDING:  { label: '审核中',   color: 'bg-yellow-100 text-yellow-700' },
  REJECTED: { label: '审核被拒', color: 'bg-red-100 text-red-700' },
  SOLD:     { label: '已售出',   color: 'bg-gray-100 text-gray-500' },
  EXPIRED:  { label: '已下架',   color: 'bg-gray-100 text-gray-400' },
  DELISTED: { label: '违规下架', color: 'bg-amber-100 text-amber-800' },
}

const tabs = [
  { value: 'ALL',      label: '全部' },
  { value: 'ACTIVE',   label: '上架中' },
  { value: 'PENDING',  label: '审核中' },
  { value: 'REJECTED', label: '审核被拒' },
  { value: 'DELISTED', label: '违规下架' },
  { value: 'SOLD',     label: '已完成' },
  { value: 'EXPIRED',  label: '已下架' },
]

function DashboardContent() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justPinned = searchParams.get('pinned') === '1'
  const freeType = searchParams.get('free') || ''
  const [posts, setPosts] = useState<
    Array<{
      id: string
      title: string
      category: string
      status: string
      isPinned: boolean
      viewCount: number
      location: string
      price: number | null
      expiresAt?: string | null
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [soldLoading, setSoldLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('ALL')

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      fetch('/api/posts/mine').then(r => r.json()).then(d => { setPosts(d.posts || []); setLoading(false) })
    }
  }, [status, router])

  async function handleDelete(id: string) {
    if (!confirm('确定删除？')) return
    await fetch('/api/posts/' + id, { method: 'DELETE' })
    setPosts(posts.filter(p => p.id !== id))
  }

  async function handlePinCheckout(postId: string) {
    setPinLoading(postId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'POST_PIN', postId }),
    })
    const data = await res.json()
    setPinLoading(null)
    if (data.url) window.location.assign(data.url)
    if (data.pinned) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isPinned: true, expiresAt: data.expiresAt || p.expiresAt } : p)),
      )
      const ft = data.freeType === 'trial' ? 'trial' : data.freeType === 'credit' ? 'credit' : ''
      router.push('/dashboard?pinned=1' + (ft ? `&free=${ft}` : ''))
    }
  }

  async function handleSold(id: string) {
    if (!confirm('确认标记为已售出？售出后联系方式将显示为"已售出"。')) return
    setSoldLoading(id)
    await fetch('/api/posts/' + id + '/sold', { method: 'POST' })
    setPosts(posts.map(p => p.id === id ? { ...p, status: 'SOLD' } : p))
    setSoldLoading(null)
  }

  const filtered = activeTab === 'ALL' ? posts : posts.filter(p => p.status === activeTab)
  const counts = tabs.reduce((acc, t) => {
    acc[t.value] = t.value === 'ALL' ? posts.length : posts.filter(p => p.status === t.value).length
    return acc
  }, {} as Record<string, number>)

  if (status === 'loading' || loading) return <div className="text-center py-20">加载中...</div>

  return (
    <div className="page-shell-narrow">
      <BackToPrev className="mb-6" />
      {justPinned && (
        <div className="info-banner mb-6 flex items-center gap-3 border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-sm font-medium">
            {freeType === 'trial'
              ? '置顶成功！已免费置顶 5 小时（试用）。'
              : freeType === 'credit'
                ? '置顶成功！已免费置顶 1 天（额度）。'
                : '付款成功！您的帖子已置顶 30 天。'}
          </span>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="page-title">我的发布</h1>
          <p className="page-subtitle mt-1">集中管理你的帖子状态、置顶与成交进度。</p>
        </div>
        <Button asChild size="sm">
          <Link href="/posts/new"><PlusCircle className="w-4 h-4 mr-1" />发布新帖</Link>
        </Button>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button key={tab.value} onClick={() => setActiveTab(tab.value)}
            className={'rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ' +
              (activeTab === tab.value
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-background/80 text-muted-foreground ring-1 ring-border/70 hover:bg-accent/70 hover:text-foreground')}>
            {tab.label}
            {counts[tab.value] > 0 && <span className="ml-1 opacity-70">({counts[tab.value]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p className="mb-4">暂无帖子</p>
          {activeTab === 'ALL' && <Button asChild><Link href="/posts/new">立即发布</Link></Button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
            const st = statusConfig[post.status] || statusConfig.ACTIVE
            return (
              <div key={post.id} className="panel-card p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">{categoryMap[post.category]}</span>
                      <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + st.color}>{st.label}</span>
                      {post.isPinned && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                          <Pin className="w-3 h-3" />置顶中
                          {post.expiresAt && <span className="opacity-70">· 到期 {new Date(post.expiresAt).toLocaleDateString('zh-CN')}</span>}
                        </span>
                      )}
                    </div>
                    <Link href={'/posts/' + post.id} className="font-medium text-sm hover:text-primary line-clamp-1">{post.title}</Link>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                      <Eye className="w-3 h-3" />{post.viewCount} 浏览
                      <span>·</span>{post.location}
                      {post.price != null && (
                        <>
                          <span>·</span>${post.price}{post.category === 'JOB' ? '/hr' : ''}
                        </>
                      )}
                    </div>
                    {post.status === 'REJECTED' && (
                      <p className="text-xs text-red-500 mt-1">帖子未通过审核，请修改后重新发布</p>
                    )}
                    {post.status === 'DELISTED' && (
                      <p className="text-xs text-amber-800 mt-1">该帖已被管理员下架，前台用户不可见。如有异议请联系平台。</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                    {post.status === 'ACTIVE' && (
                      <>
                        {!post.isPinned && (
                          <Button variant="outline" size="sm" onClick={() => handlePinCheckout(post.id)}
                            disabled={pinLoading === post.id}
                            className="gap-1 text-yellow-700 border-yellow-300 hover:bg-yellow-50 text-xs">
                            {pinLoading === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pin className="w-3 h-3" />}
                            置顶 $9.99
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleSold(post.id)}
                          disabled={soldLoading === post.id}
                          className="gap-1 text-xs border-green-400 text-green-700 hover:bg-green-50">
                          {soldLoading === post.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShoppingBag className="w-3 h-3" />}
                          {post.category === 'RENT' || post.category === 'RENT_SEEK'
                            ? '标记已租出'
                            : post.category === 'JOB' || post.category === 'JOB_SEEK'
                              ? '标记已招满'
                              : '标记已售出'}
                        </Button>
                      </>
                    )}
                    {post.status !== 'SOLD' && post.status !== 'EXPIRED' && post.status !== 'DELISTED' && (
                      <Button variant="ghost" size="icon" asChild title="编辑">
                        <Link href={'/posts/' + post.id + '/edit'}>
                          <Pencil className="w-4 h-4" />
                        </Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>
}
