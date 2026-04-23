import type { Category } from '@prisma/client'
import type { AiLocationPayload } from '@/lib/aiSearchRag'
import { retrievePostsForAiQuery } from '@/lib/aiSearchRag'
import {
  inferCategoriesForAiQuery,
  inferCategoriesWithThreadContext,
  inferJobSub,
  inferRentSub,
  inferSecondhandSub,
  pickJobSubWeakSeed,
  pickRentSubWeakSeed,
  pickSecondhandSubWeakSeed,
} from '@/lib/aiSearchCategory'
import { buildRetrieveOptsFromParse } from '@/lib/aiRetrieveOpts'
import { parseAiStructuredQueryWithGroq } from '@/lib/aiStructuredParse'
import type { AiStructuredParseAttempt } from '@/lib/aiStructuredParse'
import {
  extractHeuristicPriceCapUsd,
  hasExplicitBudgetInText,
} from '@/lib/aiBudgetHeuristic'
import { requiredAnyOfHasBrandLock } from '@/lib/aiQueryKeywords'

export type TrackDebugRow = {
  key: string
  query: string
  hitCount: number
  poolSize: number
  top1Title: string | null
  /** 本轨返回条数占过滤后候选池比例（近似「命中率」） */
  hitRatioPct: number
}

export function buildTrackDebugRow(
  key: string,
  query: string,
  r: Awaited<ReturnType<typeof retrievePostsForAiQuery>>,
): TrackDebugRow {
  const pool = r.total > 0 ? r.total : 1
  return {
    key,
    query: query.slice(0, 200),
    hitCount: r.posts.length,
    poolSize: r.total,
    top1Title: r.posts[0]?.title ? r.posts[0].title.slice(0, 100) : null,
    hitRatioPct: Math.min(100, Math.round((r.posts.length / pool) * 100)),
  }
}

type AiRetrieved = Awaited<ReturnType<typeof retrievePostsForAiQuery>>['posts'][number]

/**
 * 主检索无帖时按序尝试：放宽价位 → 去掉价位 → 全州/全州级（若当前为城市）→ 弱约束泛词。
 * 返回首次有结果的检索与说明文案。
 */
