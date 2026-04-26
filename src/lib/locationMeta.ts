/** US state code → 中文州名。覆盖全美，精选城市/区域仍由 locationData 维护。 */
export const US_STATE_CODE_TO_ZH: Record<string, string> = {
  AL: '阿拉巴马州',
  AK: '阿拉斯加州',
  AZ: '亚利桑那州',
  AR: '阿肯色州',
  CO: '科罗拉多州',
  CT: '康涅狄格州',
  DE: '特拉华州',
  FL: '佛罗里达州',
  HI: '夏威夷州',
  ID: '爱达荷州',
  IN: '印第安纳州',
  IA: '爱荷华州',
  KS: '堪萨斯州',
  KY: '肯塔基州',
  LA: '路易斯安那州',
  ME: '缅因州',
  MD: '马里兰州',
  MI: '密歇根州',
  MN: '明尼苏达州',
  MS: '密西西比州',
  MO: '密苏里州',
  MT: '蒙大拿州',
  NE: '内布拉斯加州',
  NH: '新罕布什尔州',
  NM: '新墨西哥州',
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
  ND: '北达科他州',
  OH: '俄亥俄州',
  OK: '俄克拉荷马州',
  OR: '俄勒冈州',
  PA: '宾夕法尼亚州',
  RI: '罗得岛州',
  SC: '南卡罗来纳州',
  SD: '南达科他州',
  TN: '田纳西州',
  UT: '犹他州',
  VT: '佛蒙特州',
  VA: '弗吉尼亚州',
  WV: '西弗吉尼亚州',
  WI: '威斯康星州',
  WY: '怀俄明州',
  DC: '华盛顿特区',
}

export const STATE_ZH_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATE_CODE_TO_ZH).map(([code, zh]) => [zh, code]),
)

export const US_STATE_NAME_TO_CODE: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
  'District of Columbia': 'DC',
  'Washington, D.C.': 'DC',
}

export function isSupportedStateCode(code: string | undefined | null): boolean {
  if (!code) return false
  return code.toUpperCase() in US_STATE_CODE_TO_ZH
}

export function normalizeUsStateCode(input: string | undefined | null): string {
  const raw = input?.trim()
  if (!raw) return ''
  const upper = raw.toUpperCase()
  if (isSupportedStateCode(upper)) return upper
  if (STATE_ZH_TO_CODE[raw]) return STATE_ZH_TO_CODE[raw]
  if (US_STATE_NAME_TO_CODE[raw]) return US_STATE_NAME_TO_CODE[raw]
  const normalized = raw
    .replace(/^State of\s+/i, '')
    .replace(/^Commonwealth of\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
  const match = Object.entries(US_STATE_NAME_TO_CODE).find(
    ([name]) => name.toLowerCase() === normalized,
  )
  return match?.[1] || ''
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
