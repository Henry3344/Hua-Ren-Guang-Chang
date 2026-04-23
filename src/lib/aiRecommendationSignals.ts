import type { Post } from '@prisma/client'

type PricedRow = { id: string; price: number }

function isJobCategory(c: Post['category']): boolean {
  return c === 'JOB' || c === 'JOB_SEEK'
}

function pricedRows(posts: Post[]): PricedRow[] {
  return posts
    .map((p) => ({ id: p.id, price: p.price != null ? Number(p.price) : NaN }))
    .filter((x) => Number.isFinite(x.price)) as PricedRow[]
}

function priceAscRank(id: string, sorted: PricedRow[]): number | null {
  const i = sorted.findIndex((r) => r.id === id)
  return i < 0 ? null : i + 1
}

/** 在当前结果集中、仅对「有标价」的帖子分位（相对信号） */
function pricePercentileLabel(rank: number, total: number): string {
  if (total <= 0) return 'no_priced_peer'
  if (total === 1) return 'only_priced_in_this_result_set'
  const pct = (rank - 1) / (total - 1)
  if (pct <= 0.1) return 'lowest_10pct_among_priced'
  if (pct <= 0.25) return 'lower_quartile_among_priced'
  if (pct >= 0.9) return 'highest_10pct_among_priced'
  if (pct >= 0.75) return 'upper_quartile_among_priced'
  return 'mid_range_among_priced'
}

function freshnessLabel(createdAt: Date): string {
  const days = (Date.now() - createdAt.getTime()) / 86400000
  if (days <= 3) return 'recent_3d'
  if (days <= 7) return 'recent_7d'
  if (days <= 30) return 'recent_30d'
  return 'older'
}

function subcategoryBucketCounts(posts: Post[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of posts) {
    const k = `${p.category}|${(p.subCategory ?? '').trim().toLowerCase()}`
    m.set(k, (m.get(k) ?? 0) + 1)
  }
  return m
}

/** 仅表示「当前合并结果列表」内同类计数，不代表全站供给 */
function rarityLabel(p: Post, counts: Map<string, number>): string {
  const k = `${p.category}|${(p.subCategory ?? '').trim().toLowerCase()}`
  const c = counts.get(k) ?? 0
  if (c <= 1) return 'sole_in_this_merged_page_only_not_site_wide'
  if (c === 2) return 'few_in_this_merged_page_only'
  if (c <= 4) return 'some_in_this_merged_page_only'
  return 'many_in_this_merged_page_only'
}

function priceStatsForMin(posts: Post[]) {
  const nums = posts
    .map((p) => (p.price != null ? Number(p.price) : NaN))
    .filter((n) => Number.isFinite(n))
  if (nums.length === 0) {
    return { minP: null as number | null, countAtMin: 0 }
  }
  const minP = Math.min(...nums)
  const countAtMin = posts.filter(
    (p) => p.price != null && Number.isFinite(Number(p.price)) && Number(p.price) === minP,
  ).length
  return { minP, countAtMin }
}

/**
 * 程序侧客观 + **相对**信号（限当前检索结果集），供 LLM 只作转述。
 */
export function buildRecommendationFactsBlock(posts: Post[]): string {
  if (posts.length === 0) return ''
  const { minP, countAtMin } = priceStatsForMin(posts)
  const pricedSorted = [...pricedRows(posts)].sort((a, b) => a.price - b.price)
  const nPriced = pricedSorted.length
  const subCounts = subcategoryBucketCounts(posts)

  const lines: string[] = [
    '说明：以下为程序对「当前合并后的检索结果列表」的指标；rarity_* 仅反映本列表内同类帖子多少，不得表述为全站稀缺或整体供给紧张。',
    '推荐理由只能转述这些字段，不得编造未出现的地理/通勤/全站数据。',
  ]
  const n = Math.min(posts.length, 12)
  for (let i = 0; i < n; i++) {
    const p = posts[i]!
    const idx = i + 1
    const bits: string[] = [`list_position=${idx}`]
    if (p.isPinned) bits.push('is_featured=true')

    const created =
      p.createdAt instanceof Date ? p.createdAt : new Date(String(p.createdAt))
    bits.push(`freshness=${freshnessLabel(created)}`)
    bits.push(`rarity_in_merged_results_only=${rarityLabel(p, subCounts)}`)

    const pv = p.price != null ? Number(p.price) : null
    if (pv != null && Number.isFinite(pv)) {
      bits.push(`price_value=${pv}`)
      const rk = priceAscRank(p.id, pricedSorted)
      if (rk != null && nPriced > 0) {
        bits.push(`price_percentile=${pricePercentileLabel(rk, nPriced)}`)
      }
      if (minP != null && pv === minP) {
        bits.push(
          countAtMin === 1
            ? 'price_signal=sole_minimum_in_this_result_set'
            : 'price_signal=tied_minimum_in_this_result_set',
        )
      } else {
        bits.push('price_signal=not_minimum_in_this_result_set')
      }
    } else {
      bits.push('price_value=null(站内未填标价)')
    }
    lines.push(`帖子${idx}：${bits.join('，')}`)
  }
  return lines.join('\n')
}

