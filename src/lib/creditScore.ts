/** 0=红，100=绿，线性过渡 */
export function creditScoreColor(score: number): string {
  const s = Math.max(0, Math.min(100, Math.round(Number(score))))
  const hue = (s / 100) * 120
  return `hsl(${hue} 72% 34%)`
}

/** 与 /credit 档位一致：分数旁展示，便于理解颜色含义 */
export function creditScoreLabel(score: number): string {
  const s = Math.max(0, Math.min(100, Math.round(Number(score))))
  if (s >= 81) return '正常用户'
  if (s >= 61) return '轻微风险'
  if (s >= 40) return '高风险'
  return '危险账号'
}
