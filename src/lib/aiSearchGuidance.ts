import type { Category } from '@prisma/client'
import {
  inferJobSub,
  inferRentSub,
  inferSecondhandSub,
} from '@/lib/aiSearchCategory'

/** 前端渲染的单个导航按钮 */
export type AiNoResultCta = {
  href: string
  label: string
  /** primary=主按钮（与用户意图最接近），default=次级快捷入口 */
  kind?: 'primary' | 'default'
}

/**
 * 站内无命中时的简短引导（不罗列检索词与放宽链路，避免冗长）。
 */
export function noRagResultGuidance(
  _keywordsUsed: readonly string[],
  regionHint: string,
): string {
  return (
    `站内暂时没有匹配的帖子。\n\n` +
    `当前检索范围：${regionHint}。若地区选得太窄，也可在页头把地区改成「全州」或更大范围后再试。\n\n` +
    `也可点下方按钮到相应分类列表浏览。`
  )
}

/** Category → 顶级分类按钮显示名 */
function topLabelFor(cat: Category): string {
  switch (cat) {
    case 'RENT':
    case 'RENT_SEEK':
      return '找房源'
    case 'JOB':
    case 'JOB_SEEK':
      return '找工作'
    case 'SECONDHAND':
      return '找二手'
    default:
      return '打开分类列表'
  }
}

/** 顶级分类的列表 URL */
function topHrefFor(cat: Category): string {
  if (cat === 'RENT_SEEK') return `/posts?category=RENT_SEEK`
  if (cat === 'JOB_SEEK') return `/posts?category=JOB_SEEK`
  return `/posts?category=${cat}`
}

/** 依照主类推断"同子类"入口，如 SECONDHAND+手机数码 → /posts?category=SECONDHAND&sub=手机数码 */
function inferSubForCategory(
  cat: Category,
  text: string,
): string | undefined {
  if (cat === 'SECONDHAND') return inferSecondhandSub(text)
  if (cat === 'RENT' || cat === 'RENT_SEEK') return inferRentSub(text)
  if (cat === 'JOB' || cat === 'JOB_SEEK') return inferJobSub(text)
  return undefined
}

/**
 * 无命中时返回的一组分类导航按钮：
 *   1) 若能推断出主类+子类：首个"主按钮"精准指向 /posts?category=X&sub=Y；
 *   2) 否则若能推断主类：首个"主按钮"指向对应顶级分类；
 *   3) 总是附带三路顶级分类（找房源/找工作/找二手）做保底；
 *   4) 最后再带一个「全站列表」兜底入口（携带用户关键词 q）。
 *   同一 href 不重复加入。
 */
export function buildNoResultCtaList(opts: {
  primaryCategory: Category | undefined
  /** 用来推断子类的文本（通常是 retrievalQuery 或原始用户输入） */
  intentText: string
  /** 兜底「全站列表」入口携带的 ?q= */
  qParam: string
}): AiNoResultCta[] {
  const { primaryCategory, intentText, qParam } = opts
  const list: AiNoResultCta[] = []
  const pushed = new Set<string>()
  const add = (item: AiNoResultCta) => {
    if (pushed.has(item.href)) return
    pushed.add(item.href)
    list.push(item)
  }

  if (primaryCategory) {
    const sub = inferSubForCategory(primaryCategory, intentText)
    if (sub) {
      add({
        href: `${topHrefFor(primaryCategory)}&sub=${encodeURIComponent(sub)}`,
        label: `去「${sub}」列表浏览`,
        kind: 'primary',
      })
    } else {
      add({
        href: topHrefFor(primaryCategory),
        label: `去「${topLabelFor(primaryCategory)}」列表浏览`,
        kind: 'primary',
      })
    }
  }

  const defaults: Array<{ cat: Category; label: string }> = [
    { cat: 'RENT', label: '找房源' },
    { cat: 'JOB', label: '找工作' },
    { cat: 'SECONDHAND', label: '找二手' },
  ]
  for (const d of defaults) {
    add({ href: topHrefFor(d.cat), label: d.label, kind: 'default' })
  }

  if (qParam) {
    add({ href: `/posts?q=${qParam}`, label: '全站列表关键词搜索', kind: 'default' })
  }
  return list
}
