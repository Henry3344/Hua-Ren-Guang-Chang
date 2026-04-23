/**
 * 价格/预算敏感（正则兜底；更细语义由 Groq 分类补充）。
 */
const PRICE_SENSITIVE_RE =
  /便宜|低价|实惠|最便宜|省钱|廉价|特价|平价|预算|经济型|白菜|抠门|贵不贵|多少钱|价位|价格|房租|租金|月供|性价比|划得来|划算|别太贵|合适一点|不要太贵|省点|太贵|cheap|budget|affordable|lowest|rent\s*of/i

export function isPriceSensitiveIntentQuery(q: string): boolean {
  return PRICE_SENSITIVE_RE.test(q)
}

export type UnifiedMergeScoreWeights = {
  /** 正则、LLM 或语义向量锚点任一为真则 true */
  priceIntent: boolean
  priceIntentRegex: boolean
  priceIntentLlm: boolean
  semanticPriceHint: boolean
  /** 仅 LLM；与 price 冲突时以价格权重分支为准 */
  qualityIntentLlm: boolean
  retrievalWeight: number
  businessWeight: number
  /** 与 retrieval、business 三元组之和为 0.52（与 cross+price+rarity 固定 0.48 相加为 1） */
  freshnessWeight: number
}

export type MergeIntentHints = {
  /** Groq 分类结果；null 表示未调用或失败 */
  llm: { price_sensitive: boolean; quality_sensitive: boolean } | null
  /** 查询向量与「价格敏感」锚点余弦相似度达标 */
  semanticPriceHint?: boolean
}

/**
 * 合并检索打分：
 * - 默认 retrieval=0.30、business=0.06
 * - 价格敏感：retrieval=0.34、business=0.02（LLM 与正则取并集）
 * - 品质敏感且非价格敏感：略抬高 business（商家/认证信号）retrieval=0.28、business=0.08
 * - freshness 默认 0.16（可与学习到的状态混合）
 */
export function getUnifiedMergeWeights(
  queryBlob: string,
  hints?: MergeIntentHints,
): UnifiedMergeScoreWeights {
  const blob = queryBlob
  const priceIntentRegex = isPriceSensitiveIntentQuery(blob)
  const priceIntentLlm = hints?.llm?.price_sensitive === true
  const semanticPriceHint = hints?.semanticPriceHint === true
  const qualityIntentLlm = hints?.llm?.quality_sensitive === true
  const priceIntent = priceIntentRegex || priceIntentLlm || semanticPriceHint
  const f = 0.16

  if (priceIntent) {
    return {
      priceIntent,
      priceIntentRegex,
      priceIntentLlm,
      semanticPriceHint,
      qualityIntentLlm,
      retrievalWeight: 0.34,
      businessWeight: 0.02,
      freshnessWeight: f,
    }
  }
  if (qualityIntentLlm) {
    return {
      priceIntent,
      priceIntentRegex,
      priceIntentLlm,
      semanticPriceHint,
      qualityIntentLlm,
      retrievalWeight: 0.28,
      businessWeight: 0.08,
      freshnessWeight: f,
    }
  }
  return {
    priceIntent,
    priceIntentRegex,
    priceIntentLlm,
    semanticPriceHint,
    qualityIntentLlm,
    retrievalWeight: 0.3,
    businessWeight: 0.06,
    freshnessWeight: f,
  }
}
