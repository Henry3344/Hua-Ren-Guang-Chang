/**
 * 宽泛词：单独命中时信息量低；若检索里同时存在「强词」，则要求帖文必须命中至少一个强词，
 * 避免「二手手机」只按「二手」OR 搜出行李箱等无关帖。
 */

/**
 * 全量宽泛/情态词：凡是"**不承载具体品类信息**"的词都应列入，避免它们被 getStrongKeywords
 * 当作强词进而触发"必须包含 X 字符串"的硬过滤，导致弱兜底/宽泛召回被清零。
 * 原则：添加时问自己——"这个词脱离上下文，能定位到站内某一类帖子吗？"
 *   能（如 "iPhone"/"冰箱"/"家教"）→ 不放这里
 *   不能（如 "便宜"/"急出"/"有没有"）→ 放这里
 */
const WEAK_KEYWORDS = new Set([
  // ---- 交易状态 / 新旧程度 ----
  '二手',
  '全新',
  '几乎全新',
  '九成新',
  '九五新',
  '八成新',
  '八五新',
  '七成新',
  '半新',
  '较新',
  // ---- 价格 / 促销情态 ----
  '便宜',
  '低价',
  '低价出',
  '特价',
  '超值',
  '优惠',
  '打折',
  '折扣',
  '包邮',
  '面议',
  '可刀',
  '可议',
  '一口价',
  '白菜价',
  // ---- 买卖 / 处置动作（独立动词，脱离物品时无意义）----
  '出售',
  '出让',
  '出闲置',
  '急出',
  '急转',
  '转让',
  '转卖',
  '求购',
  '收购',
  '收',
  '出',
  '卖',
  '买',
  '处理',
  '清仓',
  '甩卖',
  '打包',
  '打包出',
  '整体出',
  // ---- 交易方式 / 交付 ----
  '同城',
  '自取',
  '面交',
  '送货',
  '邮寄',
  '快递',
  '包邮',
  '上门',
  '当面交易',
  // ---- 拥有者 / 来源描述 ----
  '闲置',
  '个人',
  '自用',
  '家用',
  '私人',
  // ---- 问询/推荐/情感语气 ----
  '推荐',
  '求助',
  '求推荐',
  '有没有',
  '有木有',
  '是否',
  '请问',
  '请教',
  '咨询',
  '帮忙',
  '帮帮',
  '谢谢',
  '感谢',
  '多谢',
  '求大神',
  '求大佬',
  // ---- 量词/程度（出现时几乎总是修饰另一个词）----
  '一些',
  '一个',
  '一部',
  '一件',
  '一套',
  '几个',
  '几件',
  '非常',
  '巨便宜',
  '超便宜',
  '很多',
  '好多',
])

export function isWeakKeyword(k: string): boolean {
  const t = k.trim()
  if (t.length < 2) return true
  if (/^\d+$/.test(t)) return true
  return WEAK_KEYWORDS.has(t)
}

/** 强词：品类、型号、地名、具体名词等；至少命中其一才保留（当强词非空时） */
export function getStrongKeywords(keywords: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of keywords) {
    const t = k.trim()
    if (!t || isWeakKeyword(t)) continue
    const key = t.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(t)
  }
  return out
}

function postTextBlob(p: {
  title: string
  description: string
  location: string
  contact: string
  subCategory: string | null
}): string {
  return `${p.title}\n${p.description}\n${p.location}\n${p.contact}\n${p.subCategory ?? ''}`.toLowerCase()
}

/** 若存在强词，只保留正文/标题/地区/子类中至少命中一个强词的帖子 */
export function filterPostsByStrongKeywords<
  T extends {
    title: string
    description: string
    location: string
    contact: string
    subCategory: string | null
  },
>(posts: T[], keywords: readonly string[]): T[] {
  const strong = getStrongKeywords(keywords)
  if (strong.length === 0) return posts
  const lower = strong.map((s) => s.toLowerCase())
  return posts.filter((p) => {
    const blob = postTextBlob(p)
    return lower.some((s) => blob.includes(s))
  })
}