export async function tryRelaxedRecallWhenEmpty(opts: {
  retrievalQuery: string
  /** 与 chat 路由一致，用于价位启发式（含合并意图） */
  budgetSourceText?: string
  /** 多轮用户发言合并串，用于类目推断兜底 */
  consolidatedUserTurns?: string
  location: AiLocationPayload | undefined
  filters: { category?: Category; sub?: string } | undefined
  userId: string
  parseOrig: AiStructuredParseAttempt
}): Promise<{
  posts: AiRetrieved[]
  keywordsUsed: string[]
  userNote: string
  extraTrackDebug: TrackDebugRow[]
} | null> {
  const { retrievalQuery, budgetSourceText, location, filters, userId, parseOrig } = opts
  const inf = inferCategoriesWithThreadContext(
    retrievalQuery,
    opts.consolidatedUserTurns ?? retrievalQuery,
  )
  const budgetBlob = budgetSourceText ?? retrievalQuery
  const baseOpts = buildRetrieveOptsFromParse(parseOrig, retrievalQuery, inf, {
    budgetSourceText: budgetBlob,
  })
  /** 用户明确写了「100左右」等：不允许去掉价位筛选去凑结果 */
  const strictBudget =
    hasExplicitBudgetInText(budgetBlob) ||
    (baseOpts.priceMax != null && baseOpts.priceMax <= 350)
  const extraTrackDebug: TrackDebugRow[] = []

  const retrieveOpts = (patch: Partial<typeof baseOpts> = {}) => ({
    priceMin: patch.priceMin ?? baseOpts.priceMin,
    priceMax: patch.priceMax ?? baseOpts.priceMax,
    keywordOverride: patch.keywordOverride ?? baseOpts.keywordOverride,
    requiredAnyOf: patch.requiredAnyOf ?? baseOpts.requiredAnyOf,
  })

  const runRetrieve = (
    q: string,
    loc: AiLocationPayload | undefined,
    o: ReturnType<typeof retrieveOpts>,
    cat: Category[] | undefined,
  ) =>
    retrievePostsForAiQuery(q, loc, filters, userId, cat, {
      priceMin: o.priceMin,
      priceMax: o.priceMax,
      keywordOverride: o.keywordOverride,
      requiredAnyOf: o.requiredAnyOf,
    })

  /** ① 价位上限放宽（若有）；低预算时小幅放宽，避免一步拉到无关高价帖 */
  if (baseOpts.priceMax != null && baseOpts.priceMax > 0) {
    const cap0 = extractHeuristicPriceCapUsd(budgetBlob)
    const newMax = strictBudget
      ? Math.min(
          Math.ceil(baseOpts.priceMax * (cap0 != null && cap0 <= 200 ? 1.35 : 1.2)),
          baseOpts.priceMax + (cap0 != null && cap0 <= 200 ? 80 : 200),
        )
      : Math.ceil(baseOpts.priceMax * 1.12 + 50)
    const r = await runRetrieve(
      retrievalQuery,
      location,
      retrieveOpts({ priceMax: newMax }),
      baseOpts.categoryIn,
    )
    extraTrackDebug.push(buildTrackDebugRow('relax_price_ceiling', `${retrievalQuery} (max→$${newMax})`, r))
    if (r.posts.length > 0) {
      return {
        posts: r.posts,
        keywordsUsed: r.keywordsUsed,
        userNote: `未找到在「约 $${baseOpts.priceMax} 以内」条件下足够匹配的结果；以下为将预算上限放宽到约 **$${newMax}** 后仍相关的帖子（仅供参考，请点开详情核对价格）。\n\n`,
        extraTrackDebug,
      }
    }
  }

  /** ② 去掉价位过滤（用户未明确预算时才做，否则会塞进 $500+ 等与预期不符的帖） */
  if (!strictBudget && (baseOpts.priceMin != null || baseOpts.priceMax != null)) {
    const r = await runRetrieve(
      retrievalQuery,
      location,
      retrieveOpts({ priceMin: null, priceMax: null }),
      baseOpts.categoryIn,
    )
    extraTrackDebug.push(buildTrackDebugRow('relax_strip_price', retrievalQuery, r))
    if (r.posts.length > 0) {
      return {
        posts: r.posts,
        keywordsUsed: r.keywordsUsed,
        userNote:
          '按原价位未搜到足够结果；以下为**去掉价位筛选**后的相关帖子（标价请以帖内为准）。\n\n',
        extraTrackDebug,
      }
    }
  }

  /** ③ 地区：城市/片区 → 全州（同州更大范围） */
  const loc = location ?? {}
  if (loc.locScope === 'metro' && loc.locState) {
    const wideLoc: AiLocationPayload = {
      locScope: 'state',
      locState: loc.locState,
      locCity: undefined,
      locArea: undefined,
    }
    const r = await runRetrieve(retrievalQuery, wideLoc, retrieveOpts(), baseOpts.categoryIn)
    extraTrackDebug.push(buildTrackDebugRow('relax_statewide', `${retrievalQuery} @[全州 ${loc.locState}]`, r))
    if (r.posts.length > 0) {
      return {
        posts: r.posts,
        keywordsUsed: r.keywordsUsed,
        userNote: `在当前城市/片区条件下暂无匹配；以下为**扩大到本州范围**后搜到的相关帖子（注意地区与通勤）。\n\n`,
        extraTrackDebug,
      }
    }
  }

  /**
   * ④ 弱约束泛词（最后手段）——"泛化要有度"：
   *    只在与用户意图**同一个子类**的池内拉关键词召回；跨子类不串味。
   *    - 若能从主句/多轮上下文推断出具体子类（如 VR → 手机数码）：
   *        · 使用子类专属 seed（如 "手机 数码 平板 游戏机 …"）；
   *        · 把 `filters.sub = <子类>` 也传下去，由 DB 侧再加一道过滤；
   *        · seed 里所有 token 都是"宽泛情态/同子类品类词"，不做 requiredAnyOf 硬约束。
   *    - 若**无法**推断子类：不再拉"整个大类"的 seed（避免用户搜 VR 却被推 iPhone/行李箱），
   *      直接返回 null，让路由给出"暂无匹配"提示。
   */
  const primaryLock = inferCategoriesWithThreadContext(
    retrievalQuery,
    opts.consolidatedUserTurns ?? retrievalQuery,
  )
  const primaryCat = primaryLock?.[0]
  const subHint = inferSubForPrimaryCategory(primaryCat, retrievalQuery, opts.consolidatedUserTurns)
  if (!subHint) {
    extraTrackDebug.push({
      key: 'relax_weak_query_skipped',
      query: '(no subcategory inferred → refuse generic pool dump)',
      hitCount: 0,
      poolSize: 0,
      top1Title: null,
      hitRatioPct: 0,
    })
    return null
  }

  const weakQ = subHint.seed
  const weakParse = await parseAiStructuredQueryWithGroq(weakQ)
  const infW = inferCategoriesForAiQuery(weakQ)
  const optsW = buildRetrieveOptsFromParse(weakParse, weakQ, infW, {
    budgetSourceText: budgetBlob,
  })
  const weakCategoryIn = primaryLock && primaryLock.length >= 1 ? primaryLock : optsW.categoryIn
  /** 合并用户已有的 filters 与推断出的子类：用户显式选择的子类优先 */
  const weakFilters = filters?.sub ? filters : { ...(filters ?? {}), sub: subHint.sub }
  /**
   * SECONDHAND 弱轨兜底也必须保留「明确物品词」约束：
   *   - 旧逻辑只在品牌锁场景（如三星/iphone）保留 requiredAnyOf，
   *     但像「vr / quest / xbox / 耳机 / 冰箱」这类明确商品词若被放开，
   *     seed（"手机 数码 平板 游戏机 …"）会把同子类但完全不相干的帖子拉进来，
   *     例如「VR」→「奶茶店设备转让」或「iPhone」。
   *   - 对用户来说，"没有精确结果"比"胡乱给我便宜但不相关的东西"更可接受。
   *
   * 因此：
   *   1) 品牌锁仍然保留；
   *   2) SECONDHAND 且已经抽到 requiredAnyOf 时，也一并保留。
   */
  const brandLocked = requiredAnyOfHasBrandLock(baseOpts.requiredAnyOf)
  const secondhandExplicitItemLocked =
    !!baseOpts.requiredAnyOf &&
    baseOpts.requiredAnyOf.length > 0 &&
    !!weakCategoryIn &&
    weakCategoryIn.length > 0 &&
    weakCategoryIn.every((c) => c === 'SECONDHAND')
  const rWeak = await retrievePostsForAiQuery(weakQ, location, weakFilters, userId, weakCategoryIn, {
    priceMin: optsW.priceMin,
    priceMax: optsW.priceMax,
    keywordOverride: optsW.keywordOverride,
    requiredAnyOf:
      brandLocked || secondhandExplicitItemLocked ? baseOpts.requiredAnyOf : undefined,
  })
  extraTrackDebug.push(
    buildTrackDebugRow('relax_weak_query_sub', `${weakQ} @[${subHint.sub}]`, rWeak),
  )
  if (rWeak.posts.length > 0) {
    return {
      posts: rWeak.posts,
      keywordsUsed: rWeak.keywordsUsed,
      userNote: `按你描述的条件暂未精确命中；以下为同类目「**${subHint.sub}**」下的相关帖子，可作参考。建议再补充地区、预算或具体型号后重试。\n\n`,
      extraTrackDebug,
    }
  }

  return null
}

