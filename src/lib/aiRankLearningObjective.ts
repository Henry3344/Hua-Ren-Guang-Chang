/**
 * 统一学习目标（标量），驱动 AiRankWeightState 中 retrieval / business / freshness 三元组更新。
 *
 * L = w_ctr · ctr̂ + w_dwell · dwell̂ + w_conv · conv̂ + w_appr · approval̂
 *
 * 其中 ctr̂、dwell̂、conv̂、approval̂ 为 [0,1] 归一化后的可观测反馈；权重系数可由环境变量覆盖。
 * 「转化」conv 用同 trace 内多次点击（clickSeq≥2）占点击的比例近似。
 * 「赞同」approval 来自用户在 AI 聊天界面的消息级赞/踩反馈（AiChatMessageFeedback）。
 */

export type LearningSignalNorm = {
  /** 卡片曝光→点击，约等于 CTR */
  ctrHat: number
  /** 停留相对参考时长 */
  dwellHat: number
  /** 深度互动：多次点击占比 */
  convHat: number
  /** 消息级赞占比（赞 / (赞+踩)），归一化到 [0,1] */
  approvalHat: number
}

export type RawLearningSignals = {
  impressionCount: number
  clickCount: number
  dwellEventCount: number
  dwellAvgMs: number
  multiClickCount: number
  /** 近窗口内的"赞"次数（可选，缺省为 0） */
  likeCount?: number
  /** 近窗口内的"踩"次数（可选，缺省为 0） */
  dislikeCount?: number
}

const DEFAULT_W = { ctr: 0.35, dwell: 0.3, conv: 0.2, approval: 0.15 }

export function learningObjectiveWeights(): {
  wCtr: number
  wDwell: number
  wConv: number
  wApproval: number
} {
  const wCtr = Number(process.env.AI_LTR_OBJ_W_CTR ?? DEFAULT_W.ctr)
  const wDwell = Number(process.env.AI_LTR_OBJ_W_DWELL ?? DEFAULT_W.dwell)
  const wConv = Number(process.env.AI_LTR_OBJ_W_CONV ?? DEFAULT_W.conv)
  const wApproval = Number(process.env.AI_LTR_OBJ_W_APPROVAL ?? DEFAULT_W.approval)
  const s = wCtr + wDwell + wConv + wApproval
  if (!Number.isFinite(s) || s <= 0) {
    return {
      wCtr: DEFAULT_W.ctr,
      wDwell: DEFAULT_W.dwell,
      wConv: DEFAULT_W.conv,
      wApproval: DEFAULT_W.approval,
    }
  }
  return { wCtr: wCtr / s, wDwell: wDwell / s, wConv: wConv / s, wApproval: wApproval / s }
}

/** 将原始计数转为 [0,1] 特征 */
export function normalizeSignals(raw: RawLearningSignals): LearningSignalNorm {
  const refCtr = Number(process.env.AI_LTR_REF_CTR ?? '0.12')
  const refDwellMs = Number(process.env.AI_LTR_REF_DWELL_MS ?? '45000')
  const refConv = Number(process.env.AI_LTR_REF_CONV_RATE ?? '0.35')
  const minVotes = Number(process.env.AI_LTR_REF_APPROVAL_MIN_VOTES ?? '10')

  const ctr = raw.clickCount / Math.max(1, raw.impressionCount)
  const ctrHat = clamp01(ctr / refCtr)

  const dwellAvg = raw.dwellEventCount > 0 ? raw.dwellAvgMs : 0
  const dwellHat = clamp01(dwellAvg / refDwellMs)

  const continued =
    raw.clickCount > 0 ? Math.min(1, raw.multiClickCount / raw.clickCount) : 0
  const convHat = clamp01(continued / refConv)

  const likes = Math.max(0, raw.likeCount ?? 0)
  const dislikes = Math.max(0, raw.dislikeCount ?? 0)
  const totalVotes = likes + dislikes
  // 样本太少时回落到中性 0.5（不给目标引入噪声，亦不惩罚）
  const approvalHat =
    totalVotes >= Math.max(1, minVotes)
      ? clamp01(likes / totalVotes)
      : 0.5

  return { ctrHat, dwellHat, convHat, approvalHat }
}

export function computeLearningObjective(norm: LearningSignalNorm): number {
  const { wCtr, wDwell, wConv, wApproval } = learningObjectiveWeights()
  return clamp01(
    wCtr * norm.ctrHat +
      wDwell * norm.dwellHat +
      wConv * norm.convHat +
      wApproval * norm.approvalHat,
  )
}

function clamp01(x: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  return x
}

const TRIO_SUM = 0.52

/** 单步更新：在目标函数梯度方向上做小步投影（无外部模型时的可解释近似） */
export function stepWeightsTowardObjective(
  current: { r: number; b: number; f: number },
  norm: LearningSignalNorm,
  objective: number,
): { r: number; b: number; f: number } {
  const eta = Number(process.env.AI_LTR_STEP ?? '0.12')
  const { ctrHat, dwellHat, convHat, approvalHat } = norm

  // 与「中性点 0.5」的偏差 → 调整方向：CTR 低则略增 retrieval、略减 business；停留高则略增 freshness；转化高则略增 business
  // 赞踩比高（approval 高）→ 当前结果质量好，略减 retrieval 探索、略增 business 加固；
  // 赞踩比低（踩多）→ 反之，扩大 retrieval 做更多探索。
  const eCtr = ctrHat - 0.5
  const eDwell = dwellHat - 0.5
  const eConv = convHat - 0.5
  const eAppr = approvalHat - 0.5

  let r = current.r + eta * (eCtr * 0.14 - eConv * 0.05 + eDwell * 0.04 - eAppr * 0.06)
  let b = current.b + eta * (eConv * 0.1 - eCtr * 0.07 + eDwell * 0.02 + eAppr * 0.04)
  let f = current.f + eta * (eDwell * 0.12 - eCtr * 0.03 + eAppr * 0.02)

  // 目标整体偏弱时略向「探索」偏 retrieval
  if (objective < Number(process.env.AI_LTR_OBJECTIVE_LOW ?? '0.28')) {
    r += eta * 0.06
    b -= eta * 0.04
  }

  r = clamp(r, 0.18, 0.42)
  b = clamp(b, 0.02, 0.14)
  f = clamp(f, 0.08, 0.24)

  const s = r + b + f
  if (s <= 0) return current
  const scale = TRIO_SUM / s
  return { r: r * scale, b: b * scale, f: f * scale }
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}
