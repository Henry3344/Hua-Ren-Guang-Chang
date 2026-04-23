import type { Category } from '@prisma/client'
import type { AiStructuredParseAttempt } from '@/lib/aiStructuredParse'
import { mergePriceMaxFromHeuristic } from '@/lib/aiBudgetHeuristic'
import {
  RENT_COMMERCIAL_REQUIRED_ANY_OF,
  RENT_RESIDENTIAL_REQUIRED_ANY_OF,
  RENT_SHORT_TERM_REQUIRED_ANY_OF,
  extractSecondhandItemMatches,
  inferRentIntent,
} from '@/lib/aiSearchCategory'
import { buildRequiredAnyOfWithBrandLock } from '@/lib/aiQueryKeywords'

/**
 * 由 Groq 结构化解析结果 + 启发式大类推断，拼出与 route 一致的 retrievePostsForAiQuery 参数。
 * budgetSourceText：用于价位启发式（多轨改写句里常丢「100左右」，应用主句+合并意图）。
 */
export function buildRetrieveOptsFromParse(
  attempt: AiStructuredParseAttempt,
  queryText: string,
  inferredCategories: Category[] | undefined,
  options?: { budgetSourceText?: string },
): {
  categoryIn: Category[] | undefined
  keywordOverride: string[] | undefined
  priceMin: number | null
  priceMax: number | null
  requiredAnyOf: string[] | undefined
  useStructured: boolean
} {
  const useStructured = attempt.ok
  /** Groq 常返回 domain=UNKNOWN 且无 categoryIn；若丢弃启发式会全站混类检索 */
  const fromStructured =
    useStructured && attempt.categoryIn && attempt.categoryIn.length > 0
      ? attempt.categoryIn
      : undefined
  const categoryIn = fromStructured ?? inferredCategories
  const keywordOverride = useStructured ? attempt.keywords : undefined
  const priceMin = useStructured ? attempt.structured.price_min ?? null : null
  const budgetSrc = options?.budgetSourceText ?? queryText
  const structuredMax = useStructured ? attempt.structured.price_max ?? null : null
  const priceMax = mergePriceMaxFromHeuristic(budgetSrc, structuredMax)

  let requiredAnyOf: string[] | undefined
  if (useStructured && attempt.structured.domain === 'SECONDHAND') {
    const rawItems = [
      (attempt.structured as { item?: string }).item,
      (attempt.structured as { brand?: string }).brand,
      (attempt.structured as { model?: string }).model,
    ]
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean)
    /**
     * 叠字口语归一 + 品牌锁：
     *   · item="猫猫" → 补 "小猫 / 猫咪 / 宠物猫"（叠字同义，仍 OR）。
     *   · brand="三星" 或 item="三星手机"（LLM 把品牌融进 item）→ 扩成
     *     [三星, samsung, galaxy] 并**丢弃**大品类名词"手机/电脑"。
     *   · 传入 queryText 是关键：LLM 有时只回 item="手机" 把 brand 漏抽了，
     *     直接扫原句才能把"三星"这个用户明写的品牌重新抓回来。
     */
    requiredAnyOf = buildRequiredAnyOfWithBrandLock(rawItems, queryText)
  }

  /**
   * 二手兜底（防串味）：
   *   · SECONDHAND 场景下 Groq 常常只抽 domain 不抽 item（query 里是"闲置的 vr"这种）；
   *   · 若此时 requiredAnyOf 为空，后续弱轨 `闲置 转让 便宜 二手 同城 个人` 会把
   *     任何含"转让"字样的帖子（如"奶茶店 全套设备转让"）都拉进来——这就是"这有点过了"。
   *   · 这里用 SECONDHAND_ITEM_LEXICON 启发式扫 queryText，把命中的物品词
   *     作为 requiredAnyOf 下传所有轨（含弱轨），保证"vr"这类查询始终被收窄。
   * 触发条件：categoryIn 里存在 SECONDHAND，且上面的结构化分支没有产出 requiredAnyOf。
   */
  const isSecondhandScope =
    !!categoryIn && categoryIn.length > 0 && categoryIn.every((c) => c === 'SECONDHAND')
  if (isSecondhandScope && (!requiredAnyOf || requiredAnyOf.length === 0)) {
    const heuristicItems = extractSecondhandItemMatches(queryText)
    if (heuristicItems.length > 0) {
      /**
       * 与结构化分支一致：做叠字同义 + 品牌锁扩展（带 queryText 兜底扫品牌）。
       * 启发式常把"三星"和"手机"一起抽到；走 buildRequiredAnyOfWithBrandLock
       * 可保证识别到品牌后把"手机"这类大品类名词丢掉，避免 OR 串味。
       */
      requiredAnyOf = buildRequiredAnyOfWithBrandLock(heuristicItems, queryText).slice(0, 8)
    }
  }

  /**
   * RENT / RENT_SEEK 大意图收窄：把 RENT 大类拆成 住宅 / 车位 / 商铺 / 民宿 四套，
   * 用各自的 requiredAnyOf 确保"找房子"不再混入车位/店面，
   * 也确保"找车位"不再混入单间出租等住宅帖。
   * 触发条件：categoryIn 里存在 RENT 或 RENT_SEEK，且上面未填充 SECONDHAND 分支。
   */
  const isRentScope =
    !!categoryIn &&
    categoryIn.length > 0 &&
    categoryIn.every((c) => c === 'RENT' || c === 'RENT_SEEK')
  const structuredParking =
    useStructured &&
    attempt.structured.domain === 'RENT' &&
    !!(attempt.structured as { parking?: boolean | string | null; rent_mode?: string | null })
      .parking
  const structuredRentMode =
    useStructured && attempt.structured.domain === 'RENT'
      ? (attempt.structured as { rent_mode?: string | null }).rent_mode || ''
      : ''
  if (isRentScope && (!requiredAnyOf || requiredAnyOf.length === 0)) {
    /** 结构化解析强信号：LLM 明确判定 parking / rent_mode=车位 */
    if (structuredParking || structuredRentMode === '车位') {
      requiredAnyOf = ['车位', '停车', '停车位', '车库']
    } else {
      /** 启发式：按"住宅 / 车位 / 商铺 / 民宿"四路分流 */
      const intent = inferRentIntent(queryText)
      if (intent === 'parking') {
        requiredAnyOf = ['车位', '停车', '停车位', '车库']
      } else if (intent === 'commercial') {
        requiredAnyOf = [...RENT_COMMERCIAL_REQUIRED_ANY_OF]
      } else if (intent === 'short_term') {
        requiredAnyOf = [...RENT_SHORT_TERM_REQUIRED_ANY_OF]
      } else {
        /** residential：含"找房子 / 想租 / 要租 / 看房"等通用居住意图 */
        requiredAnyOf = [...RENT_RESIDENTIAL_REQUIRED_ANY_OF]
      }
    }
  }

  /**
   * 兜底：Groq 无法判断 domain、启发式也没把 categoryIn 锁到 RENT 时，
   * 句子里若明显是"找车位"/"出租车位"也要保证结果不是单间或公寓。
   */
  if (
    (!requiredAnyOf || requiredAnyOf.length === 0) &&
    /车位|停车位|车库|parking|泊车|找(?:个|一)?车位|求(?:个|一)?车位|出租车位|月租.*车位|停车(?!餐)/.test(
      queryText,
    )
  ) {
    requiredAnyOf = ['车位', '停车', '停车位', '车库']
  }

  return {
    categoryIn,
    keywordOverride,
    priceMin,
    priceMax,
    requiredAnyOf,
    useStructured,
  }
}
