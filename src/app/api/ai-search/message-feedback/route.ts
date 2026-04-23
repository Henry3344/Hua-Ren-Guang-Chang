import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAiFeedbackRateLimit } from '@/lib/rateLimit'
import { bumpApprovalAggregate } from '@/lib/aiRankLearned'
import { maybeScheduleRankRecomputeFromFeedbackSignal } from '@/lib/aiRankRecompute'

const RATE_MSG = '操作频繁，过会儿再试。'

type Rating = 'up' | 'down'
type Action = 'vote' | 'retract'

type Body = {
  clientMessageId?: string
  rating?: Rating
  action?: Action
  traceId?: string
  question?: string
  answer?: string
}

const MAX_Q = 2000
const MAX_A = 4000

function truncate(input: unknown, max: number): string | undefined {
  if (typeof input !== 'string') return undefined
  const t = input.trim()
  if (!t) return undefined
  return t.length > max ? t.slice(0, max) : t
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }
  if (!checkAiFeedbackRateLimit(userId)) {
    return NextResponse.json({ error: RATE_MSG }, { status: 429 })
  }

  const body = (await req.json().catch(() => ({}))) as Body
  const clientMessageId =
    typeof body.clientMessageId === 'string' ? body.clientMessageId.trim() : ''
  if (!clientMessageId || clientMessageId.length > 128) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 })
  }

  const action: Action = body.action === 'retract' ? 'retract' : 'vote'
  const rating = body.rating === 'up' || body.rating === 'down' ? body.rating : null
  if (action === 'vote' && !rating) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 })
  }

  const rawTraceId = typeof body.traceId === 'string' ? body.traceId.trim() : ''
  let traceId: string | null = null
  if (rawTraceId) {
    const trace = await prisma.aiSearchTrace.findFirst({
      where: { id: rawTraceId, userId },
      select: { id: true },
    })
    if (trace) traceId = trace.id
  }

  const question = truncate(body.question, MAX_Q)
  const answer = truncate(body.answer, MAX_A)

  try {
    if (action === 'retract') {
      const existing = await prisma.aiChatMessageFeedback.findUnique({
        where: {
          userId_clientMessageId: { userId, clientMessageId },
        },
        select: { rating: true },
      })
      if (existing) {
        await prisma.aiChatMessageFeedback.delete({
          where: { userId_clientMessageId: { userId, clientMessageId } },
        })
        void bumpApprovalAggregate(existing.rating === 'up' ? 'like' : 'dislike', -1)
        maybeScheduleRankRecomputeFromFeedbackSignal()
      }
      return NextResponse.json({ ok: true, vote: null })
    }

    const previous = await prisma.aiChatMessageFeedback.findUnique({
      where: { userId_clientMessageId: { userId, clientMessageId } },
      select: { rating: true },
    })

    await prisma.aiChatMessageFeedback.upsert({
      where: { userId_clientMessageId: { userId, clientMessageId } },
      create: {
        userId,
        clientMessageId,
        traceId,
        rating: rating!,
        question,
        answer,
      },
      update: {
        rating: rating!,
        traceId: traceId ?? undefined,
        question: question ?? undefined,
        answer: answer ?? undefined,
      },
    })

    if (!previous) {
      void bumpApprovalAggregate(rating === 'up' ? 'like' : 'dislike', 1)
      maybeScheduleRankRecomputeFromFeedbackSignal()
    } else if (previous.rating !== rating) {
      void bumpApprovalAggregate(previous.rating === 'up' ? 'like' : 'dislike', -1)
      void bumpApprovalAggregate(rating === 'up' ? 'like' : 'dislike', 1)
      maybeScheduleRankRecomputeFromFeedbackSignal()
    }

    return NextResponse.json({ ok: true, vote: rating })
  } catch (e) {
    console.error('[ai-search/message-feedback]', e)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}
