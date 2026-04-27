'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useSiteLocation } from '@/contexts/SiteLocationContext'
import { locationToQuery } from '@/lib/locationPrefs'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import { MSG_OFFTOPIC } from '@/lib/aiChatGuard'
import PostCard from '@/components/PostCard'
import AiRankFeedbackPostCard from '@/components/AiRankFeedbackPostCard'
import AiChatMarkdown, { markdownToPlainText } from '@/components/AiChatMarkdown'
import type { AiRagPostCard } from '@/lib/aiRagPostCard'
import {
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Loader2,
  Share2,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react'

const AI_DISCLAIMER =
  '内容由 AI 总结本站数据后生成，仅供参考；进行任何交易前请认准站内信息与信用分，谨防诈骗。'

/** 接口异常或 content 为空时的兜底，避免气泡空白 */
const FALLBACK_ASSISTANT_TEXT = MSG_OFFTOPIC

const WELCOME_ASSISTANT_CONTENT = `你好，我是「华人广场」AI助手。

我可以帮你：
- 找本地房源
- 找二手商品
- 找适合你的工作
- 找本地商家

你可以尽量补充 **预算、地区、品牌、岗位** 等关键信息，我会更快帮你缩小范围。`

type Msg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  tone?: 'default' | 'system'
  /** 前端用逐字显示回复时标记流式态，避免整段答案突然出现。 */
  isStreaming?: boolean
  latencyMs?: number
  /** RAG 命中的帖子卡片（与站内列表同源） */
  ragPosts?: AiRagPostCard[]
  /** 与 ragPosts 顺序对齐的推荐解释标签（按 postId 关联） */
  recommendationChips?: { postId: string; chips: string[] }[]
  /** 无匹配时的"分类导航"按钮组：用户可直接跳到对应列表页自行浏览 */
  ctaList?: { href: string; label: string; kind?: 'primary' | 'default' }[]
  /** 服务端写入 AiSearchTrace，用于点击/停留学习 */
  rankingTraceId?: string
  /** 便于确认是否走 Groq→Schema→检索 */
  extraction?: {
    retrievalQuery: string
    searchQueryUsed?: string
    queryRewrite?:
      | { ok: true; from: string; variants: string[]; model?: string; weakFallbackUsed?: boolean }
      | { ok: false; error?: string; skipped?: boolean; reason?: string; threshold?: number }
    progressiveRetrieval?: {
      mode: 'short_circuit' | 'expanded' | 'original_only'
      minPostsThreshold?: number
      originalHitsFirstPass?: number
    }
    mergeTracks?: {
      mode: 'single' | 'unified_score'
      scoring?: string
      trackCount?: number
      multiTrackOverlapCount?: number
      [key: string]: unknown
    }
    trackDebug?: Array<{
      key: string
      query: string
      hitCount: number
      poolSize: number
      top1Title: string | null
      hitRatioPct: number
    }>
    relaxedRecallPrefix?: boolean
    keywordPipeline: string
    groq:
      | { ok: true; model: string }
      | { ok: false; error?: string; model?: string }
  }
}

