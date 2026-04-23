'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Store, Pin } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'

type Merchant = {
  id: string
  companyName: string
  category: string
  phone: string
  email: string
  address: string
  businessScope: string
  isPinned: boolean
  createdAt: string
}

export default function YellowPageDetail({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    params.then(({ id }) => {
      setLoading(true)
      setError('')
      fetch('/api/yellowpages/merchants/' + id)
        .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
        .then(({ ok, d }) => {
          if (!ok) {
            setError(d.error || '加载失败')
            setMerchant(null)
            return
          }
          setMerchant(d.merchant || null)
        })
        .catch(() => {
          setError('加载失败')
          setMerchant(null)
        })
        .finally(() => setLoading(false))
    })
  }, [params])

  if (loading) return <div className="text-center py-20 text-muted-foreground">加载中...</div>

  if (!merchant) {
    return (
      <div className="page-shell-narrow py-16 text-center">
        <div className="panel-subtle px-6 py-12 text-muted-foreground">{error || '商家不存在'}</div>
        <Button variant="outline" onClick={() => router.push('/yellowpages')}>
          返回黄页
        </Button>
      </div>
    )
  }

  return (
    <div className="page-shell-narrow">
      <BackToPrev className="mb-6" fallbackHref="/yellowpages" />

      <div className="panel-card-strong p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Store className="h-5 w-5 text-primary" />
              <h1 className="truncate text-2xl font-semibold tracking-tight">{merchant.companyName}</h1>
              {merchant.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-500/15 dark:text-amber-300">
                  <Pin className="h-3 w-3" />置顶
                </span>
              )}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">{merchant.category}</div>
          </div>
          <div className="shrink-0 text-xs text-muted-foreground">
            入驻时间：{new Date(merchant.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        <div className="mt-6 grid gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <span className="whitespace-pre-line leading-relaxed">{merchant.address}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a className="text-primary hover:underline" href={'tel:' + merchant.phone}>
              {merchant.phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a className="text-primary hover:underline" href={'mailto:' + merchant.email}>
              {merchant.email}
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-border/70 pt-6">
          <h2 className="mb-2 text-base font-semibold tracking-tight">商家介绍</h2>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {merchant.businessScope}
          </p>
        </div>
      </div>
    </div>
  )
}

