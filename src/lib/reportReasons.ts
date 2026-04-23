export const REPORT_REASONS = [
  '发布虚假信息',
  '欺诈或诈骗',
  '不当言论',
  '垃圾信息/广告',
  '其他',
] as const

export type ReportReason = (typeof REPORT_REASONS)[number]
