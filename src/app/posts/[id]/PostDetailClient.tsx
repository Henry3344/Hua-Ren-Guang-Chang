'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Eye, Phone, Pin, User, Share2, Flag, Copy, Check, ShieldAlert, Heart, Package, ShoppingBag, Loader2, AlertTriangle } from 'lucide-react'
import { creditScoreColor, creditScoreLabel } from '@/lib/creditScore'
import { REPORT_REASONS } from '@/lib/reportReasons'
import ImageLightbox from '@/components/ImageLightbox'
import { AdSlotPair } from '@/components/AdSlot'
import UserAvatar from '@/components/UserAvatar'
import BackToPrev from '@/components/BackToPrev'
import { jobSeekPriceDisplay, rentSeekSubLabel } from '@/lib/postDisplay'
import type { PostCardPost } from '@/components/PostCard'

type PostAuthor = {
  name?: string | null
  avatar?: string | null
  creditScore?: number | null
  merchant?: { status: string } | null
}

export type PostDetailData = PostCardPost & {
  description?: string | null
  userId: string
  contact?: string | null
  status?: string
  highRiskKeywords?: boolean
  user?: PostAuthor | null
}

function RelatedCard({ post }: { post: PostCardPost }) {
  const price = post.category === 'JOB'
    ? (post.price != null ? '$' + post.price + '/hr' : '面议')
    : post.category === 'JOB_SEEK'
      ? jobSeekPriceDisplay(post.price, post.jobSalaryUnit)
    : (post.price != null ? '$' + post.price.toLocaleString() : null)
  return (
    <a
      href={'/posts/' + post.id}
      className="group flex gap-3 p-3.5 transition-colors hover:bg-accent/60"
    >
      {post.images?.[0] ? (
        <img src={post.images[0]} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
      ) : (
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-lg opacity-30">
          {post.category === 'RENT' || post.category === 'RENT_SEEK'
            ? '🏠'
            : post.category === 'JOB' || post.category === 'JOB_SEEK'
              ? '💼'
              : '📦'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="line-clamp-2 text-xs font-medium group-hover:text-primary">{post.title}</p>
        {price && <p className="mt-1 text-xs font-bold text-primary">{price}</p>}
        <p className="text-xs text-muted-foreground">{post.location}</p>
      </div>
    </a>
  )
}

const categoryMap: Record<string, { label: string; color: string }> = {
  RENT: { label: '租房', color: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/15 dark:text-sky-300' },
  RENT_SEEK: { label: '找房', color: 'bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/15 dark:text-sky-300' },
  JOB: { label: '招聘', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-300' },
  JOB_SEEK: { label: '找工', color: 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/15 dark:text-emerald-300' },
  SECONDHAND: { label: '二手', color: 'bg-amber-500/10 text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300' },
}

export default function PostDetailClient({
  postId,
  initialPost,
}: {
  postId: string
  initialPost: PostDetailData
}) {
  const { data: session } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<PostDetailData>(initialPost)
  const [copied, setCopied] = useState(false)
  const [wechatCopied, setWechatCopied] = useState(false)
  const [reported, setReported] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [related, setRelated] = useState<PostCardPost[]>([])
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [userStats, setUserStats] = useState<{ postCount: number; joinedAt: string } | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0])
  const [reportDetail, setReportDetail] = useState('')
  const [reportContact, setReportContact] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportOutcome, setReportOutcome] = useState<'idle' | 'ok' | 'dup' | 'err'>('idle')
  const [reportErr, setReportErr] = useState('')

  useEffect(() => {
    fetch('/api/posts/' + postId + '/favorite')
      .then((r) => r.json())
      .then((d) => {
        setFavorited(d.favorited)
        setFavoriteCount(d.count || 0)
      })
    fetch('/api/posts/' + postId)
      .then((r) => {
        if (!r.ok) {
          router.push('/posts')
          return null
        }
        return r.json()
      })
      .then((d) => {
        if (!d) return
        setPost(d as PostDetailData)
        fetch('/api/posts?category=' + d.category + '&limit=4')
          .then((r) => r.json())
          .then((r) =>
            setRelated((r.posts || []).filter((p: PostCardPost) => p.id !== postId).slice(0, 4)),
          )
        fetch('/api/users/' + d.userId + '/stats')
          .then((r) => r.json())
          .then((s) => setUserStats(s))
      })
  }, [postId, router])

  // Basic anti-copy / anti-scrape UX (not a security boundary)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const key = e.key?.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (key === 'c' || key === 'a' || key === 's' || key === 'p')) {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  if (!post) return null

  const contactRaw = post.contact ?? ''

  const cat = categoryMap[post.category] || { label: post.category, color: '' }
  const timeAgo = (date: string | Date) => {
    const diff = Date.now() - new Date(date).getTime()
    const h = Math.floor(diff / 3600000)
    if (h < 1) return '刚刚'
    if (h < 24) return h + '小时前'
    return Math.floor(h / 24) + '天前'
  }

  const joinedAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days < 30) return days + '天前加入'
    if (days < 365) return Math.floor(days / 30) + '个月前加入'
    return Math.floor(days / 365) + '年前加入'
  }

  const isPhone = (s: string) => /^[\d\s\-\+\(\)]{7,}$/.test(s)
  const isWechat = (s: string) => !isPhone(s) && !s.includes('@')
  const isEmail = (s: string) => s.includes('@')

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) { await navigator.share({ title: post.title, url }) }
    else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleFavorite() {
    const res = await fetch('/api/posts/' + post.id + '/favorite', { method: 'POST' })
    const d = await res.json()
    setFavorited(d.favorited)
    setFavoriteCount((c: number) => d.favorited ? c + 1 : c - 1)
  }

  function openReportModal() {
    if (reported) return
    if (!session) {
      alert('请先登录后再举报')
      router.push('/login?callbackUrl=' + encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/posts'))
      return
    }
    setReportReason(REPORT_REASONS[0])
    setReportDetail('')
    setReportContact('')
    setReportOutcome('idle')
    setReportErr('')
    setReportOpen(true)
  }

  async function submitPostReport() {
    if (!post || reported) return
    setReportLoading(true)
    setReportOutcome('idle')
    setReportErr('')
    try {
      const res = await fetch('/api/posts/' + post.id + '/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reportReason,
          details: reportDetail,
          contactPhone: reportContact,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReportOutcome('err')
        setReportErr(typeof data.error === 'string' ? data.error : '提交失败')
        return
      }
      if (data.duplicate) {
        setReportOutcome('dup')
        setReported(true)
        return
      }
      setReportOutcome('ok')
      setReported(true)
    } catch {
      setReportOutcome('err')
      setReportErr('网络异常，请稍后重试')
    } finally {
      setReportLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('确定要删除这条帖子吗？')) return
    setDeleting(true)
    await fetch('/api/posts/' + post.id, { method: 'DELETE' })
    router.push('/posts')
  }

  const me = session?.user?.id
  /** 仅发帖人本人在详情页可编辑/删除；管理员在后台操作，不在此页展示 */
  const isPostOwner = Boolean(session && me === post.userId)

  const priceLabel = post.category === 'JOB'
    ? (post.price != null ? '$' + post.price.toLocaleString() + '/hr' : '面议')
    : post.category === 'JOB_SEEK'
      ? jobSeekPriceDisplay(post.price, post.jobSalaryUnit)
    : (post.price != null ? '$' + post.price.toLocaleString() : null)

  const images = post.images && post.images.length > 0 ? post.images : null

  return (
    <div
      className="page-shell-tight"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <BackToPrev className="mb-6" fallbackHref="/posts" />

      <AdSlotPair base="POST_TOP" variant="banner" className="mb-5" />

      <div className="flex flex-col items-start gap-6 lg:flex-row">
          <div className="w-full min-w-0 flex-1 select-none">
          <div className="mb-5 flex gap-3 rounded-2xl border border-yellow-200/80 bg-yellow-50/85 p-4 dark:border-yellow-900/50 dark:bg-yellow-950/25">
            <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-100/90">
              <span className="font-semibold">防诈骗提示：</span>
              请勿向陌生人预付任何押金或费用。见面交易时请选择公共场所，如遇可疑请立即拨打 911 并通过举报按钮向我们反映。
            </div>
          </div>

          {post.highRiskKeywords && (
            <div className="mb-5 flex gap-3 rounded-2xl border border-orange-200/80 bg-orange-50/85 p-4 dark:border-orange-900/60 dark:bg-orange-950/30">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
              <p className="text-sm text-orange-900 dark:text-orange-100/90 leading-relaxed">
                此帖文检测到高风险关键词，请在做任何决定前仔细斟酌。
              </p>
            </div>
          )}

          <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-[0_18px_48px_-26px_rgba(15,23,42,0.28)]">
            {userStats && (
              <div className="border-b border-border/70 bg-muted/15 p-5">
                <div className="flex items-center gap-3">
                  <Link
                    href={'/user/' + post.userId}
                    className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    aria-label={'查看 ' + (post.user?.name || '用户') + ' 的主页'}
                  >
                    <UserAvatar src={post.user?.avatar} name={post.user?.name} size="md" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={'/user/' + post.userId} className="text-base font-semibold hover:text-primary sm:text-lg">
                        {post.user?.name || '匿名用户'}
                      </Link>
                      {typeof post.user?.creditScore === 'number' && (
                        <span
                          className="text-sm sm:text-base font-semibold tabular-nums"
                          style={{ color: creditScoreColor(post.user.creditScore) }}
                        >
                          · 信用 {post.user.creditScore}{' '}
                          {creditScoreLabel(post.user.creditScore)}
                        </span>
                      )}
                      <Link
                        href="/credit"
                        className={
                          typeof post.user?.creditScore === 'number'
                            ? 'text-[11px] sm:text-xs font-medium leading-tight hover:underline underline-offset-2'
                            : 'text-[11px] sm:text-xs font-medium leading-tight text-red-600 hover:text-red-700 hover:underline underline-offset-2'
                        }
                        style={
                          typeof post.user?.creditScore === 'number'
                            ? { color: creditScoreColor(post.user.creditScore) }
                            : undefined
                        }
                      >
                        这个分数意味着什么？
                      </Link>
                      {post.user?.merchant?.status === 'APPROVED' && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20"
                        >
                          已认证商家
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Package className="w-3 h-3" />
                        已发布 {userStats.postCount} 条
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {joinedAgo(userStats.joinedAt)}
                      </span>
                    </div>
                  </div>
                  {isPostOwner && (
                  <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={'/posts/' + post.id + '/edit'}>编辑</Link>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                        删除
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {images && (
              <div className="border-b border-border/70">
                <div className="relative cursor-zoom-in bg-black/5" onClick={() => setLightboxOpen(true)}>
                  <img src={images[activeImg]} alt="" className="w-full max-h-80 object-contain" />
                  <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">点击查看大图</div>
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 p-3 overflow-x-auto">
                    {images.map((img: string, i: number) => (
                      <button key={i} onClick={() => setActiveImg(i)}
                        className={'w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ' +
                          (activeImg === i ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100')}>
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

              <div className="border-b border-border/70 p-6 sm:p-7">
              <div className="mb-3 flex items-center gap-2 flex-wrap">
                <span className={'rounded-full px-2 py-0.5 text-xs font-medium ' + cat.color}>{cat.label}</span>
                {post.subCategory && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {post.category === 'RENT_SEEK' ? rentSeekSubLabel(post.subCategory) : post.subCategory}
                  </span>
                )}
                {post.isPinned && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300">
                    <Pin className="w-3 h-3" />置顶
                  </span>
                )}
              </div>
              <h1 className="mb-3 text-2xl font-semibold leading-snug tracking-tight sm:text-[1.75rem]">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{post.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{timeAgo(post.createdAt)}</span>
                <span className="flex items-center gap-1"><Eye className="w-4 h-4" />{post.viewCount} 浏览</span>
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{favoriteCount} 收藏</span>
              </div>
              {priceLabel && (
                <div className="mt-5 text-2xl font-bold text-primary sm:text-[1.9rem]">{priceLabel}</div>
              )}
            </div>

            <div className="border-b border-border/70 p-6 sm:p-7">
              <h2 className="mb-3 text-base font-semibold tracking-tight">详情描述</h2>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{post.description}</p>
              <p className="mt-10 text-base font-semibold leading-relaxed text-foreground">
                为保障用户安全与沟通效率，请联系对方时说明信息来源于华人广场网站。
              </p>
            </div>

            <div className="border-b border-border/70 bg-muted/20 p-6 sm:p-7">
              <h2 className="mb-3 text-base font-semibold tracking-tight">联系方式</h2>
              {post.status === 'SOLD' ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-muted-foreground">
                  <ShoppingBag className="w-4 h-4" />
                  {post.category === 'RENT' || post.category === 'RENT_SEEK'
                    ? '已租出'
                    : post.category === 'JOB' || post.category === 'JOB_SEEK'
                      ? '已招满'
                      : '已售出'}
                </div>
              ) : (
                session ? (
                  <div className="flex flex-wrap gap-2">
                    {isPhone(contactRaw) && (
                      <a
                        href={'tel:' + contactRaw}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        <Phone className="w-4 h-4" />
                        {contactRaw}
                      </a>
                    )}
                    {isWechat(contactRaw) && (
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(contactRaw)
                          setWechatCopied(true)
                          setTimeout(() => setWechatCopied(false), 2000)
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                      >
                        {wechatCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        微信：{contactRaw} {wechatCopied ? '已复制' : '点击复制'}
                      </button>
                    )}
                    {isEmail(contactRaw) && (
                      <a
                        href={'mailto:' + contactRaw}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-accent transition-colors"
                      >
                        {contactRaw}
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm shadow-sm">
                    <p className="text-muted-foreground mb-3">为保护本站用户安全，联系方式已隐藏，登录即可查看联系方式。</p>
                    <Button asChild size="sm">
                      <Link href={'/login?callbackUrl=' + encodeURIComponent('/posts/' + post.id)}>
                        点此登录
                      </Link>
                    </Button>
                  </div>
                )
              )}
            </div>

            <div className="flex items-center justify-end gap-2 p-4 sm:p-5">
              <Button variant="ghost" size="sm" onClick={handleFavorite}
                className={'gap-1 ' + (favorited ? 'text-red-500 hover:text-red-500' : '')}>
                <Heart className={"w-4 h-4" + (favorited ? ' fill-current' : '')} />
                {favorited ? '已收藏' : '收藏'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleShare} className="gap-1">
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copied ? '已复制' : '分享'}
              </Button>
              <Button variant="ghost" size="sm" onClick={openReportModal}
                className={'gap-1 ' + (reported ? 'text-muted-foreground' : 'text-destructive hover:text-destructive')}>
                <Flag className="w-4 h-4" />
                {reported ? '已举报' : '举报'}
              </Button>
            </div>
          </div>

          <AdSlotPair base="POST_BOTTOM" variant="inline" className="mt-4" />
        </div>

        {reportOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => !reportLoading && setReportOpen(false)}
          >
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-border/80 bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="font-semibold mb-1">举报帖子</h2>
              <p className="text-xs text-muted-foreground mb-4">我们会认真审核每一条举报，不会随意处罚用户。</p>
              {reportOutcome === 'idle' || reportOutcome === 'err' ? (
                <>
                  <div className="space-y-3 mb-4">
                    <label className="text-sm font-medium">原因</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    >
                      {REPORT_REASONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <div>
                      <label className="text-sm font-medium">补充说明（可选）</label>
                      <textarea
                        value={reportDetail}
                        onChange={(e) => setReportDetail(e.target.value)}
                        className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">你的联系方式（电话）</label>
                      <p className="text-xs text-muted-foreground mt-0.5 mb-1">我们可能会联系你简单了解详情（选填）</p>
                      <input
                        type="tel"
                        value={reportContact}
                        onChange={(e) => setReportContact(e.target.value)}
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                        placeholder="例如：917-000-0000"
                        autoComplete="tel"
                      />
                    </div>
                  </div>
                  {reportOutcome === 'err' && reportErr && (
                    <p className="text-sm text-destructive mb-3">{reportErr}</p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setReportOpen(false)} disabled={reportLoading}>
                      取消
                    </Button>
                    <Button type="button" onClick={submitPostReport} disabled={reportLoading}>
                      {reportLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      提交举报
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-foreground">
                    {reportOutcome === 'ok' && '提交成功，感谢你为维护社区安全献出的一份力！'}
                    {reportOutcome === 'dup' && '该帖你已举报过，我们会继续跟进处理。感谢你的关注。'}
                  </p>
                  <Button type="button" className="w-full" onClick={() => setReportOpen(false)}>
                    关闭
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div className="hidden w-full shrink-0 lg:block lg:w-64">
            <div className="sticky top-24 overflow-hidden rounded-3xl border border-border/80 bg-card/95 shadow-[0_18px_48px_-28px_rgba(15,23,42,0.3)]">
              <div className="border-b border-border/70 p-4 text-sm font-semibold tracking-tight">相关推荐</div>
              <div className="divide-y">
                {related.map(p => <RelatedCard key={p.id} post={p} />)}
              </div>
            </div>
          </div>
        )}
      </div>
      {lightboxOpen && images && (
        <ImageLightbox images={images} initialIndex={activeImg} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  )
}
