'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  MessageSquare,
  Headset,
  ArrowUp,
  Send,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Share2,
} from 'lucide-react'
import { useSession } from 'next-auth/react'

type NotificationRow = {
  id: string
  title: string
  body?: string | null
  kind: string
  isRead: boolean
  createdAt: string
  userId?: string | null
}

function summaryTitle(m: NotificationRow): string {
  if (m.kind === 'NEW_FOLLOW') return '有用户关注了你'
  return m.title
}

export default function RightSidebar() {
  const { data: session, status } = useSession()
  const isAuthed = status === 'authenticated' && !!session?.user?.id
  const [open, setOpen] = useState<null | 'messages' | 'feedback' | 'support'>(null)
  const [showTop, setShowTop] = useState(false)
  const [isSmall, setIsSmall] = useState(false)
  const [tempExpand, setTempExpand] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [msgs, setMsgs] = useState<NotificationRow[]>([])
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const stackRef = useRef<HTMLDivElement | null>(null)

  const [fbMessage, setFbMessage] = useState('')
  const [fbContact, setFbContact] = useState('')
  const [fbSending, setFbSending] = useState(false)
  const [fbError, setFbError] = useState('')
  const [fbOk, setFbOk] = useState(false)

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 500)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isSmall])

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const apply = () => {
      const next = !!mq.matches
      setIsSmall(next)
      // On narrow screens we default-collapse; clear temporary expand when leaving mobile.
      if (!next) {
        setTempExpand(false)
        setOpen(null)
      }
    }
    apply()
    mq.addEventListener?.('change', apply)
    return () => mq.removeEventListener?.('change', apply)
  }, [])

  useEffect(() => {
    // When a panel opens on mobile, ensure the stack is expanded.
    if (isSmall && open) setTempExpand(true)
  }, [isSmall, open])

  async function loadMsgs() {
    if (!isAuthed) return
    setLoadingMsgs(true)
    try {
      const r = await fetch('/api/notifications')
      const d = await r.json().catch(() => ({}))
      setMsgs((d.notifications || []) as NotificationRow[])
    } finally {
      setLoadingMsgs(false)
    }
  }

  async function loadMsgsQuiet() {
    if (!isAuthed) return
    try {
      const r = await fetch('/api/notifications')
      const d = await r.json().catch(() => ({}))
      setMsgs((d.notifications || []) as NotificationRow[])
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (open === 'messages') loadMsgs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAuthed])

  useEffect(() => {
    if (open !== 'messages') setExpandedIds(new Set())
  }, [open])

  async function markNotificationsRead(ids: string[]) {
    if (ids.length === 0) return
    const r = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (r.ok) {
      setMsgs((prev) => prev.map((m) => (ids.includes(m.id) ? { ...m, isRead: true } : m)))
    }
  }

  function toggleNotificationExpand(id: string) {
    const m = msgs.find((x) => x.id === id)
    const wasExpanded = expandedIds.has(id)
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    const willExpand = !wasExpanded
    if (willExpand && m && !m.isRead && m.userId) {
      void markNotificationsRead([id])
    }
  }

  useEffect(() => {
    if (!isAuthed) return
    const t = window.setInterval(() => loadMsgsQuiet(), 45000)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed])

  const unread = useMemo(() => msgs.filter((m) => !m.isRead).length, [msgs])
  // Mobile: default collapsed to avoid covering content; expand temporarily or when a panel is open.
  const collapsed = isSmall && !tempExpand && !open

  async function sendFeedback() {
    setFbError('')
    setFbOk(false)
    if (fbMessage.trim().length < 3) {
      setFbError('请至少填写 3 个字')
      return
    }
    setFbSending(true)
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'FEATURE', message: fbMessage, contact: fbContact }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setFbError(d.error || '提交失败')
        return
      }
      setFbOk(true)
      setFbMessage('')
    } finally {
      setFbSending(false)
    }
  }

  return (
    <>
      <div className="fixed right-2 sm:right-3 top-auto bottom-40 sm:top-1/3 sm:bottom-auto z-40 flex flex-col gap-2">
        <div ref={stackRef} className="flex flex-col gap-2">
          {collapsed ? (
            <div className="relative group">
              <button
                type="button"
                onClick={() => {
                  setTempExpand(true)
                  setTimeout(() => setTempExpand(false), 8000)
                }}
                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                aria-label="展开侧边栏"
                title="展开"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                  展开
                </div>
              </div>
            </div>
          ) : (
            <>
              {isSmall && (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setTempExpand(false)
                      setOpen(null)
                    }}
                    className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                    aria-label="收起侧边栏"
                    title="收起"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                      收起
                    </div>
                  </div>
                </div>
              )}

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setOpen(open === 'messages' ? null : 'messages')}
                  className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                  aria-label="系统通知"
                  title="系统通知"
                >
                  <Bell className="w-5 h-5" />
                  {isAuthed && unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center">
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </button>
                <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                    系统通知
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setOpen(open === 'feedback' ? null : 'feedback')}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                  aria-label="反馈"
                  title="反馈"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                    反馈
                  </div>
                </div>
              </div>

              <div className="relative group">
                <button
                  type="button"
                  onClick={() => setOpen(open === 'support' ? null : 'support')}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                  aria-label="客服"
                  title="客服"
                >
                  <Headset className="w-5 h-5" />
                </button>
                <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                    客服
                  </div>
                </div>
              </div>

              <div className="relative group">
                <Link
                  href="/share"
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
                  aria-label="分享本站"
                  title="分享本站"
                >
                  <Share2 className="w-5 h-5" />
                </Link>
                <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                    分享本站
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Back-to-top should not be affected by auto-collapse */}
        {showTop && (
          <div className="relative group">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border bg-background shadow-sm hover:bg-accent"
              aria-label="回顶部"
              title="回顶部"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div className="pointer-events-none absolute right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="rounded-md bg-popover border shadow px-2 py-1 text-xs whitespace-nowrap">
                回顶部
              </div>
            </div>
          </div>
        )}
      </div>

      {open && !collapsed && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={() => setOpen(null)}
          aria-hidden="true"
        />
      )}

      {open && !collapsed && (
        <div className="fixed right-3 top-1/4 z-50 w-[320px] max-w-[calc(100vw-24px)] rounded-2xl border bg-background shadow-xl">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {open === 'messages' ? (
              <div className="min-w-0">
                <div className="text-lg font-bold tracking-tight">系统通知</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">点击一条通知可展开详情；展开后标记为已读</p>
              </div>
            ) : (
              <div className="font-semibold text-sm">{open === 'feedback' ? '反馈' : '客服'}</div>
            )}
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="text-xs text-muted-foreground hover:text-foreground shrink-0"
            >
              关闭
            </button>
          </div>

          {open === 'messages' && (
            <div className="p-4">
              {!isAuthed ? (
                <div className="text-sm text-muted-foreground">
                  登录后可查看系统通知。{' '}
                  <Link href="/login" className="text-primary hover:underline font-medium">
                    去登录
                  </Link>
                </div>
              ) : loadingMsgs ? (
                <div className="text-sm text-muted-foreground">加载中...</div>
              ) : msgs.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无通知</div>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-auto pr-1">
                  {msgs.map((m) => {
                    const expanded = expandedIds.has(m.id)
                    const postMatch = m.body?.match(/\/posts\/([a-z0-9]+)/i)
                    const bodyText =
                      m.body?.replace(/\n查看[：:]\s*\/posts\/[^\s]+$/i, '').trim() ?? ''
                    return (
                      <div
                        key={m.id}
                        className={
                          'rounded-xl border overflow-hidden transition-colors ' +
                          (expanded ? 'bg-muted/30' : 'bg-card hover:bg-muted/20')
                        }
                      >
                        <button
                          type="button"
                          onClick={() => toggleNotificationExpand(m.id)}
                          className="w-full text-left px-3 py-3 flex items-start gap-2"
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-base font-semibold leading-snug text-foreground">
                              {summaryTitle(m)}
                            </span>
                            {!m.isRead && !expanded && (
                              <span className="block text-xs text-primary mt-1">点击可查看详情</span>
                            )}
                          </span>
                          <ChevronDown
                            className={
                              'w-5 h-5 shrink-0 text-muted-foreground transition-transform mt-0.5 ' +
                              (expanded ? 'rotate-180' : '')
                            }
                            aria-hidden
                          />
                        </button>
                        {expanded && (
                          <div className="px-3 pb-3 pt-0 border-t border-border/60 space-y-2">
                            {bodyText ? (
                              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pt-2">
                                {bodyText}
                              </div>
                            ) : null}
                            {postMatch && (
                              <Link
                                href={'/posts/' + postMatch[1]}
                                className="text-xs text-primary font-medium inline-block hover:underline"
                                onClick={() => setOpen(null)}
                              >
                                查看帖子
                              </Link>
                            )}
                            <div className="text-[10px] text-muted-foreground pt-1">
                              {new Date(m.createdAt).toLocaleString('zh-CN')}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {isAuthed && (
                <button
                  type="button"
                  onClick={loadMsgs}
                  className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                >
                  刷新
                </button>
              )}
            </div>
          )}

          {open === 'feedback' && (
            <div className="p-4 space-y-3">
              <div className="text-xs text-muted-foreground">功能性反馈 / 问题反馈，我们会持续优化。</div>
              <textarea
                value={fbMessage}
                onChange={(e) => setFbMessage(e.target.value)}
                className="w-full min-h-[110px] rounded-xl border bg-background px-3 py-2 text-sm"
                placeholder="请描述你想要的功能、遇到的问题、复现步骤等"
              />
              <input
                value={fbContact}
                onChange={(e) => setFbContact(e.target.value)}
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                placeholder="联系方式（选填：电话/微信/邮箱）"
              />
              {fbError && <div className="text-sm text-destructive">{fbError}</div>}
              {fbOk && <div className="text-sm text-green-600">已提交，感谢反馈！</div>}
              <button
                type="button"
                disabled={fbSending}
                onClick={sendFeedback}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {fbSending ? '提交中...' : '提交反馈'}
              </button>
            </div>
          )}

          {open === 'support' && (
            <div className="p-4 space-y-3 text-sm">
              <div className="text-muted-foreground">
                你可以通过以下方式联系我们（可先用“反馈”提交问题，我们会尽快处理）。
              </div>
              <div className="rounded-xl border p-3 space-y-2">
                <div>
                  <span className="text-muted-foreground">邮箱：</span>
                  <a className="text-primary hover:underline font-medium" href="mailto:support@huarenplaza.com">
                    support@huarenplaza.com
                  </a>
                </div>
                <div>
                  <span className="text-muted-foreground">电话：</span>
                  <a className="text-primary hover:underline font-medium" href="tel:+10000000000">
                    +1 (000) 000-0000
                  </a>
                </div>
                <div className="text-xs text-muted-foreground">
                  （可在后续接入在线客服/工单系统）
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

