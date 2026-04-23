import type { Category } from '@prisma/client'

export type AiQueryDomain = 'RENT' | 'JOB' | 'SECONDHAND' | 'UNKNOWN'

export type AiStructuredQueryBase = {
  domain: AiQueryDomain
  raw_text: string
  keywords?: string[] | null
  location_text?: string | null
  price_min?: number | null
  price_max?: number | null
}

// 房源（租/找房）
export type AiRentQuery = AiStructuredQueryBase & {
  domain: 'RENT'
  room_type?: string | null // 例：1b1b/2b1b/两室一厅/Studio
  rent_mode?: string | null // 例：整租/合租/分租/床位
  has_pet?: boolean | null
  near_subway?: boolean | null
  parking?: boolean | null
}

// 招聘/求职
export type AiJobQuery = AiStructuredQueryBase & {
  domain: 'JOB'
  work_type?: string | null // 全职/兼职
  language?: string | null
  tax_type?: string | null // 报税/现金
}

// 二手
export type AiSecondhandQuery = AiStructuredQueryBase & {
  domain: 'SECONDHAND'
  item?: string | null // 手机/行李箱/家具...
  brand?: string | null
  model?: string | null
  condition?: string | null // 全新/九成新...
}

export type AiUnknownQuery = AiStructuredQueryBase & { domain: 'UNKNOWN' }

export type AiStructuredQuery = AiRentQuery | AiJobQuery | AiSecondhandQuery | AiUnknownQuery

function n(v: unknown): number | null | undefined {
  if (v == null) return null
  const x = Number(v)
  if (!Number.isFinite(x)) return null
  return x
}
function s(v: unknown): string | null | undefined {
  if (v == null) return null
  const t = String(v).trim()
  return t ? t : null
}
function b(v: unknown): boolean | null | undefined {
  if (v == null) return null
  if (typeof v === 'boolean') return v
  const t = String(v).trim().toLowerCase()
  if (['true', 'yes', 'y', '1', '是', '有', '要', '靠近'].includes(t)) return true
  if (['false', 'no', 'n', '0', '否', '没有', '不要', '不靠近'].includes(t)) return false
  return null
}

export function normalizeAiStructuredQuery(rawText: string, j: unknown): AiStructuredQuery {
  const r: Record<string, unknown> =
    j && typeof j === 'object' && !Array.isArray(j) ? (j as Record<string, unknown>) : {}
  const domainRaw = s(r.domain)?.toUpperCase() || 'UNKNOWN'
  const domain: AiQueryDomain =
    domainRaw === 'RENT' || domainRaw === 'JOB' || domainRaw === 'SECONDHAND' ? domainRaw : 'UNKNOWN'

  const base: AiStructuredQueryBase = {
    domain,
    raw_text: rawText,
    keywords: Array.isArray(r.keywords)
      ? r.keywords.map((x) => String(x).trim()).filter(Boolean)
      : null,
    location_text: s(r.location_text),
    price_min: n(r.price_min) ?? null,
    price_max: n(r.price_max) ?? null,
  }

  if (domain === 'RENT') {
    return {
      ...base,
      domain,
      room_type: s(r.room_type),
      rent_mode: s(r.rent_mode),
      has_pet: b(r.has_pet),
      near_subway: b(r.near_subway),
      parking: b(r.parking),
    }
  }
  if (domain === 'JOB') {
    return {
      ...base,
      domain,
      work_type: s(r.work_type),
      language: s(r.language),
      tax_type: s(r.tax_type),
    }
  }
  if (domain === 'SECONDHAND') {
    return {
      ...base,
      domain,
      item: s(r.item),
      brand: s(r.brand),
      model: s(r.model),
      condition: s(r.condition),
    }
  }
  return base
}

export function categoriesForDomain(domain: AiQueryDomain): Category[] | undefined {
  if (domain === 'SECONDHAND') return ['SECONDHAND']
  if (domain === 'RENT') return ['RENT', 'RENT_SEEK']
  /** 与发帖类型一致：招聘启事在 JOB；「找工」求职帖在 JOB_SEEK。搜职位/找工作应对准招聘帖 */
  if (domain === 'JOB') return ['JOB']
  return undefined
}

