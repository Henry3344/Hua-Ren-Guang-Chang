import { prisma } from '@/lib/prisma'

const TRIO_SUM = 0.52

async function ensureDefaultRankState() {
  await prisma.aiRankWeightState.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      retrievalW: 0.3,
      businessW: 0.06,
      freshnessW: 0.16,
    },
    update: {},
  })
}

export type HeuristicMergeTrio = {
  retrievalWeight: number
  businessWeight: number
  freshnessWeight: number
}

export type RankStateSnapshot = {
  retrievalW: number
  businessW: number
  freshnessW: number
  weightVersion: number
}

/**
 * 将启发式三元组与库内学习状态做凸组合，再缩放到与 cross+price+rarity 固定分量之和为 1。
 */
export async function blendMergeWeightsWithLearned(
  heuristic: HeuristicMergeTrio,
): Promise<HeuristicMergeTrio> {
  const a = Number(process.env.AI_RANK_LEARN_BLEND ?? '0.12')
  if (!Number.isFinite(a) || a <= 0) return heuristic

  await ensureDefaultRankState()
  const state = await prisma.aiRankWeightState.findUnique({ where: { id: 'default' } })
  if (!state) return heuristic

  const blend = (h: number, l: number) => (1 - a) * h + a * l
  const r = blend(heuristic.retrievalWeight, state.retrievalW)
  const b = blend(heuristic.businessWeight, state.businessW)
  const f = blend(heuristic.freshnessWeight, state.freshnessW)
  const s = r + b + f
  if (s <= 0) return heuristic
  const scale = TRIO_SUM / s
  return {
    retrievalWeight: r * scale,
    businessWeight: b * scale,
    freshnessWeight: f * scale,
  }
}

export async function getCurrentRankStateSnapshot(): Promise<RankStateSnapshot> {
  await ensureDefaultRankState()
  const state = await prisma.aiRankWeightState.findUnique({
    where: { id: 'default' },
    select: {
      retrievalW: true,
      businessW: true,
      freshnessW: true,
      weightVersion: true,
    },
  })
  if (!state) {
    return {
      retrievalW: 0.3,
      businessW: 0.06,
      freshnessW: 0.16,
      weightVersion: 1,
    }
  }
  return state
}

export async function bumpRankAggregate(kind: 'impression' | 'click'): Promise<void> {
  await ensureDefaultRankState()
  try {
    await prisma.aiRankWeightState.update({
      where: { id: 'default' },
      data:
        kind === 'impression'
          ? { impressionTotal: { increment: 1 } }
          : { clickTotal: { increment: 1 } },
    })
  } catch {
    /* ignore */
  }
}

/**
 * 消息级赞/踩计数累加；`delta` 支持 -1 用于用户撤销或切换投票时回滚。
 */
export async function bumpApprovalAggregate(
  kind: 'like' | 'dislike',
  delta: 1 | -1 = 1,
): Promise<void> {
  await ensureDefaultRankState()
  try {
    await prisma.aiRankWeightState.update({
      where: { id: 'default' },
      data:
        kind === 'like'
          ? { likeTotal: { increment: delta } }
          : { dislikeTotal: { increment: delta } },
    })
  } catch {
    /* ignore */
  }
}
