import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkAiFeedbackRateLimit } from '@/lib/rateLimit'
import { bumpRankAggregate } from '@/lib/aiRankLearned'

const RATE_MSG = '操作频繁，过会儿再试。'

type Body = {
  traceId?: string
  postId?: string
  position?: number
  kind?: 'impression' | 'click' | 'dwell'
  dwellMs?: number
  clickSeq?: number
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
  const traceId = typeof body.traceId === 'string' ? body.traceId.trim() : ''
  const postId = typeof body.postId === 'string' ? body.postId.trim() : ''
  const kind = body.kind
  const position = typeof body.position === 'number' && Number.isFinite(body.position) ? body.position : -1

  if (!traceId || !postId || !kind || position < 0) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 })
  }

  const trace = await prisma.aiSearchTrace.findFirst({
    where: { id: traceId, userId },
  })
  if (!trace) {
    return NextResponse.json({ error: 'trace 不存在' }, { status: 404 })
  }

  const dwellMs =
    kind === 'dwell' && typeof body.dwellMs === 'number' && body.dwellMs >= 0 && body.dwellMs <= 120_000
      ? Math.floor(body.dwellMs)
      : kind === 'dwell'
        ? 0
        : undefined

  const clickSeq =
    kind === 'click' && typeof body.clickSeq === 'number' && body.clickSeq > 0
      ? Math.floor(body.clickSeq)
      : undefined

  try {
    await prisma.aiSearchInteractionEvent.create({
      data: {
        traceId,
        userId,
        postId,
        position,
        kind,
        dwellMs: kind === 'dwell' ? dwellMs : undefined,
        clickSeq,
      },
    })
    if (kind === 'impression') void bumpRankAggregate('impression')
    if (kind === 'click') void bumpRankAggregate('click')
  } catch (e) {
    console.error('[ai-search/feedback]', e)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
