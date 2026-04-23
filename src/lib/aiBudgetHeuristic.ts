/**
 * 从自然语言提取「预算上限」美元整数，用于 SQL price <= 与 relaxed 策略分支。
 * 仅匹配带明显预算语义的片段，避免误伤型号里的数字。
 */

export function extractHeuristicPriceCapUsd(text: string): number | null {
  const t = (text ?? '').replace(/\s+/g, ' ')
  const patterns: RegExp[] = [
    /(\d{1,5})\s*左右/,
    /(\d{1,5})\s*以内/,
    /以内\D{0,2}(\d{1,5})/,
    /以下\D{0,2}(\d{1,5})/,
    /不超过\D{0,3}(\d{1,5})/,
    /预算\D{0,10}(\d{1,5})/,
    /最多\D{0,3}(\d{1,5})/,
    /大概\D{0,2}(\d{1,5})/,
    /约\D{0,2}(\d{1,5})(?=\s*(?:刀|美金|美元|块|元)?)/,
    /\$\s*(\d{1,5})\b/,
  ]
  let best: number | null = null
  for (const re of patterns) {
    const m = t.match(re)
    if (!m?.[1]) continue
    const n = Number(m[1])
    if (!Number.isFinite(n) || n < 1 || n > 500_000) continue
    if (best == null || n < best) best = n
  }
  return best
}

/**
 * 与结构化解析合并：取更严上限，抑制模型把预算写成更大数字。
 * slack = 用户预算之上允许的"相差不多"宽容度。默认 20%——
 * 因为 AI 搜索每分钟限 2 次，用户说"300 左右"时不想为 $330 的帖再问一次。
 */
export function mergePriceMaxFromHeuristic(
  queryText: string,
  structuredMax: number | null,
): number | null {
  const h = extractHeuristicPriceCapUsd(queryText)
  const slack = Number(process.env.AI_BUDGET_MAX_SLACK ?? '0.2')
  const hSlack = h != null ? Math.round(h * (1 + (Number.isFinite(slack) ? slack : 0.2))) : null
  if (structuredMax != null && hSlack != null) return Math.min(structuredMax, hSlack)
  if (hSlack != null) return hSlack
  return structuredMax
}

/** 用户是否明确表达了预算数字（用于 relaxed 时是否允许去掉价位筛选） */
export function hasExplicitBudgetInText(text: string): boolean {
  return extractHeuristicPriceCapUsd(text) != null
}
