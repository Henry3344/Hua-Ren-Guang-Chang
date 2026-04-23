/**
 * 美国 50 州 + 哥伦比亚特区（DC）的通用下拉选项。
 * 用于商家入驻表单等需要按标准美式地址填写的地方；其他按华人社区聚居地区做的
 * 地区筛选（`locationData.ts`）覆盖面更窄，不适合作为通用 state picker。
 *
 * - `code`: 两位字母代号，作为表单 value 与串化到地址字符串里的一部分；
 * - `nameEn`: 英文全称；
 * - `nameZh`: 中文译名（与 `locationData.ts` 已有的若干条用词保持一致）。
 */
export type UsStateOption = {
  code: string
  nameEn: string
  nameZh: string
}

export const US_STATES: readonly UsStateOption[] = [
  { code: 'AL', nameEn: 'Alabama', nameZh: '阿拉巴马州' },
  { code: 'AK', nameEn: 'Alaska', nameZh: '阿拉斯加州' },
  { code: 'AZ', nameEn: 'Arizona', nameZh: '亚利桑那州' },
  { code: 'AR', nameEn: 'Arkansas', nameZh: '阿肯色州' },
  { code: 'CA', nameEn: 'California', nameZh: '加利福尼亚州' },
  { code: 'CO', nameEn: 'Colorado', nameZh: '科罗拉多州' },
  { code: 'CT', nameEn: 'Connecticut', nameZh: '康涅狄格州' },
  { code: 'DE', nameEn: 'Delaware', nameZh: '特拉华州' },
  { code: 'DC', nameEn: 'District of Columbia', nameZh: '哥伦比亚特区' },
  { code: 'FL', nameEn: 'Florida', nameZh: '佛罗里达州' },
  { code: 'GA', nameEn: 'Georgia', nameZh: '佐治亚州' },
  { code: 'HI', nameEn: 'Hawaii', nameZh: '夏威夷州' },
  { code: 'ID', nameEn: 'Idaho', nameZh: '爱达荷州' },
  { code: 'IL', nameEn: 'Illinois', nameZh: '伊利诺伊州' },
  { code: 'IN', nameEn: 'Indiana', nameZh: '印第安纳州' },
  { code: 'IA', nameEn: 'Iowa', nameZh: '爱荷华州' },
  { code: 'KS', nameEn: 'Kansas', nameZh: '堪萨斯州' },
  { code: 'KY', nameEn: 'Kentucky', nameZh: '肯塔基州' },
  { code: 'LA', nameEn: 'Louisiana', nameZh: '路易斯安那州' },
  { code: 'ME', nameEn: 'Maine', nameZh: '缅因州' },
  { code: 'MD', nameEn: 'Maryland', nameZh: '马里兰州' },
  { code: 'MA', nameEn: 'Massachusetts', nameZh: '马萨诸塞州' },
  { code: 'MI', nameEn: 'Michigan', nameZh: '密歇根州' },
  { code: 'MN', nameEn: 'Minnesota', nameZh: '明尼苏达州' },
  { code: 'MS', nameEn: 'Mississippi', nameZh: '密西西比州' },
  { code: 'MO', nameEn: 'Missouri', nameZh: '密苏里州' },
  { code: 'MT', nameEn: 'Montana', nameZh: '蒙大拿州' },
  { code: 'NE', nameEn: 'Nebraska', nameZh: '内布拉斯加州' },
  { code: 'NV', nameEn: 'Nevada', nameZh: '内华达州' },
  { code: 'NH', nameEn: 'New Hampshire', nameZh: '新罕布什尔州' },
  { code: 'NJ', nameEn: 'New Jersey', nameZh: '新泽西州' },
  { code: 'NM', nameEn: 'New Mexico', nameZh: '新墨西哥州' },
  { code: 'NY', nameEn: 'New York', nameZh: '纽约州' },
  { code: 'NC', nameEn: 'North Carolina', nameZh: '北卡罗来纳州' },
  { code: 'ND', nameEn: 'North Dakota', nameZh: '北达科他州' },
  { code: 'OH', nameEn: 'Ohio', nameZh: '俄亥俄州' },
  { code: 'OK', nameEn: 'Oklahoma', nameZh: '俄克拉何马州' },
  { code: 'OR', nameEn: 'Oregon', nameZh: '俄勒冈州' },
  { code: 'PA', nameEn: 'Pennsylvania', nameZh: '宾夕法尼亚州' },
  { code: 'RI', nameEn: 'Rhode Island', nameZh: '罗德岛州' },
  { code: 'SC', nameEn: 'South Carolina', nameZh: '南卡罗来纳州' },
  { code: 'SD', nameEn: 'South Dakota', nameZh: '南达科他州' },
  { code: 'TN', nameEn: 'Tennessee', nameZh: '田纳西州' },
  { code: 'TX', nameEn: 'Texas', nameZh: '德克萨斯州' },
  { code: 'UT', nameEn: 'Utah', nameZh: '犹他州' },
  { code: 'VT', nameEn: 'Vermont', nameZh: '佛蒙特州' },
  { code: 'VA', nameEn: 'Virginia', nameZh: '弗吉尼亚州' },
  { code: 'WA', nameEn: 'Washington', nameZh: '华盛顿州' },
  { code: 'WV', nameEn: 'West Virginia', nameZh: '西弗吉尼亚州' },
  { code: 'WI', nameEn: 'Wisconsin', nameZh: '威斯康星州' },
  { code: 'WY', nameEn: 'Wyoming', nameZh: '怀俄明州' },
]

/**
 * 按「XX · Full Name · 中文」格式展示（用于 `<option>` label）。
 * 例：`CA · California · 加利福尼亚州`
 */
export function formatUsStateLabel(s: UsStateOption): string {
  return `${s.code} · ${s.nameEn} · ${s.nameZh}`
}

/**
 * 结构化地址 → 标准美式单段文本：
 * ```
 * Line1
 * Line2 (optional)
 * City, ST, 美国
 * ```
 *
 * 多地址之间以空行分隔。无字段时跳过该行。
 */
export type StructuredAddress = {
  line1: string
  line2?: string
  city: string
  stateCode: string
}

export function formatSingleAddress(a: StructuredAddress): string {
  const lines: string[] = []
  if (a.line1.trim()) lines.push(a.line1.trim())
  if (a.line2 && a.line2.trim()) lines.push(a.line2.trim())
  const tail = [a.city.trim(), a.stateCode.trim(), '美国'].filter(Boolean).join(', ')
  if (tail) lines.push(tail)
  return lines.join('\n')
}

export function formatAddressList(list: readonly StructuredAddress[]): string {
  return list
    .map((a) => formatSingleAddress(a))
    .filter((s) => s.length > 0)
    .join('\n\n')
}
