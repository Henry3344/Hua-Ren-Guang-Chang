import type { Category } from '@prisma/client'
import { HOME_SUBS, MERCHANT_CATEGORY_CHIPS } from '@/lib/homeCategorySubs'
import { DEFAULT_GROQ_MODEL, groqChatJson } from '@/lib/groqJson'
import { extractAiQueryKeywords } from '@/lib/aiQueryKeywords'
import {
  categoriesForDomain,
  normalizeAiStructuredQuery,
  sanitizeStructuredQueryAgainstUserText,
  structuredQueryToKeywords,
  type AiStructuredQuery,
} from '@/lib/aiQuerySchema'

type GroqAiQueryJson = {
  domain?: string | null
  price_min?: number | string | null
  price_max?: number | string | null
  location_text?: string | null
  room_type?: string | null
  rent_mode?: string | null
  has_pet?: boolean | string | null
  near_subway?: boolean | string | null
  parking?: boolean | string | null
  work_type?: string | null
  language?: string | null
  tax_type?: string | null
  item?: string | null
  brand?: string | null
  model?: string | null
  condition?: string | null
  keywords?: string[] | null
}

const SYSTEM = [
  '你是分类信息站的“结构化查询参数提取器”。',
  '任务：把用户自然语言需求转换为 JSON 查询参数。',
  '要求：只输出一个 JSON 对象；不要解释、不要 Markdown、不要多余文字。',
  '字段说明：',
  '- domain: RENT | JOB | SECONDHAND | UNKNOWN（房源/招聘/二手/不确定）',
  '- price_min/price_max: 数字（美元），没有就 null',
  '- location_text: 纯文本地点（如 Irvine / 法拉盛），没有就 null',
  'RENT 可选字段：room_type, rent_mode, has_pet, near_subway, parking',
  'JOB 可选字段：work_type, language, tax_type',
  'SECONDHAND 可选字段：item, brand, model, condition',
  '- keywords: 额外补充关键词数组（没有就 [] 或 null）',
  '',
  '严格要求（非常重要）：',
  '- location_text、item、brand、model、keywords 里的词必须能在用户原文中找到依据；不要猜测地点或物品。',
  '- 用户没说二手/转让/闲置等信息时，不要把 domain 设为 SECONDHAND。',
  '- 用户提到“车位/停车位/车库出租/找车位”等，domain 应为 RENT，并设置 parking=true，rent_mode 可用“车位”。',
  '- 「店面/商铺/旺铺/写字楼/办公室出租」「生意转让/转店」等为 RENT；不要标成 SECONDHAND。',
  '- 「找工作/找个工作/应聘/找岗位」为 JOB（招聘帖）；个人发帖求职、找同伴才是 JOB_SEEK。',
  `- 租房发帖子类参考：${HOME_SUBS.RENT.join('、')}；招聘子类：${HOME_SUBS.JOB.join('、')}；二手子类：${HOME_SUBS.SECONDHAND.join('、')}（与首页入口一致，便于对齐检索）。`,
  '- 找「认证商家、黄页店铺、仅要实体店电话/地图」且明显不是发帖租售转让时，可为 UNKNOWN；keywords 用用户原话中的店名、服务类型。',
  `- 商家黄页行业示例（非发帖大类）：${MERCHANT_CATEGORY_CHIPS.join('、')}。`,
  '- 不确定就填 UNKNOWN，并把不确定的字段设为 null。',
  '- 用户给出预算或价位（如「100左右」「200以内」「$80」）时，必须把对应数字写入 price_max 或 price_min（美元整数）；不要忽略小额预算。',
].join('\n')

export type AiStructuredParseAttempt =
  | {
      ok: true
      structured: AiStructuredQuery
      keywords: string[]
      categoryIn?: Category[]
      groqModel: string
    }
  | { ok: false; error: string }

export async function parseAiStructuredQueryWithGroq(
  userText: string,
): Promise<AiStructuredParseAttempt> {
  const prompt = [
    '用户输入：',
    userText,
    '',
    '输出 JSON 示例：',
    '{',
    '  "domain": "SECONDHAND",',
    '  "item": "手机",',
    '  "brand": null,',
    '  "model": null,',
    '  "condition": "二手",',
    '  "price_min": null,',
    '  "price_max": 200,',
    '  "location_text": "法拉盛",',
    '  "keywords": ["便宜"]',
    '}',
  ].join('\n')

  const r = await groqChatJson<GroqAiQueryJson>([
    { role: 'system', content: SYSTEM },
    { role: 'user', content: prompt },
  ])
  if (!r.ok) return { ok: false, error: r.error }

  const structured0 = normalizeAiStructuredQuery(userText, r.json)
  const structured = sanitizeStructuredQueryAgainstUserText(structured0)
  let keywords = structuredQueryToKeywords(structured)
  if (keywords.length === 0) {
    keywords = extractAiQueryKeywords(userText)
  }
  const categoryIn = categoriesForDomain(structured.domain)
  return { ok: true, structured, keywords, categoryIn, groqModel: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL }
}

