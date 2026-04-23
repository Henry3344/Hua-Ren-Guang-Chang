'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import { locationToQuery } from '@/lib/locationPrefs'

type Item = { id: string; title: string }

/**
 * 每次只展示一条，轮换。覆盖站内发帖分类（租房/找房、招聘/找工、二手）及常见标题用语；
 * 与发帖子类、房型/工种选项对齐，便于联想真实帖子。
 */
const SEARCH_PLACEHOLDER_HINTS = [
  // 租房 RENT
  '租房',
  '整租',
  '合租',
  '单房',
  '床位',
  '车位',
  '商铺',
  '办公室',
  '短租',
  '民宿',
  '转租',
  '月租',
  '押一付一',
  '拎包入住',
  '近地铁',
  '公寓',
  '独栋',
  '联排',
  '康斗',
  '半土库',
  '阁楼',
  // 找房 RENT_SEEK
  '找房',
  '求租',
  '找室友',
  // 招聘 JOB
  '招聘',
  '急招',
  '全职',
  '兼职',
  '实习',
  '时薪',
  '全税',
  '现金工',
  '餐饮',
  '零售',
  '美容美发',
  '办公',
  'IT',
  '医疗',
  '保健',
  '教育',
  '培训',
  '搬家',
  '运输',
  '装修',
  '建筑',
  // 找工 JOB_SEEK
  '找工',
  '求职',
  '应聘',
  // 二手 SECONDHAND
  '二手',
  '转让',
  '手机数码',
  '家具家电',
  '服装',
  '箱包',
  '母婴',
  '玩具',
  '汽车配件',
  '餐饮设备',
  '乐器',
  '运动',
  '几乎全新',
  '面议',
  // 黄页 / 本地
  '黄页',
  '商户',
  '本地服务',
]

export default function HomeSearchBar() {
  const router = useRouter()
  const { status } = useSession()
  const { pref } = useSiteLocation()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [open, setOpen] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const locQs = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(locationToQuery(pref)).forEach(([k, v]) => p.set(k, v))
    return p.toString()
  }, [pref])

  useEffect(() => {
    const id = window.setInterval(() => {
      setHintIndex((i) => (i + 1) % SEARCH_PLACEHOLDER_HINTS.length)
    }, 2500)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const v = q.trim()
    if (!v) {
      queueMicrotask(() => setItems([]))
      return
    }
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    const t = window.setTimeout(() => {
      fetch('/api/search/suggest?q=' + encodeURIComponent(v) + '&' + locQs, { signal: ac.signal })
        .then((r) => r.json())
        .then((d) => setItems(Array.isArray(d.items) ? (d.items as Item[]) : []))
        .catch(() => {})
    }, 180)
    return () => window.clearTimeout(t)
  }, [q, locQs])

  function submit(nextQ?: string) {
    let qq = (nextQ ?? q).trim()
    if (!qq) {
      qq = SEARCH_PLACEHOLDER_HINTS[hintIndex]
    }
    const p = new URLSearchParams()
    p.set('q', qq)
    router.push('/posts?' + p.toString())
  }

  function aiAssist() {
    const qq = q.trim()
    const qs = qq ? '?q=' + encodeURIComponent(qq) : ''
    const target = '/ai-search' + qs
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent(target))
      return
    }
    router.push(target)
  }

  const placeholderText = `试试：${SEARCH_PLACEHOLDER_HINTS[hintIndex]}`

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:gap-3"
      >
        <div className="relative min-w-0 flex-1">
          <div className="flex min-h-11 w-full items-stretch rounded-xl border border-input bg-background shadow-sm transition-shadow focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50 sm:min-h-12">
            <Search className="pointer-events-none ml-3 h-4 w-4 shrink-0 self-center text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 120)}
              placeholder={placeholderText}
              className="min-h-11 min-w-0 flex-1 border-0 bg-transparent py-3 pl-2 pr-2 text-base outline-none ring-0 placeholder:text-muted-foreground focus:ring-0 sm:min-h-12 sm:text-sm"
            />
            <div className="flex shrink-0 items-center pr-1.5 sm:pr-2">
              <Button
                type="submit"
                size="sm"
                className="h-9 shrink-0 rounded-lg px-4 text-sm font-medium sm:h-10 sm:px-5"
              >
                搜索
              </Button>
            </div>
          </div>
          {open && items.length > 0 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-20 overflow-hidden rounded-xl border bg-background shadow-lg">
              {items.slice(0, 8).map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => submit(it.title)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {it.title}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex w-full shrink-0 items-center justify-center sm:w-auto sm:justify-end">
          <div className="relative h-11 w-max min-w-[8.75rem] shrink-0 sm:h-12 sm:min-w-[9.25rem]">
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div
                className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] motion-reduce:animate-none"
                style={{
                  background:
                    'conic-gradient(from 210deg, #2563eb 0deg, #7c3aed 55deg, #dc2626 115deg, #ea580c 165deg, #ca8a04 215deg, #16a34a 275deg, #0ea5e9 330deg, #2563eb 360deg)',
                  opacity: 0.95,
                }}
                aria-hidden
              />
            </div>
            <button
              type="button"
              onClick={aiAssist}
              className="absolute inset-[2px] z-10 flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-zinc-900/88 px-3.5 text-sm font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-sm transition-colors hover:bg-zinc-800/92 sm:gap-2 sm:px-4 sm:text-base"
            >
              <span
                className="relative inline-flex h-4 w-4 shrink-0 sm:h-[18px] sm:w-[18px]"
                aria-hidden
              >
                <Search
                  className="h-4 w-4 text-white sm:h-[18px] sm:w-[18px]"
                  strokeWidth={2}
                />
                <Sparkles
                  className="absolute -right-0.5 -top-1 h-2 w-2 text-amber-200/95 sm:h-2.5 sm:w-2.5"
                  strokeWidth={2.5}
                />
              </span>
              AI帮我找
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
