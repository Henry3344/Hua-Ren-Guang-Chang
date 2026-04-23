/**
 * 押金/先付等易涉预付诈骗的表述：命中则发帖需人工审核，通过后帖文详情仍展示风险提示。
 */
const DEPOSIT_RISK_SUBSTRINGS = ['押金', '先付', '先付款', '预付', '預付'] as const

export function hasHighRiskDepositKeywords(text: string): boolean {
  const t = (text || '').trim()
  if (!t) return false
  return DEPOSIT_RISK_SUBSTRINGS.some((s) => t.includes(s))
}
