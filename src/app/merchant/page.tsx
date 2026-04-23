'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- merchant dashboard payloads from multiple endpoints */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Megaphone, Loader2, RefreshCw, CheckCircle, CreditCard, AlertCircle } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import {
  AD_PLACEMENTS,
  AD_TYPES,
  getAdTypeLabel,
  getPlacementLabel,
  isAdPlacement,
} from '@/lib/adConstants'

function MerchantInner() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clock, setClock] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 60000)
    return () => window.clearInterval(id)
  }, [])
  const [merchant, setMerchant] = useState<any | null | undefined>(undefined)
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [renewing, setRenewing] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({
    type: 'BANNER',
    placement: 'HOME_TOP_LEFT',
    targetUrl: '',
    postId: '',
    startAt: '',
    endAt: '',
  })
  const [formErr, setFormErr] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const merchantPaid = searchParams.get('merchantPaid') === '1'
  const adPaid = searchParams.get('adPaid') === '1'
  const renewed = searchParams.get('renewed') === '1'
  const checkoutCancelled = searchParams.get('checkout') === 'cancelled'

  const formRef = useRef(form)
  useEffect(() => {
    formRef.current = form
  }, [form])
  const [adFormBaseline, setAdFormBaseline] = useState<string | null>(null)

  useEffect(() => {
    if (!formOpen) {
      queueMicrotask(() => setAdFormBaseline(null))
      return
    }
    const t = window.setTimeout(() => {
      setAdFormBaseline(JSON.stringify(formRef.current))
    }, 180)
    return () => window.clearTimeout(t)
  }, [formOpen])

  const isAdFormDirty = useMemo(() => {
    if (!formOpen || adFormBaseline === null) return false
    return JSON.stringify(form) !== adFormBaseline
  }, [formOpen, form, adFormBaseline])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty: isAdFormDirty,
    message: '将离开当前页面，未提交的新建广告内容将不会保留，确认离开吗？',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      const p = searchParams.get('placement')
      const suffix = p ? `?placement=${encodeURIComponent(p)}` : ''
      router.push(`/login?callbackUrl=${encodeURIComponent('/merchant' + suffix)}`)
      return
    }
    if (status === 'authenticated') {
      ;(async () => {
        try {
          setLoadError('')
          const [meRes, adsRes] = await Promise.all([
            fetch('/api/merchant/me'),
            fetch('/api/merchant/ads'),
          ])
          const meText = await meRes.text()
          const adsText = await adsRes.text()
          const meData = meText ? JSON.parse(meText) : {}
          const adsData = adsText ? JSON.parse(adsText) : {}
          setMerchant(meData.merchant ?? null)
          if (!adsRes.ok) {
            setLoadError(adsData.error || '广告列表加载失败')
            setAds([])
          } else {
            setAds(adsData.ads || [])
          }
          setLoading(false)
        } catch {
          setLoadError('加载失败，请刷新重试')
          setAds([])
          setMerchant(null)
          setLoading(false)
        }
      })()
    }
  }, [status, router, searchParams])

  function timeLeft(endAt: string) {
    const t = new Date(endAt).getTime() - clock
    if (t <= 0) return '已结束'
    const d = Math.floor(t / 86400000)
    const h = Math.floor((t % 86400000) / 3600000)
    const m = Math.floor((t % 3600000) / 60000)
    return d > 0 ? `${d}天${h}小时` : h > 0 ? `${h}小时${m}分` : `${m}分钟`
  }

  async function patchAd(id: string, body: Record<string, boolean>) {
    setSaving(id)
    await fetch('/api/merchant/ads/' + id, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setAds((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...body } : a)),
    )
    setSaving(null)
  }

  async function renew(id: string) {
    setRenewing(id)
    const res = await fetch('/api/merchant/ads/' + id + '/renew', { method: 'POST' })
    const d = await res.json()
    setRenewing(null)
    if (d.url) {
      window.location.assign(d.url)
      return
    }
    alert(d.error || d.message || '续费失败')
  }

  async function submitNew(e: React.FormEvent) {
    e.preventDefault()
    setFormErr('')
    if (!form.startAt || !form.endAt) {
      setFormErr('请选择开始与结束时间')
      return
    }
    if (form.type === 'PINNED' && !form.postId.trim()) {
      setFormErr('置顶广告需填写帖子 ID')
      return
    }
    setFormLoading(true)
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: form.type,
        placement: form.placement,
        targetUrl: form.targetUrl.trim() || undefined,
        postId: form.type === 'PINNED' ? form.postId.trim() : undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setFormLoading(false)
      setFormErr(data.error || '创建失败')
      return
    }
    const checkoutRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'AD_PURCHASE',
        adId: data.ad.id,
      }),
    })
    const checkoutData = await checkoutRes.json()
    setFormLoading(false)
    if (!checkoutRes.ok || !checkoutData.url) {
      setFormErr(checkoutData.error || '创建支付订单失败')
      return
    }
    setAds((prev) => [data.ad, ...prev])
    setFormOpen(false)
    const p = searchParams.get('placement')
    const nextPlacement = p && isAdPlacement(p) ? p : 'HOME_TOP_LEFT'
    setForm({
      type: 'BANNER',
      placement: nextPlacement,
      targetUrl: '',
      postId: '',
      startAt: '',
      endAt: '',
    })
    window.location.assign(checkoutData.url)
  }

  useEffect(() => {
    const p = searchParams.get('placement')
    if (!p || !isAdPlacement(p)) return
    queueMicrotask(() => {
      setForm((f) => ({ ...f, placement: p }))
      if (merchant?.status === 'APPROVED') {
        setFormOpen(true)
      }
    })
  }, [searchParams, merchant])

  const placementFromUrl = searchParams.get('placement')
  const applyHref =
    placementFromUrl && isAdPlacement(placementFromUrl)
      ? `/merchant/apply?placement=${encodeURIComponent(placementFromUrl)}`
      : '/merchant/apply'

  if (status === 'loading' || loading || merchant === undefined) {
    return <div className="text-center py-20 text-muted-foreground">加载中...</div>
  }

  if (merchant === null) {
    return (
      <div className="max-w-lg mx-auto px-safe py-16 text-center">
        <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">商家中心</h1>
        <p className="text-muted-foreground mb-8">您尚未提交商家入驻申请，通过审核后可管理广告与数据。</p>
        <Button asChild>
          <Link href={applyHref}>去申请入驻</Link>
        </Button>
      </div>
    )
  }

  if (merchant.status === 'PENDING') {
    return (
      <div className="max-w-lg mx-auto px-safe py-16 text-center">
        <Megaphone className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">审核中</h1>
        <p className="text-muted-foreground mb-2">您的商家入驻申请正在审核，请耐心等待。</p>
        <p className="text-sm text-muted-foreground mb-8">审核完成前无法使用商家广告功能。</p>
        <Button asChild variant="outline">
          <Link href="/dashboard">返回我的发布</Link>
        </Button>
      </div>
    )
  }

  if (merchant.status === 'PENDING_PAYMENT') {
    return (
      <div className="max-w-lg mx-auto px-safe py-16 text-center">
        <CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">待完成支付</h1>
        <p className="text-muted-foreground mb-3">你的商家资料已保存，完成 Stripe 支付后我们才会开始审核。</p>
        <p className="text-sm text-muted-foreground mb-8">如曾取消付款，可重新提交申请并继续支付。</p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/merchant/apply">继续支付</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">返回我的发布</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (merchant.status === 'REJECTED') {
    return (
      <div className="max-w-lg mx-auto px-safe py-16 text-center">
        <h1 className="text-xl font-bold mb-2">审核未通过</h1>
        <p className="text-muted-foreground mb-8">你可以修改资料后重新提交审核，无需再次支付入驻费。</p>
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/merchant/apply">修改并重新提交</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-safe py-8">
      {LeaveDialog}
      <BackToPrev className="mb-6" onBeforeNavigate={onBeforeNavigate} />
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Megaphone className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold">商家中心 · 广告</h1>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">我的发布</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        管理投放中的广告、查看曝光与点击，并通过 Stripe 购买或续费广告位。
      </p>

      {(merchantPaid || adPaid || renewed || checkoutCancelled) && (
        <div
          className={
            'mb-6 rounded-xl border px-4 py-3 text-sm ' +
            (checkoutCancelled
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-green-200 bg-green-50 text-green-800')
          }
        >
          <div className="flex items-start gap-2">
            {checkoutCancelled ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>
              {merchantPaid
                ? '入驻费支付成功，申请已进入审核队列。'
                : adPaid
                  ? '广告支付成功，广告位将在设定时间内开始投放。'
                  : renewed
                    ? '广告续费成功，投放时长已延长。'
                    : '你刚刚取消了支付，可稍后重新发起。'}
            </span>
          </div>
        </div>
      )}

      {loadError && (
        <div className="mb-6 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
          {loadError}
        </div>
      )}

      <div className="mb-6">
        <Button type="button" variant="secondary" onClick={() => setFormOpen(!formOpen)}>
          {formOpen ? '收起' : '新建广告'}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={submitNew} className="border rounded-xl p-6 bg-card mb-8 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">类型</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {AD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {getAdTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">位置</label>
              <select
                value={form.placement}
                onChange={(e) => setForm({ ...form, placement: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {AD_PLACEMENTS.map((p) => (
                  <option key={p} value={p}>
                    {getPlacementLabel(p)}
                  </option>
                ))}
              </select>
              {form.placement.startsWith('HOME_TOP') && (
                <p className="text-xs text-muted-foreground mt-1">
                  展示位置：首页安全提示条下方、与「猜你喜欢」之间
                </p>
              )}
            </div>
          </div>
          {form.type === 'PINNED' && (
            <div>
              <label className="text-sm font-medium mb-1 block">帖子 ID（您的帖子）</label>
              <input
                value={form.postId}
                onChange={(e) => setForm({ ...form, postId: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="cuid..."
              />
            </div>
          )}
          {(form.type === 'BANNER' || form.type === 'INLINE') && (
            <div>
              <label className="text-sm font-medium mb-1 block">跳转链接（可选）</label>
              <input
                value={form.targetUrl}
                onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                placeholder="https:// 或站内路径 /posts/xxx"
              />
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">开始时间</label>
              <input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">结束时间</label>
              <input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          {formErr && <p className="text-sm text-destructive">{formErr}</p>}
          <Button type="submit" disabled={formLoading}>
            {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            提交
          </Button>
        </form>
      )}

      <div className="border rounded-xl overflow-hidden bg-card">
        {ads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">暂无广告，点击「新建广告」创建</div>
        ) : (
          <div className="divide-y">
            {ads.map((ad) => (
              <div key={ad.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 text-xs mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-muted font-medium">{getAdTypeLabel(ad.type)}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {getPlacementLabel(ad.placement)}
                    </span>
                    {ad.paymentStatus !== 'COMPLETED' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">待支付</span>
                    )}
                    {!ad.isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">已暂停</span>
                    )}
                  </div>
                  {ad.post && (
                    <p className="text-sm text-muted-foreground">关联帖子：{ad.post.title}</p>
                  )}
                  <p className="text-sm mt-1">
                    剩余：<span className="font-medium text-foreground">{timeLeft(ad.endAt)}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    曝光 {ad.impressions}
                    <span className="text-muted-foreground mx-1">·</span>
                    点击 {ad.clicks}
                  </p>
                  {ad.paymentStatus !== 'COMPLETED' && (
                    <p className="mt-1 text-xs text-amber-700">
                      尚未支付，广告不会在前台展示。完成支付后将自动按所选时间段投放。
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {ad.paymentStatus !== 'COMPLETED' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setSaving(ad.id)
                        const res = await fetch('/api/stripe/checkout', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ kind: 'AD_PURCHASE', adId: ad.id }),
                        })
                        const data = await res.json()
                        setSaving(null)
                        if (data.url) {
                          window.location.assign(data.url)
                          return
                        }
                        alert(data.error || '支付创建失败')
                      }}
                      disabled={saving === ad.id}
                    >
                      {saving === ad.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4 mr-1" />}
                      去支付
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => renew(ad.id)}
                    disabled={renewing === ad.id || ad.paymentStatus !== 'COMPLETED'}
                  >
                    {renewing === ad.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    续费
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => patchAd(ad.id, { autoRenew: !ad.autoRenew })}
                    disabled={saving === ad.id || ad.paymentStatus !== 'COMPLETED'}
                  >
                    {ad.autoRenew ? '关闭自动续费' : '开启自动续费'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => patchAd(ad.id, { isActive: !ad.isActive })}
                    disabled={saving === ad.id || ad.paymentStatus !== 'COMPLETED'}
                  >
                    {ad.isActive ? '暂停投放' : '恢复投放'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MerchantPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">加载中...</div>}>
      <MerchantInner />
    </Suspense>
  )
}
