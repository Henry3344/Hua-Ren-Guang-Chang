'use client'
import { useEffect, useState, Suspense, type ReactElement } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import PostCard from '@/components/PostCard'
import PostsViewModeToggle from '@/components/PostsViewModeToggle'
import { AdDisplay, AdSlotPair, type AdRecord } from '@/components/AdSlot'
import { usePostsViewMode } from '@/hooks/usePostsViewMode'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Search, Home } from 'lucide-react'
import { locationToQuery } from '@/lib/locationPrefs'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import Link from 'next/link'
import { buildPostsListParams, stablePostsQueryKey } from '@/lib/buildPostsListParams'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'

const categories = [
  { value: '', label: '全部' },
  { value: 'RENT', label: '租房' },
  { value: 'RENT_SEEK', label: '找房' },
  { value: 'JOB', label: '招聘' },
  { value: 'JOB_SEEK', label: '找工' },
  { value: 'SECONDHAND', label: '二手' },
]

const subCategories: Record<string, { value: string; label: string }[]> = {
  RENT: [
    { value: '', label: '全部' },
    { value: '整租', label: '整租' },
    { value: '合租', label: '合租' },
    { value: '单房', label: '单房' },
    { value: '床位', label: '床位' },
    { value: '车位', label: '车位' },
    { value: '商铺/办公室', label: '商铺/办公室' },
    { value: '短租/民宿', label: '短租/民宿' },
  ],
  RENT_SEEK: [
    { value: '', label: '全部' },
    { value: '整租', label: '整租' },
    { value: '合租', label: '合租' },
    { value: '单房', label: '单房' },
    { value: '床位', label: '床位' },
    { value: '车位', label: '车位' },
    { value: '商铺/办公室', label: '商铺/办公室' },
    { value: '短租/民宿', label: '短租/民宿' },
  ],
  JOB: [
    { value: '', label: '全部' },
    { value: '餐饮服务', label: '餐饮服务' },
    { value: '零售门店', label: '零售门店' },
    { value: '美容美发', label: '美容美发' },
    { value: '办公/IT', label: '办公/IT' },
    { value: '医疗/保健', label: '医疗/保健' },
    { value: '教育/培训', label: '教育/培训' },
    { value: '运输/搬家', label: '运输/搬家' },
    { value: '建筑/装修', label: '建筑/装修' },
    { value: '其他', label: '其他' },
  ],
  JOB_SEEK: [
    { value: '', label: '全部' },
    { value: '餐饮服务', label: '餐饮服务' },
    { value: '零售门店', label: '零售门店' },
    { value: '美容美发', label: '美容美发' },
    { value: '办公/IT', label: '办公/IT' },
    { value: '医疗/保健', label: '医疗/保健' },
    { value: '教育/培训', label: '教育/培训' },
    { value: '运输/搬家', label: '运输/搬家' },
    { value: '建筑/装修', label: '建筑/装修' },
    { value: '其他', label: '其他' },
  ],
  SECONDHAND: [
    { value: '', label: '全部' },
    { value: '手机数码', label: '手机数码' },
    { value: '家具家电', label: '家具家电' },
    { value: '服装箱包', label: '服装箱包' },
    { value: '母婴玩具', label: '母婴玩具' },
    { value: '汽车配件', label: '汽车配件' },
    { value: '餐饮设备', label: '餐饮设备' },
    { value: '乐器/运动', label: '乐器/运动' },
    { value: '其他', label: '其他' },
  ],
}

const RENT_TYPES = [
  { value: '', label: '不限' },
  { value: '公寓', label: '公寓' },
  { value: '独栋', label: '独栋' },
  { value: '联排公寓', label: '联排公寓' },
  { value: '康斗', label: '康斗' },
  { value: '半土库', label: '半土库' },
  { value: '阁楼', label: '阁楼' },
]

const JOB_WORK_TYPES = [
  { value: '', label: '不限' },
  { value: '兼职', label: '兼职' },
  { value: '全职', label: '全职' },
]

const JOB_TAX_TYPES = [
  { value: '', label: '不限' },
  { value: '全税', label: '全税' },
  { value: '现金', label: '现金' },
]

const JOB_LANGS = [
  { value: '', label: '无要求（普通话）' },
  { value: '中英双语（基本）', label: '中英双语（基本）' },
  { value: '中英双语（流利）', label: '中英双语（流利）' },
]

