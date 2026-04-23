/** US state code → 与发帖地区列表一致的州名（仅下列州在本站可选） */
export const US_STATE_CODE_TO_ZH: Record<string, string> = {
  NY: '纽约州',
  NJ: '新泽西州',
  CA: '加利福尼亚州',
  TX: '德克萨斯州',
  WA: '华盛顿州',
  NV: '内华达州',
  NC: '北卡罗来纳州',
  IL: '伊利诺伊州',
  GA: '佐治亚州',
  MA: '马萨诸塞州',
}

export const STATE_ZH_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_CODE_TO_ZH).map(([code, zh]) => [zh, code]),
)

export function isSupportedStateCode(code: string | undefined | null): boolean {
  if (!code) return false
  return code.toUpperCase() in US_STATE_CODE_TO_ZH
}

export function labelForSelection(p: {
  scope: 'nationwide' | 'state' | 'metro'
  stateZh?: string
  cityZh?: string
  areaZh?: string
  stateCode?: string
}): string {
  if (p.scope === 'nationwide') return '全美'
  const code = p.stateCode || (p.stateZh ? STATE_ZH_TO_CODE[p.stateZh] : '') || ''
  const prefix = code ? `${code} · ` : ''
  if (p.scope === 'state' && p.stateZh) return `${prefix}${p.stateZh}`.trim()
  if (p.scope === 'metro') {
    const tail = [p.cityZh, p.areaZh].filter(Boolean).join(' · ')
    return `${prefix}${tail || p.stateZh || ''}`.trim()
  }
  return p.stateZh ? `${prefix}${p.stateZh}`.trim() : '全美'
}
