import { prisma } from '@/lib/prisma'
import {
  computeLearningObjective,
  normalizeSignals,
  stepWeightsTowardObjective,
  type RawLearningSignals,
} from '@/lib/aiRankLearningObjective'

export type RecomputeResult = {
  ok: boolean
  skipped?: string
  objective?: number
  signals?: RawLearningSignals
  weights?: { retrievalW: number; businessW: number; freshnessW: number }
}

const MIN_EVENTS = Number(process.env.AI_LTR_MIN_EVENTS ?? '80')
let recomputeInFlight = false

/**
 * 从 AiSearchInteractionEvent 聚合 CTR / 停留 / 转化代理，计算统一目标 L，
 * 并更新 AiRankWeightState（retrievalW / businessW / freshnessW）。
 */
export async function recomputeAiRankWeightsFromAggregates(days = 7): Promise<RecomputeResult> {
  const since = new Date(Date.now() - days * 86400000)

  const [
    impressionCount,
    clickCount,
    dwellGroups,
    multiClickCount,
    likeCount,
    dislikeCount,
  ] = await Promise.all([
    prisma.aiSearchInteractionEvent.count({
      where: { kind: 'impression', createdAt: { gte: since } },
    }),
    prisma.aiSearchInteractionEvent.count({
      where: { kind: 'click', createdAt: { gte: since } },
    }),
    prisma.aiSearchInteractionEvent.groupBy({
      by: ['traceId', 'postId'],
      where: { kind: 'dwell', createdAt: { gte: since } },
      _max: { dwellMs: true },
    }),
    prisma.aiSearchInteractionEvent.count({
      where: { kind: 'click', clickSeq: { gte: 2 }, createdAt: { gte: since } },
    }),
    prisma.aiChatMessageFeedback.count({
      where: { rating: 'up', createdAt: { gte: since } },
    }),
    prisma.aiChatMessageFeedback.count({
      where: { rating: 'down', createdAt: { gte: since } },
    }),
  ])

  const raw: RawLearningSignals = {
    impressionCount,
    clickCount,
    dwellEventCount: dwellGroups.length,
    dwellAvgMs:
      dwellGroups.length > 0
        ? dwellGroups.reduce((sum, row) => sum + (row._max.dwellMs ?? 0), 0) / dwellGroups.length
        : 0,
    multiClickCount,
    likeCount,
    dislikeCount,
  }

  const totalEvents = impressionCount + clickCount + dwellGroups.length + likeCount + dislikeCount
  if (totalEvents < MIN_EVENTS) {
    return {
      ok: false,
      skipped: `insufficient_events(${totalEvents}<${MIN_EVENTS})`,
      signals: raw,
    }
  }

  const norm = normalizeSignals(raw)
  const objective = computeLearningObjective(norm)

  const state = await prisma.aiRankWeightState.findUnique({ where: { id: 'default' } })
  if (!state) {
    return { ok: false, skipped: 'no_state', signals: raw }
  }

  const next = stepWeightsTowardObjective(
    { r: state.retrievalW, b: state.businessW, f: state.freshnessW },
    norm,
    objective,
  )

  await prisma.aiRankWeightState.update({
    where: { id: 'default' },
    data: {
      retrievalW: next.r,
      businessW: next.b,
      freshnessW: next.f,
      weightVersion: { increment: 1 },
      lastLearningObjective: objective,
      lastRecomputedAt: new Date(),
      traceCountSinceRecompute: 0,
      feedbackSignalCountSinceRecompute: 0,
    },
  })

  return {
    ok: true,
    objective,
    signals: raw,
    weights: { retrievalW: next.r, businessW: next.b, freshnessW: next.f },
  }
}

/** 每次新建 AiSearchTrace 后调用：累计次数，达到阈值则异步重算 */
export function maybeScheduleRankRecomputeFromTraceCount(): void {
  const every = Number(process.env.AI_LTR_RECOMPUTE_EVERY_TRACES ?? '1000')
  if (!Number.isFinite(every) || every < 1) return

  void maybeScheduleRankRecompute('traceCountSinceRecompute', every, 'trace')
}

/** 每次收到消息级赞/踩信号后调用：单独累计反馈数，达到阈值则异步重算 */
export function maybeScheduleRankRecomputeFromFeedbackSignal(): void {
  const every = Number(process.env.AI_LTR_RECOMPUTE_EVERY_FEEDBACKS ?? '160')
  if (!Number.isFinite(every) || every < 1) return
  void maybeScheduleRankRecompute('feedbackSignalCountSinceRecompute', every, 'feedback')
}

async function maybeScheduleRankRecompute(
  field: 'traceCountSinceRecompute' | 'feedbackSignalCountSinceRecompute',
  every: number,
  source: 'trace' | 'feedback',
): Promise<void> {
  try {
    if (field === 'traceCountSinceRecompute') {
      await prisma.aiRankWeightState.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          retrievalW: 0.3,
          businessW: 0.06,
          freshnessW: 0.16,
          traceCountSinceRecompute: 1,
        },
        update: { traceCountSinceRecompute: { increment: 1 } },
      })
    } else {
      await prisma.aiRankWeightState.upsert({
        where: { id: 'default' },
        create: {
          id: 'default',
          retrievalW: 0.3,
          businessW: 0.06,
          freshnessW: 0.16,
          feedbackSignalCountSinceRecompute: 1,
        },
        update: { feedbackSignalCountSinceRecompute: { increment: 1 } },
      })
    }
    const st = await prisma.aiRankWeightState.findUnique({
      where: { id: 'default' },
      select: { traceCountSinceRecompute: true, feedbackSignalCountSinceRecompute: true },
    })
    if (!st || st[field] < every) return
    if (recomputeInFlight) return

    recomputeInFlight = true
    try {
      const result = await recomputeAiRankWeightsFromAggregates(
        Number(process.env.AI_LTR_AGGREGATE_DAYS ?? '7'),
      )
      if (!result.ok) {
        console.info(`[ai-rank] recompute skipped (${source}):`, result.skipped)
        await prisma.aiRankWeightState.update({
          where: { id: 'default' },
          data:
            field === 'traceCountSinceRecompute'
              ? { traceCountSinceRecompute: 0 }
              : { feedbackSignalCountSinceRecompute: 0 },
        })
      }
    } finally {
      recomputeInFlight = false
    }
  } catch (e) {
    console.error(`[ai-rank] maybeScheduleRankRecompute(${source})`, e)
  }
}
