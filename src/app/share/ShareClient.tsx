'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import BackToPrev from '@/components/BackToPrev'

export default function ShareClient(props: {
  authed: boolean
  shareUrl?: string
  inviteCode?: string
  freePinCredits?: number
}) {
  const { authed, shareUrl, inviteCode, freePinCredits } = props
  const [copied, setCopied] = useState(false)

  const displayUrl = useMemo(() => shareUrl || '', [shareUrl])

  async function copy() {
    if (!displayUrl) return
    try {
      await navigator.clipboard.writeText(displayUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  return (
    <div className="page-shell-narrow">
      <BackToPrev className="mb-6" />
      <div className="page-header">
        <h1 className="page-title">分享本站</h1>
        <p className="page-subtitle">
        已注册用户可以生成专属分享链接（自动附带你的邀请码）。对方通过你的链接注册并在本站成功发出<strong className="font-semibold">第一条帖子</strong>后，
        你和对方都会自动获得<strong className="font-semibold">1 天免费置顶</strong>额度（可在发布时或“我的发布”里使用）。
        </p>
      </div>

      {!authed ? (
        <div className="panel-card-strong space-y-4 p-6">
          <div className="text-sm">
            <div className="font-medium mb-1">请先登录</div>
            <div className="text-muted-foreground">登录后才可以生成你的专属分享链接。</div>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/login">去登录</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/register">去注册</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="panel-card-strong space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">你的邀请码</div>
              <div className="text-muted-foreground text-sm">{inviteCode || '—'}</div>
            </div>
            <div className="text-sm">
              <div className="font-medium">免费置顶额度</div>
              <div className="text-muted-foreground">{Number.isFinite(freePinCredits) ? `${freePinCredits} 天` : '—'}</div>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium mb-2">你的分享链接</div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded-xl border border-input/90 bg-background/90 px-3 py-2.5 text-sm shadow-sm shadow-black/5"
                value={displayUrl}
                readOnly
              />
              <Button
                type="button"
                size="lg"
                className="shrink-0 px-5"
                onClick={copy}
                disabled={!displayUrl}
              >
                {copied ? '已复制' : '复制'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              把上面的链接发给朋友即可。对方打开后注册页面会自动填写邀请码。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

