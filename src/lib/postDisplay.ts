/** 找房子分类：与出租侧存同一 subCategory 值，仅展示文案不同 */
export const RENT_SEEK_SUB_DISPLAY: Record<string, string> = {
  整租: '求整租',
  合租: '求合租',
  单房: '求单间',
  床位: '求床位',
  车位: '求车位',
  '商铺/办公室': '求租商铺/办公',
  '短租/民宿': '求短租/民宿',
}

export function rentSeekSubLabel(sub: string | null | undefined): string {
  if (!sub) return ''
  return RENT_SEEK_SUB_DISPLAY[sub] || `求${sub}`
}

export function subCategoryButtonLabel(category: string, sub: string): string {
  if (category === 'RENT_SEEK') return rentSeekSubLabel(sub)
  if (category === 'JOB_SEEK') return `意向 · ${sub}`
  return sub
}

/** 列表/详情：求职帖价格展示（与 jobSalaryUnit 配合） */
export function jobSeekPriceDisplay(price: number | null | undefined, unit: string | null | undefined): string {
  if (price == null) return '面议'
  if (unit === 'HOURLY') return `$${price}/hr`
  if (unit === 'PER_VISIT') return `$${price}/次`
  return `$${price}`
}

/** 发帖页摘要一行 */
export function formatJobSeekPriceSummary(priceStr: string, jobSalaryUnit: string): string {
  const n = parseFloat(priceStr)
  if (!priceStr.trim() || Number.isNaN(n)) return '面议'
  if (jobSalaryUnit === 'HOURLY') return `$${n}/hr`
  if (jobSalaryUnit === 'PER_VISIT') return `$${n}/次`
  return `$${n}`
}

/** 求职发帖：语言选项存原值，按钮文案更贴求职者 */
export function jobLangButtonLabel(category: string, t: string): string {
  if (category !== 'JOB_SEEK') return t
  if (t === '无要求（普通话）') return '普通话'
  if (t === '中英双语（基本）') return '中英双语（基本沟通）'
  if (t === '中英双语（流利）') return '中英双语（流利）'
  return t
}