const ITEM_CONDITIONS = [
  { value: '', label: '不限' },
  { value: '几乎全新', label: '几乎全新' },
  { value: '明显使用', label: '明显使用' },
  { value: '明显瑕疵', label: '明显瑕疵' },
]

const TIME_RANGES = [
  { value: 'all', label: '最新' },
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近一个月' },
  { value: '180d', label: '近半年' },
  { value: '1y_plus', label: '一年以上' },
]

const DIR_OPTS = [
  { value: 'desc', label: '最新 → 最旧' },
  { value: 'asc', label: '最旧 → 最新' },
]

const PRICE_BANDS = [
  { value: '', label: '不限' },
  { value: '0', label: '最小—$500' },
  { value: '1', label: '$500—$1000' },
  { value: '2', label: '$1000—$1500' },
  { value: '3', label: '$1500—$2000' },
  { value: '4', label: '$2000—$2500' },
  { value: '5', label: '$2500—最大' },
]

/** 页码按钮：前 5 页、末页、当前附近，中间省略号 */
function visiblePageItems(current: number, totalPages: number): (number | 'ellipsis')[] {
  if (totalPages <= 0) return []
  if (totalPages <= 11) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const s = new Set<number>()
  for (let p = 1; p <= Math.min(5, totalPages); p++) s.add(p)
  s.add(totalPages)
  for (let d = -2; d <= 2; d++) {
    const p = current + d
    if (p >= 1 && p <= totalPages) s.add(p)
  }
  const arr = [...s].sort((a, b) => a - b)
  const out: (number | 'ellipsis')[] = []
  for (let i = 0; i < arr.length; i++) {
    if (i > 0 && arr[i] - arr[i - 1] > 1) out.push('ellipsis')
    out.push(arr[i])
  }
  return out
}

export type PostsPageClientProps = {
  initialPosts: AiRagPostCard[]
  initialTotal: number
  initialTotalPages: number
  serverQueryKey: string
}

