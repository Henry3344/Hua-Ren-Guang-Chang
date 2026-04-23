'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, Building2, Plus, X } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import { getPlacementLabel, isAdPlacement } from '@/lib/adConstants'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import {
  US_STATES,
  formatAddressList,
  formatUsStateLabel,
  type StructuredAddress,
} from '@/lib/usStates'

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

const MAX_ADDRESSES = 10

function emptyAddress(): StructuredAddress {
  return { line1: '', line2: '', city: '', stateCode: '' }
}

function isAddressFilled(a: StructuredAddress): boolean {
  return (
    a.line1.trim() !== '' ||
    (a.line2 ?? '').trim() !== '' ||
    a.city.trim() !== '' ||
    a.stateCode.trim() !== ''
  )
}

function MerchantApplyInner() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const placementParam = searchParams.get('placement')
  const placementLabel =
    placementParam && isAdPlacement(placementParam) ? getPlacementLabel(placementParam) : null
  const merchantHref =
    placementParam && isAdPlacement(placementParam)
      ? `/merchant?placement=${encodeURIComponent(placementParam)}`
      : '/merchant'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<{
    companyName: string
    category: (typeof MERCHANT_CATEGORIES)[number]
    phone: string
    email: string
    businessScope: string
  }>({
    companyName: '',
    category: MERCHANT_CATEGORIES[0],
    phone: '',
    email: '',
    businessScope: '',
  })
  const [addresses, setAddresses] = useState<StructuredAddress[]>([emptyAddress()])
  const [licenseImage, setLicenseImage] = useState<string[]>([])
  const checkoutCancelled = searchParams.get('checkout') === 'cancelled'

  const isDirty = useMemo(() => {
    if (submitted) return false
    return (
      form.companyName.trim() !== '' ||
      form.phone.trim() !== '' ||
      form.email.trim() !== '' ||
      form.businessScope.trim() !== '' ||
      form.category !== MERCHANT_CATEGORIES[0] ||
      addresses.some(isAddressFilled) ||
      licenseImage.length > 0
    )
  }, [submitted, form, addresses, licenseImage])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开商家入驻申请页面，当前填写内容将不会保留，确认离开吗？',
  })

  if (status === 'loading') {
    return <div className="text-center py-20 text-muted-foreground">加载中...</div>
  }
  if (!session) {
    const loginCallback =
      placementParam && isAdPlacement(placementParam)
        ? `/merchant/apply?placement=${encodeURIComponent(placementParam)}`
        : '/merchant/apply'
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">请先登录</p>
        <Button asChild>
          <Link href={`/login?callbackUrl=${encodeURIComponent(loginCallback)}`}>去登录</Link>
        </Button>
      </div>
    )
  }

  const field =
    'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'

  function patchAddress(index: number, patch: Partial<StructuredAddress>) {
    setAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)))
  }

  function addAddress() {
    if (addresses.length >= MAX_ADDRESSES) return
    setAddresses((prev) => [...prev, emptyAddress()])
  }

  function removeAddress(index: number) {
    setAddresses((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!licenseImage[0]) {
      setError('请上传营业执照图片')
      return
    }
    const filled = addresses.filter(isAddressFilled)
    if (filled.length === 0) {
      setError('请至少填写一个公司地址')
      return
    }
    for (const [i, a] of filled.entries()) {
      if (!a.line1.trim() || !a.city.trim() || !a.stateCode.trim()) {
        setError(`第 ${i + 1} 个地址请完整填写：地址 1、市、州为必填项`)
        return
      }
    }
    const addressSerialized = formatAddressList(filled)
    setLoading(true)
    setError('')
    const res = await fetch('/api/merchant/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        address: addressSerialized,
        licenseImage: licenseImage[0],
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setLoading(false)
      setError(data.error || '提交失败')
      return
    }
    if (data.reviewOnly) {
      setLoading(false)
      setSubmitted(true)
      return
    }
    const checkoutRes = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'MERCHANT_APPLY',
        merchantId: data.merchant.id,
      }),
    })
    const checkoutData = await checkoutRes.json()
    setLoading(false)
    if (!checkoutRes.ok || !checkoutData.url) {
      setError(checkoutData.error || '创建支付订单失败')
      return
    }
    router.push(checkoutData.url)
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-safe py-16 text-center">
        <BackToPrev className="mb-8" fallbackHref={merchantHref} />
        <Building2 className="w-14 h-14 text-primary mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">提交成功</h1>
        <p className="text-muted-foreground mb-8">
          您的商家入驻申请已提交，当前状态：
          <span className="font-medium text-foreground">审核中</span>
        </p>
        <Button asChild>
          <Link href={merchantHref}>返回商家中心</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-safe py-8">
      {LeaveDialog}
      <BackToPrev className="mb-6" fallbackHref={merchantHref} onBeforeNavigate={onBeforeNavigate} />
      <h1 className="text-2xl font-bold mb-2">商家入驻</h1>
      <p className="text-sm text-muted-foreground mb-4">
        请如实填写以下信息。提交后将进入 Stripe 支付审核费，支付成功后我们才会开始审核。
      </p>
      {checkoutCancelled && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          你刚刚取消了支付。申请信息仍会保留，你可以重新提交并完成付款。
        </div>
      )}
      {placementLabel && (
        <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          <span className="text-muted-foreground">意向广告位：</span>
          <span className="font-medium text-foreground">{placementLabel}</span>
          <span className="text-muted-foreground">
            （审核通过后在商家中心创建广告时将默认选中该位置）
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="border rounded-xl p-6 bg-card space-y-4 shadow-sm">
        <div>
          <label className="text-sm font-medium mb-1 block">
            公司名称 <span className="text-destructive">*</span>
          </label>
          <input
            required
            value={form.companyName}
            onChange={(e) => setForm({ ...form, companyName: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            商家分类 <span className="text-destructive">*</span>
          </label>
          <select
            required
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as (typeof MERCHANT_CATEGORIES)[number],
              })
            }
            className={field}
          >
            {MERCHANT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            公司电话 <span className="text-destructive">*</span>
          </label>
          <input
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            公司邮箱 <span className="text-destructive">*</span>
          </label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
          />
        </div>

        {/* ---------------- 公司地址（可多个） ---------------- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium block">
              公司地址 <span className="text-destructive">*</span>
              <span className="text-xs font-normal text-muted-foreground ml-2">
                {addresses.length > 1 ? `· 共 ${addresses.length} 个` : '· 如有分店可添加多个'}
              </span>
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addAddress}
              disabled={addresses.length >= MAX_ADDRESSES}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
              添加地址
            </Button>
          </div>

          {addresses.map((a, i) => (
            <div
              key={i}
              className="relative rounded-lg border border-border/80 bg-muted/30 p-3 sm:p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-foreground/80">
                  地址 {i + 1}
                  {i === 0 && (
                    <span className="ml-2 text-muted-foreground font-normal">（主地址）</span>
                  )}
                </p>
                {addresses.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddress(i)}
                    aria-label={`删除地址 ${i + 1}`}
                    className="rounded p-1 text-muted-foreground hover:bg-background hover:text-destructive transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  地址 1（街道门牌） <span className="text-destructive">*</span>
                </label>
                <input
                  required={i === 0}
                  value={a.line1}
                  onChange={(e) => patchAddress(i, { line1: e.target.value })}
                  placeholder="如：123 Main St"
                  className={field}
                />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  地址 2（楼层/单元，可选）
                </label>
                <input
                  value={a.line2 ?? ''}
                  onChange={(e) => patchAddress(i, { line2: e.target.value })}
                  placeholder="如：Suite 200 / Apt 5B"
                  className={field}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    市 <span className="text-destructive">*</span>
                  </label>
                  <input
                    required={i === 0}
                    value={a.city}
                    onChange={(e) => patchAddress(i, { city: e.target.value })}
                    placeholder="如：Cupertino"
                    className={field}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    州 <span className="text-destructive">*</span>
                  </label>
                  <select
                    required={i === 0}
                    value={a.stateCode}
                    onChange={(e) => patchAddress(i, { stateCode: e.target.value })}
                    className={field}
                  >
                    <option value="" disabled>
                      请选择州
                    </option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {formatUsStateLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">国家</label>
                <input
                  value="美国 (USA)"
                  readOnly
                  disabled
                  className={field + ' cursor-not-allowed opacity-70'}
                />
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">
            多个地址将按以下标准美式格式统一提交：
            <br />
            <span className="font-mono text-[11px]">
              地址 1 / 地址 2（若有） / 市, 州, 美国
            </span>
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            营业执照 <span className="text-destructive">*</span>
          </label>
          <ImageUpload value={licenseImage} onChange={setLicenseImage} max={1} />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">
            主营业务 <span className="text-destructive">*</span>
          </label>
          <textarea
            required
            value={form.businessScope}
            onChange={(e) => setForm({ ...form, businessScope: e.target.value })}
            className={field + ' min-h-[100px] resize-y'}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          提交并前往支付
        </Button>
      </form>
    </div>
  )
}

export default function MerchantApplyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-muted-foreground">加载中...</div>}>
      <MerchantApplyInner />
    </Suspense>
  )
}