/** 与上面信号一致的规则兜底（无 LLM 时） */
export function briefReasonFromSignals(p: Post, index: number, posts: Post[]): string {
  const { minP, countAtMin } = priceStatsForMin(posts)
  const pv = p.price != null ? Number(p.price) : null
  const pricedSorted = [...pricedRows(posts)].sort((a, b) => a.price - b.price)
  const nPriced = pricedSorted.length
  const rk = priceAscRank(p.id, pricedSorted)

  const created =
    p.createdAt instanceof Date ? p.createdAt : new Date(String(p.createdAt))
  const fresh = freshnessLabel(created)

  const job = isJobCategory(p.category)

  if (pv != null && Number.isFinite(pv) && minP != null && pv === minP) {
    if (job) {
      return countAtMin === 1
        ? `当前结果中薪资最低（${pv}）`
        : `与当前结果最低薪资并列（${pv}）`
    }
    return countAtMin === 1 ? '当前结果中标价最低' : '与当前结果最低价并列'
  }
  if (rk != null && nPriced >= 3) {
    const lbl = pricePercentileLabel(rk, nPriced)
    if (job) {
      if (lbl === 'lowest_10pct_among_priced') return '在有薪资标注的帖子里属于较低段'
      if (lbl === 'lower_quartile_among_priced') return '薪资偏低（有薪资样本内）'
    } else {
      if (lbl === 'lowest_10pct_among_priced') return '在有标价的帖子里属于较低价位段'
      if (lbl === 'lower_quartile_among_priced') return '标价偏低（有标价样本内）'
    }
  }
  if (fresh === 'recent_3d') return p.isPinned ? '近 3 天内发布，且为置顶展示' : '近 3 天内发布'
  if (fresh === 'recent_7d') return p.isPinned ? '近一周内发布，且为置顶展示' : '近一周内发布'

  const subCounts = subcategoryBucketCounts(posts)
  const rar = rarityLabel(p, subCounts)
  if (rar === 'sole_in_this_merged_page_only_not_site_wide')
    return '在当前展示列表里该大类/子类仅一条（不代表全站只有一条）'
  if (rar === 'few_in_this_merged_page_only')
    return p.isPinned
      ? '在当前展示列表里同类帖较少，且为置顶展示'
      : '在当前展示列表里同类帖较少（仅指本页合并结果）'

  if (index === 0) return p.isPinned ? '综合排序靠前，且为置顶展示' : '综合排序靠前'
  return p.isPinned ? '置顶展示，可作对比参考' : '可作对比参考'
}

/** 前端展示的短标签（与程序信号一致，供用户感知「有依据的推荐」） */
export function buildRecommendationChipsUi(posts: Post[]): { postId: string; chips: string[] }[] {
  if (posts.length === 0) return []
  const pricedSorted = [...pricedRows(posts)].sort((a, b) => a.price - b.price)
  const nPriced = pricedSorted.length
  const subCounts = subcategoryBucketCounts(posts)
  const { minP, countAtMin } = priceStatsForMin(posts)
  const out: { postId: string; chips: string[] }[] = []

  const n = Math.min(posts.length, 20)
  for (let i = 0; i < n; i++) {
    const p = posts[i]!
    const chips: string[] = []
    if (p.isPinned) chips.push('置顶')

    const created =
      p.createdAt instanceof Date ? p.createdAt : new Date(String(p.createdAt))
    const fresh = freshnessLabel(created)
    if (fresh === 'recent_3d') chips.push('发布：近 3 天')
    else if (fresh === 'recent_7d') chips.push('发布：近 7 天')
    else if (fresh === 'recent_30d') chips.push('发布：近 30 天')

    const pv = p.price != null ? Number(p.price) : null
    const job = isJobCategory(p.category)
    if (pv != null && Number.isFinite(pv) && nPriced > 0) {
      const rk = priceAscRank(p.id, pricedSorted)
      if (rk != null && minP != null && pv === minP && countAtMin >= 1) {
        chips.push(
          job
            ? countAtMin === 1
              ? '薪资：当前列表最低'
              : '薪资：并列最低'
            : countAtMin === 1
              ? '价格：当前列表最低标价'
              : '价格：并列最低标价',
        )
      } else if (rk != null) {
        const lbl = pricePercentileLabel(rk, nPriced)
        if (job) {
          if (lbl === 'lowest_10pct_among_priced') chips.push('薪资：同类前 10% 偏低')
          else if (lbl === 'lower_quartile_among_priced') chips.push('薪资：同类偏低（前 25%）')
          else if (lbl === 'upper_quartile_among_priced') chips.push('薪资：偏高段')
        } else {
          if (lbl === 'lowest_10pct_among_priced') chips.push('价格：同类标价前 10% 偏低')
          else if (lbl === 'lower_quartile_among_priced') chips.push('价格：同类标价偏低（前 25%）')
          else if (lbl === 'upper_quartile_among_priced') chips.push('价格：标价偏高段')
        }
      }
    } else {
      chips.push(job ? '薪资：帖内未填' : '价格：帖内未填')
    }

    const rar = rarityLabel(p, subCounts)
    if (rar === 'sole_in_this_merged_page_only_not_site_wide')
      chips.push('列表内：该子类仅本条')
    else if (rar === 'few_in_this_merged_page_only') chips.push('列表内：同类帖较少')

    out.push({ postId: p.id, chips: chips.slice(0, 5) })
  }
  return out
}