/**
 * 根据主类推断子类：SECONDHAND → 手机数码/家具家电/…；RENT → 车位/整租/…；JOB → 餐饮/保洁/…
 * 先用本轮检索句推断；失败时尝试多轮用户发言的合并串（承接短句追问）。
 */
function inferSubForPrimaryCategory(
  primaryCat: Category | undefined,
  retrievalQuery: string,
  consolidated: string | undefined,
): { sub: string; seed: string } | undefined {
  if (!primaryCat) return undefined
  const tryTexts = [retrievalQuery, consolidated].filter((x): x is string => !!x && x.trim().length > 0)
  if (primaryCat === 'SECONDHAND') {
    for (const txt of tryTexts) {
      const sh = inferSecondhandSub(txt)
      if (sh) return { sub: sh, seed: pickSecondhandSubWeakSeed(sh) }
    }
  } else if (primaryCat === 'RENT' || primaryCat === 'RENT_SEEK') {
    for (const txt of tryTexts) {
      const rs = inferRentSub(txt)
      if (rs) return { sub: rs, seed: pickRentSubWeakSeed(rs) }
    }
  } else if (primaryCat === 'JOB' || primaryCat === 'JOB_SEEK') {
    for (const txt of tryTexts) {
      const jb = inferJobSub(txt)
      if (jb) return { sub: jb, seed: pickJobSubWeakSeed(jb) }
    }
  }
  return undefined
}