export default function AiSearchChatClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const { pref } = useSiteLocation()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  /** 每条助手消息的即时交互反馈状态（点赞/点踩/已复制/已分享）。 */
  const [msgFeedback, setMsgFeedback] = useState<
    Record<
      string,
      {
        vote?: 'up' | 'down'
        voteBusy?: boolean
        copied?: boolean
        shared?: boolean
      }
    >
  >({})
  const scrollRef = useRef<HTMLDivElement>(null)
  const initRef = useRef(false)
  const messagesRef = useRef<Msg[]>([])
  const rankClickSeqRef = useRef<Map<string, number>>(new Map())
  const feedbackTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const replyTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  /** 有用户发言、或除首条欢迎外还有其它气泡、或请求中，离开需确认 */
  const isChatDirty =
    loading ||
    messages.some((m) => m.role === 'user') ||
    messages.length > 1
  const hasStreamingAssistant = messages.some((m) => m.role === 'assistant' && m.isStreaming)

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty: isChatDirty,
    title: '确认离开？',
    message:
      '离开或关闭本页面后，当前对话记录将全部清空。若需打开站内帖子或搜索结果，请使用「在新标签打开」以免丢失当前对话。',
  })

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const fetchReply = useCallback(
    async (history: { role: 'user' | 'assistant'; content: string }[]) => {
      const res = await fetch('/api/ai-search/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          location: locationToQuery(pref),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 401) {
        const dest =
          typeof window !== 'undefined'
            ? window.location.pathname + window.location.search
            : '/ai-search'
        router.replace(`/login?callbackUrl=${encodeURIComponent(dest)}`)
        throw new Error('__AI_AUTH_REDIRECT__')
      }
      if (res.status === 429) {
        throw new Error(
          typeof data.error === 'string' ? data.error : '操作频繁，过会儿再试。',
        )
      }
      if (res.status === 503) {
        throw new Error(
          typeof data.error === 'string' ? data.error : '当前使用人数较多，请稍后再试。',
        )
      }
      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : '请求失败')
      }
      return data as {
        content: string
        latencyMs?: number
        ragPosts?: AiRagPostCard[]
        rankingTraceId?: string
        recommendationChips?: Msg['recommendationChips']
        ctaList?: Msg['ctaList']
        structuredQuery?: unknown
        extraction?: Msg['extraction']
        messageTone?: Msg['tone']
      }
    },
    [pref, router],
  )

  const revealAssistantReply = useCallback(
    async (
      msgId: string,
      finalText: string,
      opts?: {
        initialChars?: number
      },
    ) => {
      const text = finalText.trim() || FALLBACK_ASSISTANT_TEXT
      let index = Math.min(text.length, Math.max(0, opts?.initialChars ?? 0))

      await new Promise<void>((resolve) => {
        const push = () => {
          const ch = text[index]
          if (index < text.length) {
            const step =
              ch == null
                ? 0
                : ch === '\n'
                  ? 1
                  : /[。！？；，、,.!?;:]/.test(ch)
                    ? 1
                    : /[A-Za-z0-9]/.test(ch)
                      ? 4
                      : 2
            index = Math.min(text.length, index + Math.max(1, step))
          }
          const partial = text.slice(0, index)
          setMessages((prev) =>
            prev.map((m) => (m.id === msgId ? { ...m, content: partial, isStreaming: true } : m)),
          )
          if (index >= text.length) {
            replyTimers.current.delete(msgId)
            resolve()
            return
          }
          const delay =
            ch === '\n'
              ? 70
              : /[。！？；]/.test(ch ?? '')
                ? 95
                : /[，、,.!?]/.test(ch ?? '')
                  ? 55
                  : 22
          const timer = setTimeout(push, delay)
          replyTimers.current.set(msgId, timer)
        }
        push()
      })
    },
    [],
  )

  const sendUserMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || loading) return

      const userMsg: Msg = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
      }
      const nextThread = [...messagesRef.current, userMsg]
      messagesRef.current = nextThread
      setMessages(nextThread)
      setInput('')
      setLoading(true)
      try {
        const history = nextThread.map((m) => ({
          role: m.role,
          content: m.content,
        }))
        const data = await fetchReply(history)
        const replyText =
          typeof data.content === 'string' && data.content.trim() !== ''
            ? data.content
            : FALLBACK_ASSISTANT_TEXT
        const assistantId = crypto.randomUUID()
        const placeholderMsg: Msg = {
          id: assistantId,
          role: 'assistant',
          content: '',
          tone: data.messageTone ?? 'default',
          isStreaming: true,
        }
        const withPlaceholder = [...messagesRef.current, placeholderMsg]
        messagesRef.current = withPlaceholder
        setMessages(withPlaceholder)

        await revealAssistantReply(assistantId, replyText)

        const assistantMsg: Msg = {
          id: assistantId,
          role: 'assistant',
          content: replyText,
          tone: data.messageTone ?? 'default',
          isStreaming: false,
          latencyMs: data.latencyMs,
          ragPosts:
            Array.isArray(data.ragPosts) && data.ragPosts.length > 0 ? data.ragPosts : undefined,
          rankingTraceId:
            typeof data.rankingTraceId === 'string' && data.rankingTraceId.length > 0
              ? data.rankingTraceId
              : undefined,
          recommendationChips:
            Array.isArray(data.recommendationChips) && data.recommendationChips.length > 0
              ? data.recommendationChips
              : undefined,
          ctaList:
            Array.isArray(data.ctaList) && data.ctaList.length > 0 ? data.ctaList : undefined,
          extraction: data.extraction,
        }
        const withAssistant = messagesRef.current.map((m) => (m.id === assistantId ? assistantMsg : m))
        messagesRef.current = withAssistant
        setMessages(withAssistant)
      } catch (e) {
        if (e instanceof Error && e.message === '__AI_AUTH_REDIRECT__') {
          return
        }
        const assistantMsg: Msg = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            e instanceof Error
              ? e.message
              : '网络异常，请稍后重试。',
        }
        const withAssistant = [...messagesRef.current, assistantMsg]
        messagesRef.current = withAssistant
        setMessages(withAssistant)
      } finally {
        setLoading(false)
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      }
    },
    [fetchReply, loading, revealAssistantReply, scrollToBottom],
  )

  useEffect(() => {
    if (status !== 'unauthenticated') return
    const q = searchParams.toString()
    const dest = q ? `/ai-search?${q}` : '/ai-search'
    router.replace(`/login?callbackUrl=${encodeURIComponent(dest)}`)
  }, [status, searchParams, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    if (initRef.current) return
    initRef.current = true
    const q = searchParams.get('q')?.trim()
    if (q) {
      void sendUserMessage(q)
    } else {
      const welcome: Msg[] = [
        {
          id: 'welcome',
          role: 'assistant',
          content: WELCOME_ASSISTANT_CONTENT,
          tone: 'system',
          isStreaming: false,
        },
      ]
      messagesRef.current = welcome
      setMessages(welcome)
    }
  }, [searchParams, sendUserMessage, status])

  useEffect(() => {
    requestAnimationFrame(() => scrollToBottom())
  }, [messages, loading, scrollToBottom])

  const flashMsgFlag = useCallback(
    (msgId: string, key: 'copied' | 'shared') => {
      setMsgFeedback((prev) => ({ ...prev, [msgId]: { ...prev[msgId], [key]: true } }))
      const timerKey = `${msgId}:${key}`
      const existing = feedbackTimers.current.get(timerKey)
      if (existing) clearTimeout(existing)
      const t = setTimeout(() => {
        setMsgFeedback((prev) => ({ ...prev, [msgId]: { ...prev[msgId], [key]: false } }))
        feedbackTimers.current.delete(timerKey)
      }, 1600)
      feedbackTimers.current.set(timerKey, t)
    },
    [],
  )

  useEffect(() => {
    const timers = feedbackTimers.current
    const streamTimers = replyTimers.current
    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      streamTimers.forEach((t) => clearTimeout(t))
      streamTimers.clear()
    }
  }, [])

  async function copyText(t: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(t)
      return true
    } catch {
      return false
    }
  }

  const handleCopy = useCallback(
    async (msg: Msg) => {
      const ok = await copyText(markdownToPlainText(msg.content))
      if (ok) flashMsgFlag(msg.id, 'copied')
    },
    [flashMsgFlag],
  )

  const handleShare = useCallback(
    async (msg: Msg) => {
      const url = typeof window !== 'undefined' ? window.location.href : ''
      const plainText = markdownToPlainText(msg.content)
      const shareData = { title: '华人广场AI助手', text: plainText.slice(0, 240), url }
      try {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          await navigator.share(shareData)
          flashMsgFlag(msg.id, 'shared')
          return
        }
      } catch {
        /* 用户取消或不支持，回落到复制链接 */
      }
      const ok = await copyText(url || plainText)
      if (ok) flashMsgFlag(msg.id, 'shared')
    },
    [flashMsgFlag],
  )

  /** 给某条助手消息点赞/踩；再次点同键则撤销。 */
  const handleVote = useCallback(
    async (msg: Msg, next: 'up' | 'down') => {
      const currentVote = msgFeedback[msg.id]?.vote
      const isRetract = currentVote === next
      // 乐观更新
      setMsgFeedback((prev) => ({
        ...prev,
        [msg.id]: {
          ...prev[msg.id],
          vote: isRetract ? undefined : next,
          voteBusy: true,
        },
      }))

      // 反推最近一条用户提问作为上下文（供离线训练/分析）
      const history = messagesRef.current
      const idx = history.findIndex((m) => m.id === msg.id)
      let question: string | undefined
      if (idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (history[i].role === 'user') {
            question = history[i].content
            break
          }
        }
      }

      try {
        const res = await fetch('/api/ai-search/message-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientMessageId: msg.id,
            action: isRetract ? 'retract' : 'vote',
            rating: isRetract ? undefined : next,
            traceId: msg.rankingTraceId,
            question,
            answer: markdownToPlainText(msg.content),
          }),
        })
        if (!res.ok) {
          // 回滚
          setMsgFeedback((prev) => ({
            ...prev,
            [msg.id]: { ...prev[msg.id], vote: currentVote, voteBusy: false },
          }))
          return
        }
        setMsgFeedback((prev) => ({
          ...prev,
          [msg.id]: { ...prev[msg.id], voteBusy: false },
        }))
      } catch {
        setMsgFeedback((prev) => ({
          ...prev,
          [msg.id]: { ...prev[msg.id], vote: currentVote, voteBusy: false },
        }))
      }
    },
    [msgFeedback],
  )

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    void sendUserMessage(input)
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center text-muted-foreground">
        加载中…
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] min-h-[calc(100dvh-3.5rem)] items-center justify-center text-muted-foreground">
        正在跳转登录…
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-background text-foreground">
      {LeaveDialog}
      <div className="page-shell flex h-full min-h-0 flex-1 flex-col pt-4 pb-4 sm:pt-5 sm:pb-5">
        <header className="mb-4 flex shrink-0 items-center gap-3 rounded-[1.4rem] border border-border/70 bg-background/85 px-3 py-3 shadow-sm shadow-black/5 backdrop-blur-sm sm:mb-5 sm:px-4">
          <button
            type="button"
            onClick={() => {
              onBeforeNavigate(() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  const fromPath = window.location.pathname + window.location.search + window.location.hash
                  router.back()
                  // 某些场景（如同一路由重复入栈、或无有效上一页）back 可能无变化：兜底回首页
                  window.setTimeout(() => {
                    const nowPath = window.location.pathname + window.location.search + window.location.hash
                    if (nowPath === fromPath) {
                      router.push('/')
                    }
                  }, 350)
                } else {
                  router.push('/')
                }
              })
            }}
            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-sm text-muted-foreground shadow-sm shadow-black/5 transition-colors hover:bg-accent/75 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-semibold tracking-tight sm:text-lg">华人广场AI助手</h1>
            <p className="hidden text-xs text-muted-foreground sm:block">更自然地查找房源、工作、二手和本地商家</p>
          </div>
          <span className="ml-auto rounded-full bg-primary/8 px-2 py-1 text-[11px] text-muted-foreground">测试版</span>
        </header>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-border/80 bg-muted/24 shadow-[0_20px_55px_-34px_rgba(15,23,42,0.35)] dark:border-zinc-800 dark:bg-zinc-950/60">
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2 pt-4 sm:px-5 sm:pb-3 sm:pt-5"
            >
            <div className="w-full space-y-4 sm:space-y-5">
              {messages.map((m) => (
                <div key={m.id} className="w-full">
                  {m.role === 'user' ? (
                    <div className="flex w-full justify-end">
                      <div className="max-w-[min(88%,28rem)] shrink-0 rounded-[1.35rem] bg-primary px-4 py-3 text-left text-sm leading-relaxed text-primary-foreground shadow-md shadow-black/10">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full justify-start">
                      <div
                        className={
                          'flex w-full flex-col gap-3 ' +
                          (m.ragPosts && m.ragPosts.length > 0
                            ? 'max-w-3xl'
                            : 'max-w-[min(88%,32rem)]')
                        }
                      >
                        <div className="flex flex-col gap-1">
                          <div className="overflow-hidden rounded-[1.35rem] border border-border/80 bg-background/95 text-left text-sm leading-relaxed text-foreground shadow-sm shadow-black/5">
                            <div className="px-4 py-3">
                              {m.isStreaming ? (
                                <p
                                  className={
                                    'whitespace-pre-wrap text-sm leading-7 text-foreground ' +
                                    (m.tone === 'system' ? 'font-medium tracking-tight' : '')
                                  }
                                >
                                  {m.content}
                                  <span
                                    className="ml-0.5 inline-block h-[1em] w-2 animate-pulse rounded-sm bg-primary/70 align-[-0.1em]"
                                    aria-hidden="true"
                                  />
                                </p>
                              ) : (
                                <AiChatMarkdown
                                  content={m.content}
                                  variant={m.tone === 'system' ? 'system' : 'default'}
                                />
                              )}
                              {m.ctaList &&
                                m.ctaList.length > 0 &&
                                !m.isStreaming &&
                                (!m.ragPosts || m.ragPosts.length === 0) && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {m.ctaList.map((c, i) => (
                                    <a
                                      key={`${m.id}-cta-${i}`}
                                      href={c.href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={
                                        c.kind === 'primary'
                                          ? 'inline-flex items-center rounded-md border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90'
                                          : 'inline-flex items-center rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent hover:text-foreground'
                                      }
                                    >
                                      {c.label}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                            {!m.isStreaming && m.ragPosts && m.ragPosts.length > 0 && (
                              <div className="space-y-2 border-t border-border/70 bg-muted/20 px-4 pb-3 pt-3">
                                <p className="text-xs font-medium text-foreground/90">
                                  相关帖子
                                  <span className="font-normal text-muted-foreground">
                                    （点击在新标签打开详情）
                                  </span>
                                </p>
                                <div className="grid gap-2 sm:gap-2.5">
                                  {m.ragPosts.map((p, pi) => {
                                    const chipEntry = m.recommendationChips?.find(
                                      (c) => c.postId === p.id,
                                    )
                                    return (
                                      <div key={p.id} className="space-y-1.5">
                                        {chipEntry && chipEntry.chips.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5">
                                            {chipEntry.chips.map((chip, ci) => (
                                              <span
                                                key={`${p.id}-${ci}`}
                                                className="inline-flex max-w-full items-center rounded-md border border-primary/25 bg-primary/5 px-2 py-0.5 text-[11px] leading-tight text-foreground/90"
                                              >
                                                {chip}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                        {m.rankingTraceId ? (
                                          <AiRankFeedbackPostCard
                                            post={p}
                                            position={pi}
                                            traceId={m.rankingTraceId}
                                            onRankClick={() => {
                                              const k = m.id
                                              const n = (rankClickSeqRef.current.get(k) ?? 0) + 1
                                              rankClickSeqRef.current.set(k, n)
                                              return n
                                            }}
                                          />
                                        ) : (
                                          <PostCard post={p} variant="compact" linkTarget="_blank" />
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="px-1 text-[11px] leading-snug text-muted-foreground">
                            {AI_DISCLAIMER}
                          </p>
                        </div>
                        {m.id !== 'welcome' && !m.isStreaming && (
                          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="对本条回复的反馈">
                            <button
                              type="button"
                              className={
                                'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors ' +
                                (msgFeedback[m.id]?.vote === 'up'
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground') +
                                (msgFeedback[m.id]?.voteBusy ? ' opacity-60' : '')
                              }
                              onClick={() => void handleVote(m, 'up')}
                              disabled={!!msgFeedback[m.id]?.voteBusy}
                              aria-pressed={msgFeedback[m.id]?.vote === 'up'}
                              aria-label={msgFeedback[m.id]?.vote === 'up' ? '已标记有用，点击取消' : '有用'}
                              title={msgFeedback[m.id]?.vote === 'up' ? '已标记有用' : '有用'}
                            >
                              <ThumbsUp
                                className={
                                  'h-4 w-4 ' +
                                  (msgFeedback[m.id]?.vote === 'up' ? 'fill-current' : '')
                                }
                              />
                              {msgFeedback[m.id]?.vote === 'up' && (
                                <span className="text-[11px] font-medium">有用</span>
                              )}
                            </button>
                            <button
                              type="button"
                              className={
                                'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors ' +
                                (msgFeedback[m.id]?.vote === 'down'
                                  ? 'bg-destructive/10 text-destructive'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground') +
                                (msgFeedback[m.id]?.voteBusy ? ' opacity-60' : '')
                              }
                              onClick={() => void handleVote(m, 'down')}
                              disabled={!!msgFeedback[m.id]?.voteBusy}
                              aria-pressed={msgFeedback[m.id]?.vote === 'down'}
                              aria-label={msgFeedback[m.id]?.vote === 'down' ? '已标记没用，点击取消' : '没用'}
                              title={msgFeedback[m.id]?.vote === 'down' ? '已标记没用' : '没用'}
                            >
                              <ThumbsDown
                                className={
                                  'h-4 w-4 ' +
                                  (msgFeedback[m.id]?.vote === 'down' ? 'fill-current' : '')
                                }
                              />
                              {msgFeedback[m.id]?.vote === 'down' && (
                                <span className="text-[11px] font-medium">没用</span>
                              )}
                            </button>
                            <button
                              type="button"
                              className={
                                'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors ' +
                                (msgFeedback[m.id]?.copied
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground')
                              }
                              onClick={() => void handleCopy(m)}
                              aria-label={msgFeedback[m.id]?.copied ? '已复制' : '复制'}
                              title={msgFeedback[m.id]?.copied ? '已复制' : '复制'}
                            >
                              {msgFeedback[m.id]?.copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                              {msgFeedback[m.id]?.copied && (
                                <span className="text-[11px] font-medium">已复制</span>
                              )}
                            </button>
                            <button
                              type="button"
                              className={
                                'inline-flex items-center gap-1 rounded-md p-1.5 transition-colors ' +
                                (msgFeedback[m.id]?.shared
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                  : 'text-muted-foreground hover:bg-accent hover:text-foreground')
                              }
                              onClick={() => void handleShare(m)}
                              aria-label={msgFeedback[m.id]?.shared ? '已分享' : '分享'}
                              title={msgFeedback[m.id]?.shared ? '已分享' : '分享'}
                            >
                              {msgFeedback[m.id]?.shared ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Share2 className="h-4 w-4" />
                              )}
                              {msgFeedback[m.id]?.shared && (
                                <span className="text-[11px] font-medium">已分享</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {loading && !hasStreamingAssistant && (
                <div className="flex w-full justify-start">
                  <div className="flex max-w-[min(88%,32rem)] items-center gap-2 rounded-[1.35rem] border border-border/80 bg-background/95 px-4 py-3 text-sm text-muted-foreground shadow-sm shadow-black/5">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    正在思考…
                  </div>
                </div>
              )}
            </div>
            </div>
            <div className="shrink-0 border-t border-border/70 bg-background/90 px-4 pb-[max(2.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm sm:px-5 sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <form onSubmit={onSubmit} className="w-full">
                <div
                  className={
                    'flex items-center gap-2 rounded-full border border-input/90 bg-background/90 py-1.5 pl-3 pr-1.5 shadow-sm shadow-black/5 transition-opacity ' +
                    (loading ? 'opacity-60' : '')
                  }
                >
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (loading) return
                        void sendUserMessage(input)
                      }
                    }}
                    disabled={loading}
                    aria-busy={loading}
                    placeholder={
                      loading
                        ? '正在思考…请稍候，上一条问题处理完再输入'
                        : '一句话找房 / 找工作 / 二手也行，可再补预算、地区…'
                    }
                    rows={1}
                    className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={loading ? '请求处理中' : '发送'}
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <p className="mt-2.5 text-center text-[11px] leading-snug text-muted-foreground">
                  {AI_DISCLAIMER}
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