export function structuredQueryToKeywords(q: AiStructuredQuery): string[] {
  const out: string[] = []
  const push = (v?: string | null) => {
    const t = (v ?? '').trim()
    if (t) out.push(t)
  }
  const secondhandSignals = /二手|转让|闲置|九成新|八成新|全新|出闲|求购/.test(q.raw_text)
  ;(q.keywords ?? []).forEach((x) => push(x))
  push(q.location_text ?? null)
  switch (q.domain) {
    case 'SECONDHAND':
      push(q.item ?? null)
      push(q.brand ?? null)
      push(q.model ?? null)
      push(q.condition ?? null)
      if (secondhandSignals || (q as AiSecondhandQuery).item) {
        if (secondhandSignals) push('二手')
      }
      break
    case 'RENT':
      push(q.room_type ?? null)
      push(q.rent_mode ?? null)
      if (q.near_subway) push('近地铁')
      if (q.parking) push('车位')
      break
    case 'JOB':
      push(q.work_type ?? null)
      push(q.language ?? null)
      push(q.tax_type ?? null)
      break
    default:
      break
  }
  // 数字预算：加入 token 便于文本匹配（同时会走 price filter）
  if (userAllowsPriceHint(q.raw_text)) {
    if (q.price_max != null && Number.isFinite(q.price_max)) out.push(String(Math.round(q.price_max)))
    if (q.price_min != null && Number.isFinite(q.price_min)) out.push(String(Math.round(q.price_min)))
  }
  // 去重
  const seen = new Set<string>()
  return out
    .map((x) => x.trim())
    .filter(Boolean)
    .filter((x) => {
      const k = x.toLowerCase()
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 18)
}

function userAllowsPriceHint(userText: string): boolean {
  const t = (userText ?? '').trim()
  if (!t) return false
  return /\d/.test(t) || /以内|以下|不超过|最多|最少|预算|价位|刀|美元|\$|元/.test(t)
}

function includesEvidence(userText: string, needle: string | null | undefined): boolean {
  if (!needle) return true
  const u = userText.replace(/\s+/g, '').toLowerCase()
  const n = needle.replace(/\s+/g, '').toLowerCase()
  if (!n) return true
  return u.includes(n)
}

/** 车位/停车位 → 租房域（出租/找房帖里更常见） */
export function applyParkingRentOverride(userText: string, q: AiStructuredQuery): AiStructuredQuery {
  const t = userText
  const hit = /车位|停车位|出租车位|求车位|找车位|月租.*(车位|位)|车库/.test(t)
  if (!hit) return q
  if (q.domain === 'RENT') {
    const rq = q as AiRentQuery
    return {
      ...rq,
      parking: true,
      rent_mode: rq.rent_mode || '车位',
    }
  }
  return {
    domain: 'RENT',
    raw_text: q.raw_text,
    keywords: q.keywords,
    location_text: q.location_text,
    price_min: q.price_min,
    price_max: q.price_max,
    room_type: null,
    rent_mode: '车位',
    has_pet: null,
    near_subway: null,
    parking: true,
  }
}

/** 剔除模型幻觉：用户原文未出现的地点/品类/价格等一律清空，避免 OR 检索串味 */
export function clampStructuredQueryToUserText(q: AiStructuredQuery): AiStructuredQuery {
  const u = q.raw_text || ''
  const base: AiStructuredQueryBase = {
    ...q,
    location_text: includesEvidence(u, q.location_text) ? q.location_text : null,
    keywords: (q.keywords ?? []).filter((k) => includesEvidence(u, k)),
    price_min:
      userAllowsPriceHint(u) && q.price_min != null && Number.isFinite(q.price_min) ? q.price_min : null,
    price_max:
      userAllowsPriceHint(u) && q.price_max != null && Number.isFinite(q.price_max) ? q.price_max : null,
  }

  const secondhandSignals = /二手|转让|闲置|九成新|八成新|全新|出闲|求购/.test(u)

  if (q.domain === 'RENT') {
    const rq = q as AiRentQuery
    const parkingHit = /车位|停车|车库/.test(u)
    const rentMode = parkingHit
      ? rq.rent_mode || '车位'
      : rq.rent_mode && includesEvidence(u, rq.rent_mode)
        ? rq.rent_mode
        : null
    return {
      ...base,
      domain: 'RENT',
      room_type: includesEvidence(u, rq.room_type) ? rq.room_type : null,
      rent_mode: rentMode,
      has_pet: /宠物|猫|狗/.test(u) ? rq.has_pet : null,
      near_subway: /地铁|近地铁|走路.*地铁/.test(u) ? rq.near_subway : null,
      parking: parkingHit ? true : null,
    }
  }
  if (q.domain === 'JOB') {
    const jq = q as AiJobQuery
    return {
      ...base,
      domain: 'JOB',
      work_type: includesEvidence(u, jq.work_type) ? jq.work_type : null,
      language: includesEvidence(u, jq.language) ? jq.language : null,
      tax_type: includesEvidence(u, jq.tax_type) ? jq.tax_type : null,
    }
  }
  if (q.domain === 'SECONDHAND') {
    const sq = q as AiSecondhandQuery
    if (!secondhandSignals && !includesEvidence(u, sq.item)) {
      return {
        ...base,
        domain: 'UNKNOWN',
      }
    }
    return {
      ...base,
      domain: 'SECONDHAND',
      item: includesEvidence(u, sq.item) ? sq.item : null,
      brand: includesEvidence(u, sq.brand) ? sq.brand : null,
      model: includesEvidence(u, sq.model) ? sq.model : null,
      condition: includesEvidence(u, sq.condition) ? sq.condition : null,
    }
  }
  if (q.domain === 'UNKNOWN') {
    return { ...base, domain: 'UNKNOWN' }
  }
  return { ...base, domain: 'UNKNOWN' }
}

export function sanitizeStructuredQueryAgainstUserText(q: AiStructuredQuery): AiStructuredQuery {
  const withParking = applyParkingRentOverride(q.raw_text, q)
  return clampStructuredQueryToUserText(withParking)
}

