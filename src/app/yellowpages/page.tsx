'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Store, Phone, Mail, MapPin, Pin } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'

const MERCHANT_CATEGORIES = [
  '餐饮美食',
  '美容美发',
  '家政保洁',
  '搬家运输',
  '房产中介',
  '律师会计',
  '汽车服务',
  '教育培训',
  '医疗保健',
  '旅游机票',
  '装修建材',
  '其他',
] as const

type Merchant = {
  id: string
  companyName: string
  category: string
  phone: string
  email: string
  address: string
  businessScope: string
  isPinned: boolean
}

export default function YellowPagesPage() {
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [error, setError] = useState('')

  const categoryPills = useMemo(() => ['', ...MERCHANT_CATEGORIES], [])

  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true)
      setError('')
    })
    const p = new URLSearchParams()
    if (category) p.set('category', category)
    fetch('/api/yellowpages/merchants?' + p.toString())
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) {
          setError(d.error || '加载失败')
          setMerchants([])
          return
        }
        setMerchants(Array.isArray(d.merchants) ? d.merchants : [])
      })
      .catch(() => {
        setError('加载失败')
        setMerchants([])
      })
      .finally(() => setLoading(false))
  }, [category])

  return (
    <div className="page-shell">
      <BackToPrev className="mb-6" />
      <div className="page-header">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-primary" />
          <h1 className="page-title">商家黄页</h1>
        </div>
        <p className="page-subtitle">已入驻商家一览，可按分类筛选，优先查看你所在地区的本地服务。</p>
      </div>

      <div className="panel-card mb-6 p-4 sm:p-5">
        <div className="mb-3 text-sm font-medium text-foreground">按分类浏览</div>
        <div className="flex flex-wrap gap-2">
        {categoryPills.map((c) => (
          <button
            key={c || 'all'}
            type="button"
            onClick={() => setCategory(c)}
            className={
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ' +
              (category === c
                ? 'border-primary/20 bg-primary text-primary-foreground shadow-sm'
                : 'border-border/70 bg-background/80 text-muted-foreground hover:bg-accent/70 hover:text-foreground')
            }
          >
            {c || '全部'}
          </button>
        ))}
        </div>
      </div>

      {error && (
        <div className="info-banner mb-6 border-destructive/30 bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="empty-state">加载中...</div>
      ) : merchants.length === 0 ? (
        <div className="empty-state">暂无商家</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {merchants.map((m) => (
            <Link
              key={m.id}
              href={'/yellowpages/' + m.id}
              className="panel-card group p-5 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold group-hover:text-primary">{m.companyName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{m.category}</div>
                </div>
                {m.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300">
                    <Pin className="h-3 w-3" />置顶
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span className="line-clamp-1">
                    {m.address.split(/\n\s*\n/)[0]?.split('\n')[0] || m.address}
                    {(() => {
                      const branchCount = m.address.split(/\n\s*\n/).filter((s) => s.trim()).length
                      return branchCount > 1 ? (
                        <span className="ml-1 text-xs text-primary">+{branchCount - 1} 家分店</span>
                      ) : null
                    })()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span className="line-clamp-1">{m.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span className="line-clamp-1">{m.email}</span>
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                {m.businessScope}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="panel-subtle mt-10 p-5 text-sm text-muted-foreground">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>我是商家？通过审核后可展示在黄页中。</div>
          <Button asChild variant="outline" size="sm">
            <Link href="/merchant/apply">去申请入驻</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