function PostsContent({
  initialPosts,
  initialTotal,
  initialTotalPages,
  serverQueryKey,
}: PostsPageClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { pref, ready } = useSiteLocation()
  const { mode: viewMode, setMode: setViewMode } = usePostsViewMode()
  const [posts, setPosts] = useState<AiRagPostCard[]>(initialPosts)
  const [total, setTotal] = useState(initialTotal)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [loading, setLoading] = useState(false)
  const [inlineAds, setInlineAds] = useState<AdRecord[]>([])
  const [jumpInput, setJumpInput] = useState(() => String(parseInt(searchParams.get('page') || '1', 10) || 1))
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [suggest, setSuggest] = useState<Array<{ id: string; title: string }>>([])

  const category = searchParams.get('category') || ''
  const sub = searchParams.get('sub') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const tr = searchParams.get('tr') || 'all'
  const dir = searchParams.get('dir') || 'desc'
  const pb = searchParams.get('pb') || ''
  const rt = searchParams.get('rt') || ''
  const jwt = searchParams.get('jwt') || ''
  const jtt = searchParams.get('jtt') || ''
  const jl = searchParams.get('jl') || ''
  const ic = searchParams.get('ic') || ''
  const qParam = searchParams.get('q') || ''
  const subs = subCategories[category] || []
  const pillClass = (active: boolean) =>
    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ' +
    (active
      ? 'border-primary/20 bg-primary text-primary-foreground shadow-sm'
      : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-accent/70 hover:text-foreground')

  useEffect(() => {
    setQ(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    setJumpInput(String(page))
  }, [page])

  useEffect(() => {
    const v = q.trim()
    if (!ready || !v) {
      setSuggest([])
      return
    }
    const ac = new AbortController()
    const t = window.setTimeout(() => {
      const params = new URLSearchParams()
      params.set('q', v)
      Object.entries(locationToQuery(pref)).forEach(([k, vv]) => params.set(k, vv))
      fetch('/api/search/suggest?' + params.toString(), { signal: ac.signal })
        .then((r) => r.json())
        .then((d) => setSuggest(Array.isArray(d.items) ? d.items : []))
        .catch(() => {})
    }, 180)
    return () => {
      window.clearTimeout(t)
      ac.abort()
    }
  }, [q, pref, ready])

  useEffect(() => {
    fetch('/api/ads?placement=INLINE_FEED')
      .then((r) => r.json())
      .then((d) => setInlineAds(d.ads || []))
  }, [])

  useEffect(() => {
    setPosts(initialPosts)
    setTotal(initialTotal)
    setTotalPages(initialTotalPages)
  }, [initialPosts, initialTotal, initialTotalPages])

  useEffect(() => {
    if (!ready) return
    const params = buildPostsListParams(searchParams, pref)
    const key = stablePostsQueryKey(params)
    if (key === serverQueryKey) {
      setPosts(initialPosts)
      setTotal(initialTotal)
      setTotalPages(initialTotalPages)
      setLoading(false)
      return
    }
    setLoading(true)
    fetch('/api/posts?' + params.toString())
      .then((r) => r.json())
      .then((d) => {
        setPosts((d.posts || []) as AiRagPostCard[])
        setTotal(d.total || 0)
        setTotalPages(d.totalPages || 1)
      })
      .finally(() => setLoading(false))
  }, [
    searchParams,
    category,
    page,
    sub,
    qParam,
    tr,
    dir,
    pb,
    rt,
    jwt,
    jtt,
    jl,
    ic,
    pref,
    ready,
    serverQueryKey,
    initialPosts,
    initialTotal,
    initialTotalPages,
  ])

  function navigate(updates: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)))
    p.delete('page')
    const nextCat = p.get('category') || ''
    if (nextCat !== 'RENT' && nextCat !== 'RENT_SEEK') p.delete('pb')
    if (nextCat !== 'RENT' && nextCat !== 'RENT_SEEK') p.delete('rt')
    if (nextCat !== 'JOB' && nextCat !== 'JOB_SEEK') p.delete('jwt')
    if (nextCat !== 'JOB' && nextCat !== 'JOB_SEEK') p.delete('jtt')
    if (nextCat !== 'JOB' && nextCat !== 'JOB_SEEK') p.delete('jl')
    if (nextCat !== 'SECONDHAND') p.delete('ic')
    router.push('/posts?' + p.toString())
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate({ q })
  }

  function goToPage(pn: number) {
    if (totalPages < 1) return
    const clamped = Math.max(1, Math.min(totalPages, pn))
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(clamped))
    router.push('/posts?' + params.toString())
  }

  function handleJumpPage(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(jumpInput.trim(), 10)
    if (!Number.isFinite(n)) return
    goToPage(n)
  }

  const feedItems: ReactElement[] = []
  posts.forEach((post, i) => {
    if (viewMode === 'list') {
      feedItems.push(
        <div key={post.id}>
          <PostCard post={post} variant="compact" />
        </div>,
      )
    } else {
      const hasImage = Array.isArray(post.images) && post.images.length > 0
      feedItems.push(
        <div key={post.id} className={hasImage ? 'row-span-2' : 'row-span-1'}>
          <PostCard post={post} />
        </div>,
      )
    }
    if ((i + 1) % 6 === 0 && inlineAds.length > 0) {
      const slot = (i + 1) / 6 - 1
      const ad = inlineAds[slot % inlineAds.length]
      feedItems.push(
        <AdDisplay
          key={'feed-ad-' + post.id + '-' + slot}
          ad={ad}
          variant="inline"
          className={
            viewMode === 'list'
              ? 'w-full'
              : 'col-span-1 sm:col-span-2 lg:col-span-3 row-span-1'
          }
        />,
      )
    }
  })

  const showPrice = category === 'RENT' || category === 'RENT_SEEK'

  function SegmentedToggle({
    leftLabel,
    rightLabel,
    value,
    onLeft,
    onRight,
  }: {
    leftLabel: string
    rightLabel: string
    value: 'left' | 'right' | null
    onLeft: () => void
    onRight: () => void
  }) {
    return (
      <div className="relative inline-flex shrink-0 rounded-full border border-border bg-muted/40 p-1 overflow-hidden">
        {value !== null && (
          <div
            className="pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-primary border border-primary transition-transform duration-200 ease-out"
            style={{ transform: value === 'left' ? 'translateX(0%)' : 'translateX(100%)' }}
            aria-hidden
          />
        )}
        <button
          type="button"
          onClick={onLeft}
          className={
            'relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors w-1/2 ' +
            (value === 'left'
              ? 'text-primary-foreground'
              : value === null
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground')
          }
        >
          {leftLabel}
        </button>
        <button
          type="button"
          onClick={onRight}
          className={
            'relative z-10 px-4 py-1.5 rounded-full text-sm font-medium transition-colors w-1/2 ' +
            (value === 'right'
              ? 'text-primary-foreground'
              : value === null
                ? 'text-muted-foreground hover:text-foreground'
                : 'text-muted-foreground hover:text-foreground')
          }
        >
          {rightLabel}
        </button>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-muted-foreground shadow-sm shadow-black/5 hover:bg-accent/70 hover:text-foreground"
      >
        <Home className="w-4 h-4" />
        返回首页
      </Link>
      <AdSlotPair base="CATEGORY_TOP" variant="banner" className="mb-4" />

      {/* 租房/找房、招聘/找工、全部、二手 — 同一行（窄屏横向滚动） */}
      <div className="panel-card mb-4 p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="page-title text-[1.65rem] sm:text-[2rem]">浏览帖子</h1>
            <p className="page-subtitle">按分类、子类和关键词快速缩小范围，优先查看最新和更贴近条件的结果。</p>
          </div>
          <div className="hidden shrink-0 text-sm text-muted-foreground sm:block">共 {total} 条结果</div>
        </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex flex-nowrap items-center gap-2 sm:gap-3 overflow-x-auto pb-1 min-w-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories
            .filter((c) => c.value === '' || c.value === 'SECONDHAND')
            .map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => navigate({ category: cat.value, sub: '' })}
                className={
                  'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
                  (category === cat.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-background/80 text-muted-foreground shadow-sm ring-1 ring-border/70 hover:bg-accent/70 hover:text-foreground')
                }
              >
                {cat.label}
              </button>
            ))}
          <SegmentedToggle
            leftLabel="租房"
            rightLabel="找房"
            value={category === 'RENT' ? 'left' : category === 'RENT_SEEK' ? 'right' : null}
            onLeft={() => navigate({ category: 'RENT', sub: '' })}
            onRight={() => navigate({ category: 'RENT_SEEK', sub: '' })}
          />
          <SegmentedToggle
            leftLabel="招聘"
            rightLabel="找工"
            value={category === 'JOB' ? 'left' : category === 'JOB_SEEK' ? 'right' : null}
            onLeft={() => navigate({ category: 'JOB', sub: '' })}
            onRight={() => navigate({ category: 'JOB_SEEK', sub: '' })}
          />
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 shrink-0 w-[220px] sm:w-[360px]">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setSuggestOpen(true)}
              onBlur={() => setTimeout(() => setSuggestOpen(false), 120)}
              placeholder="搜索关键词..."
              className="w-full rounded-xl border border-input/90 bg-background/90 py-2.5 pl-9 pr-3 text-sm shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {suggestOpen && suggest.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 overflow-hidden rounded-2xl border border-border/80 bg-background shadow-xl">
                {suggest.slice(0, 8).map((it) => (
                  <button
                    key={it.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => navigate({ q: it.title })}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent"
                  >
                    {it.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button type="submit" size="lg" className="shrink-0">
            搜索
          </Button>
        </form>
      </div>
      </div>

      {subs.length > 0 && (
        <div className="mb-3 flex gap-2 flex-wrap">
          {subs.map((s) => (
            <button
              key={s.value}
              onClick={() => navigate({ sub: s.value })}
              className={pillClass(sub === s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {(category === 'RENT' || category === 'RENT_SEEK') && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-2">租房类型</div>
          <div className="flex gap-2 flex-wrap">
            {RENT_TYPES.map((opt) => (
              <button
                key={opt.value || 'any'}
                type="button"
                onClick={() => navigate({ rt: opt.value })}
                className={pillClass(rt === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {(category === 'JOB' || category === 'JOB_SEEK') && (
        <div className="space-y-3 mb-6">
          <div>
            <div className="text-xs text-muted-foreground mb-2">工作类型</div>
            <div className="flex gap-2 flex-wrap">
              {JOB_WORK_TYPES.map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => navigate({ jwt: opt.value })}
                  className={pillClass(jwt === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">报税类型</div>
            <div className="flex gap-2 flex-wrap">
              {JOB_TAX_TYPES.map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => navigate({ jtt: opt.value })}
                  className={pillClass(jtt === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-2">语言要求</div>
            <div className="flex gap-2 flex-wrap">
              {JOB_LANGS.map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => navigate({ jl: opt.value })}
                  className={pillClass(jl === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {category === 'SECONDHAND' && (
        <div className="mb-6">
          <div className="text-xs text-muted-foreground mb-2">物品状态</div>
          <div className="flex gap-2 flex-wrap">
            {ITEM_CONDITIONS.map((opt) => (
              <button
                key={opt.value || 'any'}
                type="button"
                onClick={() => navigate({ ic: opt.value })}
                className={pillClass(ic === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div>
          <div className="text-xs text-muted-foreground mb-2">排序方式</div>
          <div className="flex gap-2 flex-wrap">
            {TIME_RANGES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => navigate({ tr: opt.value })}
                className={pillClass(tr === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-2">排序方向</div>
          <div className="flex gap-2 flex-wrap">
            {DIR_OPTS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => navigate({ dir: opt.value })}
                className={pillClass(dir === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {showPrice && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">价格筛选</div>
            <div className="flex gap-2 flex-wrap">
              {PRICE_BANDS.map((opt) => (
                <button
                  key={opt.value || 'any'}
                  type="button"
                  onClick={() => navigate({ pb: opt.value })}
                  className={pillClass(pb === opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="shrink-0 text-sm text-muted-foreground sm:hidden">共 {total} 条结果</div>
        <PostsViewModeToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {!ready || loading ? (
        viewMode === 'list' ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex min-h-[5.5rem] gap-3 overflow-hidden rounded-2xl border border-border/70 bg-muted/30 animate-pulse">
                <div className="w-28 shrink-0 bg-muted" />
                <div className="flex-1 p-3 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[140px]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="row-span-2 overflow-hidden rounded-2xl border border-border/70 animate-pulse">
                <div className="aspect-[16/9] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-muted rounded w-1/4" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
          <p className="text-sm font-medium text-foreground">当前没有帖子可供展示</p>
          <p className="mt-2 mb-5 text-xs text-muted-foreground">可以切换地区、调整筛选，或发布第一条信息。</p>
          <Button asChild>
            <Link href="/posts/new">立即发布</Link>
          </Button>
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">{feedItems}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 auto-rows-[140px]">{feedItems}</div>
      )}

      {ready && !loading && total > 0 && totalPages >= 1 && (
        <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1 px-2 sm:px-3"
              disabled={page <= 1}
              onClick={() => goToPage(page - 1)}
              aria-label="上一页"
              title="上一页"
            >
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">上一页</span>
            </Button>
            {visiblePageItems(page, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <span
                  key={'ellipsis-' + idx}
                  className="px-1 text-sm text-muted-foreground select-none"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToPage(item)}
                  className={
                    'min-w-9 h-9 rounded-lg px-2 text-sm font-medium transition-colors ' +
                    (item === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent')
                  }
                >
                  {item}
                </button>
              ),
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-1 px-2 sm:px-3"
              disabled={page >= totalPages}
              onClick={() => goToPage(page + 1)}
              aria-label="下一页"
              title="下一页"
            >
              <span className="hidden sm:inline text-xs font-medium">下一页</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
          <form
            onSubmit={handleJumpPage}
            className="flex flex-wrap items-center justify-center gap-2 text-sm"
          >
            <span className="text-muted-foreground whitespace-nowrap">跳转</span>
            <input
              type="text"
              inputMode="numeric"
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="h-9 w-16 rounded-md border border-input bg-background px-2 text-center text-sm tabular-nums"
              aria-label="跳转到页码"
            />
            <span className="text-muted-foreground whitespace-nowrap">页</span>
            <Button type="submit" variant="secondary" size="sm" className="h-9">
              前往
            </Button>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              共 {totalPages} 页
            </span>
          </form>
        </div>
      )}

      <section className="-mx-4 mt-8 border-y border-border/60 bg-muted/20 px-4 py-3 sm:py-4">
        <AdSlotPair base="CATEGORY_BOTTOM" variant="inline" />
      </section>
    </div>
  )
}

export default function PostsPageClient(props: PostsPageClientProps) {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">加载中...</div>}>
      <PostsContent {...props} />
    </Suspense>
  )
}
