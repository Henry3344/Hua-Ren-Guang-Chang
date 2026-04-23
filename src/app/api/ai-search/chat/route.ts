import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import type { Category } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import {
  checkAiChatRateLimit,
  releaseAiChatConcurrencySlot,
  tryAcquireAiChatConcurrencySlot,
} from '@/lib/rateLimit'
import { retrievePostsForAiQuery, type AiLocationPayload } from '@/lib/aiSearchRag'
import { mergeAiRagPostsWithSponsorSlot } from '@/lib/aiRagPostCard'
import { fetchSponsoredPostForAiSearch } from '@/lib/aiSearchSponsor'
import {
  detectWholeCarSaleIntent,
  inferCategoriesForAiQuery,
  resolveCategoryInForTrack,
} from '@/lib/aiSearchCategory'
import {
  parseAiStructuredQueryWithGroq,
  type AiStructuredParseAttempt,
} from '@/lib/aiStructuredParse'
import { buildRetrieveOptsFromParse } from '@/lib/aiRetrieveOpts'
import {
  mergeMultiTrackPostLists,
  mergeManyKeywordTokens,
  WEIGHT_ORIGINAL_QUERY,
  WEIGHT_REWRITE_VARIANTS,
  WEIGHT_WEAK_FALLBACK,
  PROGRESSIVE_MIN_ORIGINAL_HITS,
  WEAK_MERGE_MAX_POSTS,
  pickWeakFallbackQuery,
  type MergeScoreOpts,
} from '@/lib/aiDualTrackMerge'
import { getUnifiedMergeWeights } from '@/lib/aiMergeQueryWeights'
import { classifyMergeIntentWithGroq } from '@/lib/aiMergeIntentClassify'
import { embedQueryText, semanticPriceIntentFromEmbedding } from '@/lib/aiQueryEmbedding'
import { blendMergeWeightsWithLearned, getCurrentRankStateSnapshot } from '@/lib/aiRankLearned'
import { maybeScheduleRankRecomputeFromTraceCount } from '@/lib/aiRankRecompute'
import { prisma } from '@/lib/prisma'
import {
  buildRecommendationFactsBlock,
  buildRecommendationChipsUi,
} from '@/lib/aiRecommendationSignals'
import {
  buildTrackDebugRow,
  tryRelaxedRecallWhenEmpty,
  type TrackDebugRow,
} from '@/lib/aiSearchRelaxedRecall'
import { DEFAULT_GROQ_MODEL } from '@/lib/groqJson'
import { buildNoResultCtaList, noRagResultGuidance } from '@/lib/aiSearchGuidance'
import {
  buildRetrievalQueryFromThread,
  consolidateUserMessagesForRetrieval,
} from '@/lib/aiThreadContext'
import { rewriteAiRetrievalQueryCandidates } from '@/lib/aiQueryRewrite'
import { buildRagContextFromPosts, generateAnswerWithOptionalLlm } from '@/lib/aiAnswer'
import {
  classifyAiUserMessage,
  MSG_BLOCKED_EMOTIONAL,
  MSG_OFFTOPIC,
} from '@/lib/aiChatGuard'

type ChatMsg = { role: 'user' | 'assistant'; content: string }

const MAX_LEN = 4000
const MAX_MESSAGES = 40

function regionHintFromLocation(loc: AiLocationPayload | undefined): string {
  if (!loc || loc.locScope === 'nationwide' || !loc.locScope) {
    return '全站（未限定地区）'
  }
  if (loc.locScope === 'state' && loc.locState) {
    return `${loc.locState}`
  }
  if (loc.locScope === 'metro') {
    const parts = [loc.locState, loc.locCity, loc.locArea].filter(Boolean)
    return parts.length ? parts.join(' · ') : '当前所选地区'
  }
  return '当前所选地区'
}

const RATE_MSG = '操作频繁，过会儿再试。'
const CONCURRENCY_MSG = '当前使用人数较多，请稍后再试。'

type AiRetrievedPostRow = Awaited<ReturnType<typeof retrievePostsForAiQuery>>['posts'][number]

function pickPrimaryStructured(parses: AiStructuredParseAttempt[]) {
  const a = parses[0]
  if (a && a.ok) return a.structured
  const f = parses.find((x): x is Extract<AiStructuredParseAttempt, { ok: true }> => x.ok)
  return f?.structured
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录后再使用 AI 助手' }, { status: 401 })
  }

  const userId = (session.user as { id?: string } | undefined)?.id
  if (!userId) {
    return NextResponse.json({ error: '请先登录后再使用 AI 助手' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const raw = body.messages as ChatMsg[] | undefined
  const location = body.location as AiLocationPayload | undefined
  const filters = body.filters as { category?: Category; sub?: string } | undefined

  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: '缺少 messages' }, { status: 400 })
  }
  if (raw.length > MAX_MESSAGES) {
    return NextResponse.json({ error: '对话过长' }, { status: 400 })
  }
  const lastUser = [...raw].reverse().find((m) => m.role === 'user')
  const text = (lastUser?.content ?? '').trim()
  if (!text) {
    return NextResponse.json({ error: '请输入内容' }, { status: 400 })
  }
  if (text.length > MAX_LEN) {
    return NextResponse.json({ error: '单条过长' }, { status: 400 })
  }

  const t0 = Date.now()
  const guard = classifyAiUserMessage(text)
  if (guard === 'blocked') {
    return NextResponse.json({
      content: MSG_BLOCKED_EMOTIONAL,
      messageTone: 'system' as const,
      latencyMs: Date.now() - t0,
      keywordsUsed: [] as string[],
      ragPosts: [],
    })
  }
  if (guard === 'offtopic') {
    return NextResponse.json({
      content: MSG_OFFTOPIC,
      messageTone: 'system' as const,
      latencyMs: Date.now() - t0,
      keywordsUsed: [] as string[],
      ragPosts: [],
    })
  }

  if (!tryAcquireAiChatConcurrencySlot()) {
    return NextResponse.json({ error: CONCURRENCY_MSG }, { status: 503 })
  }
  if (!checkAiChatRateLimit(userId)) {
    releaseAiChatConcurrencySlot()
    return NextResponse.json({ error: RATE_MSG }, { status: 429 })
  }

  try {
    const consolidated = consolidateUserMessagesForRetrieval(raw)
    const retrievalQuery = buildRetrievalQueryFromThread(raw)
    const regionHint = regionHintFromLocation(location)
    const queryBlobForIntent = [retrievalQuery, consolidated, text].filter(Boolean).join('\n')

    /**
     * —— 早期短路：整车买卖意图 ——
     * 站内二手只收录"汽车配件/汽车用品"，没有整车版块。若用户问"二手车/买车/卖车/一辆车"，
     * 弱兜底会退化为"任何含『车』子串的帖子"（滑板车、推车、赛车、车载充电器都会被拉进来），
     * 对用户是误导。这里在 parse+retrieve 之前就返回一条明确指路的答复。
     */
    if (detectWholeCarSaleIntent(retrievalQuery) || detectWholeCarSaleIntent(text)) {
      releaseAiChatConcurrencySlot()
      const qParamWholeCar = encodeURIComponent(text.slice(0, 64))
      const ctaListWholeCar = [
        {
          href: `/posts?category=SECONDHAND&sub=${encodeURIComponent('汽车配件')}`,
          label: '去「汽车配件」列表浏览',
          kind: 'primary' as const,
        },
        { href: `/posts?category=SECONDHAND`, label: '找二手', kind: 'default' as const },
        { href: `/posts?category=RENT`, label: '找房源', kind: 'default' as const },
        { href: `/posts?category=JOB`, label: '找工作', kind: 'default' as const },
        ...(qParamWholeCar
          ? [
              {
                href: `/posts?q=${qParamWholeCar}`,
                label: '全站列表关键词搜索',
                kind: 'default' as const,
              },
            ]
          : []),
      ]
      return NextResponse.json({
        content:
          '本站暂时不做整车（汽车）交易。\n\n' +
          '二手板块目前只收录这类内容：\n' +
          '- 汽车配件\n' +
          '- 汽车用品\n' +
          '- 相关车载配件\n\n' +
          '如果你在找某个品牌或车型的配件，可以补一句型号再问一次，例如「特斯拉 Model 3 脚垫」「丰田凯美瑞 雨刷」；也可以直接点下方按钮进入对应分类浏览。',
        messageTone: 'system' as const,
        latencyMs: Date.now() - t0,
        keywordsUsed: [] as string[],
        ragPosts: [],
        cta: ctaListWholeCar[0],
        ctaList: ctaListWholeCar,
      })
    }

    /** 价位启发式：改写轨可能丢「100左右」，统一用主句+合并意图 */
    const budgetSourceText = [retrievalQuery, consolidated].filter(Boolean).join('\n')

    /** —— 渐进检索 ①：parse + Groq 意图 + 查询向量（并行）→ 启发式权重 → 与学习状态混合 —— */
    const [parseOrig, mergeIntentLlm, queryEmbedding] = await Promise.all([
      parseAiStructuredQueryWithGroq(retrievalQuery),
      classifyMergeIntentWithGroq(queryBlobForIntent),
      embedQueryText(retrievalQuery),
    ])
    const semanticPriceHint = await semanticPriceIntentFromEmbedding(queryEmbedding)
    const mergeWeightsHeuristic = getUnifiedMergeWeights(queryBlobForIntent, {
      llm: mergeIntentLlm,
      semanticPriceHint,
    })
    const mergeWeightsEffective = await blendMergeWeightsWithLearned({
      retrievalWeight: mergeWeightsHeuristic.retrievalWeight,
      businessWeight: mergeWeightsHeuristic.businessWeight,
      freshnessWeight: mergeWeightsHeuristic.freshnessWeight,
    })
    const rankStateSnapshot = await getCurrentRankStateSnapshot()
    const mergeScoreOpts: MergeScoreOpts = {
      retrievalWeight: mergeWeightsEffective.retrievalWeight,
      businessWeight: mergeWeightsEffective.businessWeight,
      freshnessWeight: mergeWeightsEffective.freshnessWeight,
    }
    /**
     * 类目识别 **只看当前这一轮**，绝不用 consolidated（最近 N 轮用户发言合并）做类目判定。
     *
     * 理由：上一轮「帮我找二手手机」、这一轮「帮我找一份工作」的切题场景里，consolidated
     * 里大量『二手』信号会把本轮锁死成 SECONDHAND，改写/弱兜底轨会把无关二手帖合并进来。
     * 业务上当前轮含义不清时，宁可不锁类目（让每条改写候选各自走 inferCategoriesForAiQuery），
     * 也不要让历史反向污染当前轮。
     *
     * 取值顺序：
     *   ① 当前轮启发式（`aiSearchCategory.ts` 里的规则，对中文口语句式最稳）
     *   ② 当前轮 LLM 结构化抽取的 categoryIn（LLM 看了当前句判出来的大类）
     *   ③ undefined（不锁 / 全类目）
     */
    const currentTurnStructuredCat =
      parseOrig.ok && parseOrig.categoryIn && parseOrig.categoryIn.length > 0
        ? parseOrig.categoryIn
        : undefined
    const currentTurnHeuristicCat = inferCategoriesForAiQuery(retrievalQuery)
    const primaryCategoryLock = currentTurnHeuristicCat ?? currentTurnStructuredCat
    /**
     * 原句轨检索 options：启发式兜底同样只用当前轮，不用 `inferCategoriesWithThreadContext`。
     * LLM 结构化 categoryIn 若存在仍优先采信（见 `buildRetrieveOptsFromParse` 里的 fromStructured ?? inferredCategories）。
     */
    const optsOrig = buildRetrieveOptsFromParse(
      parseOrig,
      retrievalQuery,
      currentTurnHeuristicCat,
      { budgetSourceText },
    )
    const rOrig = await retrievePostsForAiQuery(
      retrievalQuery,
      location,
      filters,
      userId,
      optsOrig.categoryIn,
      {
        priceMin: optsOrig.priceMin,
        priceMax: optsOrig.priceMax,
        keywordOverride: optsOrig.keywordOverride,
        requiredAnyOf: optsOrig.requiredAnyOf,
      },
    )

    const trackDebug: TrackDebugRow[] = [buildTrackDebugRow('original', retrievalQuery, rOrig)]

    let posts: AiRetrievedPostRow[]
    let keywordsUsed: string[]
    let primaryStructured = pickPrimaryStructured([parseOrig])
    let firstParseOk = parseOrig.ok ? parseOrig : undefined
    let anyStructuredOk = parseOrig.ok
    let parses: AiStructuredParseAttempt[] = [parseOrig]
    let searchQueryUsedForDisplay = retrievalQuery
    let variantList: string[] = []
    const progressiveShortCircuit = rOrig.posts.length >= PROGRESSIVE_MIN_ORIGINAL_HITS
    let weakFallbackUsed = false
    let multiTrackOverlap = 0

    type RewriteCand = Awaited<ReturnType<typeof rewriteAiRetrievalQueryCandidates>>
    let rewriteRw: RewriteCand | null = null

    if (progressiveShortCircuit) {
      const merged = mergeMultiTrackPostLists(
        [{ posts: rOrig.posts, weight: WEIGHT_ORIGINAL_QUERY, key: 'original' }],
        mergeScoreOpts,
      )
      posts = merged.posts
      keywordsUsed = rOrig.keywordsUsed
    } else {
      /** —— ②：原句命中不足 → 多候选改写 + 多轨（复用 rOrig，不重复检索原句轨） —— */
      rewriteRw = await rewriteAiRetrievalQueryCandidates({
        retrievalQuery,
        consolidated,
        regionHint,
      })
      if (!rewriteRw.ok) {
        posts = mergeMultiTrackPostLists(
          [{ posts: rOrig.posts, weight: WEIGHT_ORIGINAL_QUERY, key: 'original' }],
          mergeScoreOpts,
        ).posts
        keywordsUsed = rOrig.keywordsUsed
      } else {
        variantList = rewriteRw.variants
        searchQueryUsedForDisplay = `${retrievalQuery}  ‖  ${variantList.join('  ‖  ')}`

        if (variantList.length === 0) {
          posts = mergeMultiTrackPostLists(
            [{ posts: rOrig.posts, weight: WEIGHT_ORIGINAL_QUERY, key: 'original' }],
            mergeScoreOpts,
          ).posts
          keywordsUsed = rOrig.keywordsUsed
        } else {
          const parseVariants = await Promise.all(
            variantList.map((q) => parseAiStructuredQueryWithGroq(q)),
          )
          parses = [parseOrig, ...parseVariants]
          anyStructuredOk = parses.some((p) => p.ok)
          primaryStructured = pickPrimaryStructured(parses)
          firstParseOk = parses.find((p) => p.ok)

          const rVariants = await Promise.all(
            variantList.map((q, i) => {
              const inf = resolveCategoryInForTrack(primaryCategoryLock, q)
              const opts = buildRetrieveOptsFromParse(parseVariants[i]!, q, inf, {
                budgetSourceText,
              })
              return retrievePostsForAiQuery(q, location, filters, userId, opts.categoryIn, {
                priceMin: opts.priceMin,
                priceMax: opts.priceMax,
                keywordOverride: opts.keywordOverride,
                requiredAnyOf: opts.requiredAnyOf,
              })
            }),
          )

          variantList.forEach((q, i) => {
            trackDebug.push(buildTrackDebugRow(`rewrite_${i + 1}`, q, rVariants[i]!))
          })

          const baseTracks = [
            { posts: rOrig.posts, weight: WEIGHT_ORIGINAL_QUERY, key: 'original' },
            ...variantList.map((_, i) => ({
              posts: rVariants[i]!.posts,
              weight:
                WEIGHT_REWRITE_VARIANTS[Math.min(i, WEIGHT_REWRITE_VARIANTS.length - 1)] ??
                WEIGHT_REWRITE_VARIANTS[WEIGHT_REWRITE_VARIANTS.length - 1]!,
              key: `rewrite_${i + 1}`,
            })),
          ]

          const kwBatches = [rOrig.keywordsUsed, ...rVariants.map((r) => r.keywordsUsed)]

          let mergedList = mergeMultiTrackPostLists(baseTracks, mergeScoreOpts)
          multiTrackOverlap = Object.keys(mergedList.crossTrackHitCounts).length

          if (mergedList.posts.length <= WEAK_MERGE_MAX_POSTS) {
            const weakQ = pickWeakFallbackQuery(primaryCategoryLock?.[0])
            const parseWeak = await parseAiStructuredQueryWithGroq(weakQ)
            parses = [...parses, parseWeak]
            anyStructuredOk = parses.some((p) => p.ok)
            const infW = inferCategoriesForAiQuery(weakQ)
            const optsW = buildRetrieveOptsFromParse(parseWeak, weakQ, infW, {
              budgetSourceText,
            })
            const weakCategoryIn = primaryCategoryLock ?? optsW.categoryIn
            /**
             * 弱兜底若没有继承"原句"的 requiredAnyOf，会把整个大类（如所有二手帖）都拉进来，
             * 导致"帮我找二手手机"也会混入"二手行李箱"。这里优先沿用原句的物品约束。
             */
            const weakRequiredAnyOf =
              optsOrig.requiredAnyOf && optsOrig.requiredAnyOf.length > 0
                ? optsOrig.requiredAnyOf
                : optsW.requiredAnyOf
            const rWeak = await retrievePostsForAiQuery(weakQ, location, filters, userId, weakCategoryIn, {
              priceMin: optsW.priceMin,
              priceMax: optsW.priceMax,
              keywordOverride: optsW.keywordOverride,
              requiredAnyOf: weakRequiredAnyOf,
            })
            trackDebug.push(buildTrackDebugRow('weak_in_expand', weakQ, rWeak))
            mergedList = mergeMultiTrackPostLists(
              [
                ...baseTracks,
                { posts: rWeak.posts, weight: WEIGHT_WEAK_FALLBACK, key: 'weak_fallback' },
              ],
              mergeScoreOpts,
            )
            /** 弱轨仅扩召回；并入「手机」等泛词会污染答句里的「检索关键词」展示 */
            weakFallbackUsed = true
            multiTrackOverlap = Object.keys(mergedList.crossTrackHitCounts).length
            searchQueryUsedForDisplay += `  ‖  [弱约束] ${weakQ}`
          }

          posts = mergedList.posts
          keywordsUsed = mergeManyKeywordTokens(kwBatches)
        }
      }
    }

    let relaxationPrefix: string | undefined
    if (posts.length === 0) {
      const relaxed = await tryRelaxedRecallWhenEmpty({
        retrievalQuery,
        budgetSourceText,
        consolidatedUserTurns: consolidated,
        location,
        filters,
        userId,
        parseOrig,
      })
      if (relaxed) {
        const relaxedPosts = relaxed.posts as AiRetrievedPostRow[]
        keywordsUsed = relaxed.keywordsUsed
        trackDebug.push(...relaxed.extraTrackDebug)
        relaxationPrefix = relaxed.userNote
        const ranked = mergeMultiTrackPostLists(
          [{ posts: relaxedPosts, weight: WEIGHT_ORIGINAL_QUERY, key: 'relaxed_recall' }],
          mergeScoreOpts,
        )
        posts = ranked.posts
      }
    }

    const primaryCtaText = variantList[0] ?? retrievalQuery
    const expandedTrackCount =
      variantList.length > 0 ? 1 + variantList.length + (weakFallbackUsed ? 1 : 0) : 1

    const extraction = {
      retrievalQuery,
      searchQueryUsed: searchQueryUsedForDisplay,
      trackDebug,
      relaxedRecallPrefix: !!relaxationPrefix,
      queryRewrite: progressiveShortCircuit
        ? {
            ok: false as const,
            skipped: true as const,
            reason: `original_hits≥${PROGRESSIVE_MIN_ORIGINAL_HITS}`,
            threshold: PROGRESSIVE_MIN_ORIGINAL_HITS,
          }
        : rewriteRw && rewriteRw.ok
          ? {
              ok: true as const,
              from: retrievalQuery,
              variants: variantList,
              model: rewriteRw.groqModel,
              weakFallbackUsed,
            }
          : { ok: false as const, error: rewriteRw && !rewriteRw.ok ? rewriteRw.error : 'no_rewrite' },
      progressiveRetrieval: {
        mode: progressiveShortCircuit
          ? ('short_circuit' as const)
          : variantList.length > 0
            ? ('expanded' as const)
            : ('original_only' as const),
        minPostsThreshold: PROGRESSIVE_MIN_ORIGINAL_HITS,
        originalHitsFirstPass: rOrig.posts.length,
      },
      mergeTracks: {
        mode: variantList.length > 0 ? ('unified_score' as const) : ('single' as const),
        scoring: 'retrieval+crossTrack+price+fresh+rarity_local+business@0-1',
        trackCount: expandedTrackCount,
        multiTrackOverlapCount: multiTrackOverlap,
        priceIntent: mergeWeightsHeuristic.priceIntent,
        priceIntentRegex: mergeWeightsHeuristic.priceIntentRegex,
        priceIntentLlm: mergeWeightsHeuristic.priceIntentLlm,
        semanticPriceHint: mergeWeightsHeuristic.semanticPriceHint,
        qualityIntentLlm: mergeWeightsHeuristic.qualityIntentLlm,
        mergeIntentLlmOk: mergeIntentLlm != null,
        queryEmbedding: queryEmbedding ? { dim: queryEmbedding.length } : null,
        learnedWeights: mergeWeightsEffective,
        heuristicWeights: {
          retrievalWeight: mergeWeightsHeuristic.retrievalWeight,
          businessWeight: mergeWeightsHeuristic.businessWeight,
          freshnessWeight: mergeWeightsHeuristic.freshnessWeight,
        },
      },
      keywordPipeline: `progressive·${variantList.length > 0 ? `expand(${variantList.length}rw)` : 'hit'}·unified_merge·${anyStructuredOk ? 'groq→kw' : 'heuristic'}`,
      groq: firstParseOk
        ? { ok: true as const, model: firstParseOk.groqModel }
        : {
            ok: false as const,
            error:
              parses
                .filter((p): p is { ok: false; error: string } => !p.ok)
                .map((p) => p.error)
                .join(' · ') || 'parse_failed',
            model: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
          },
    }

    const ctaQuery =
      keywordsUsed.length > 0
        ? keywordsUsed.slice(0, 8).join(' ').slice(0, 200)
        : primaryCtaText.slice(0, 120) || text.slice(0, 120)
    const qParam = encodeURIComponent(ctaQuery)

    if (posts.length === 0) {
      let rankingTraceId: string | undefined
      try {
        const trace = await prisma.aiSearchTrace.create({
          data: {
            userId,
            retrievalQuery: retrievalQuery.slice(0, 8000),
            queryEmbedding: queryEmbedding?.length ? (queryEmbedding as unknown as object) : undefined,
            retrievalW: mergeWeightsEffective.retrievalWeight,
            businessW: mergeWeightsEffective.businessWeight,
            freshnessW: mergeWeightsEffective.freshnessWeight,
            resultCount: 0,
            weightVersion: rankStateSnapshot.weightVersion,
            priceIntentHeur: mergeWeightsHeuristic.priceIntentRegex,
            mergeIntentLlmOk: mergeIntentLlm != null,
            semanticPriceHint,
          },
        })
        rankingTraceId = trace.id
        maybeScheduleRankRecomputeFromTraceCount()
      } catch (e) {
        console.error('[ai-search] AiSearchTrace create (no-results)', e)
      }
      const ctaList = buildNoResultCtaList({
        primaryCategory: primaryCategoryLock?.[0],
        intentText: `${retrievalQuery} ${text}`,
        qParam,
      })
      return NextResponse.json({
        content: noRagResultGuidance(keywordsUsed, regionHint),
        latencyMs: Date.now() - t0,
        keywordsUsed,
        ragPosts: [],
        /** 保留兼容：旧客户端只认 cta 单项；新客户端优先用 ctaList 渲染分类导航 */
        cta: ctaList[0] ?? { href: `/posts?q=${qParam}`, label: '去分类列表搜索' },
        ctaList,
        rankingTraceId,
        structuredQuery: primaryStructured,
        extraction,
      })
    }

    const sponsorPost = await fetchSponsoredPostForAiSearch()
    /**
     * 品类兼容过滤：当前轮用户明显锁定了某大类（例如"车位出租" → RENT/RENT_SEEK），
     * 赞助位若跨大类（如 SECONDHAND 二手帖）插进来会让用户觉得答非所问——
     * 这类硬跨类的赞助一律不注入；未锁类目时保持原样（赞助位自由展示）。
     */
    const sponsorCompatible = (() => {
      if (!sponsorPost) return null
      if (!primaryCategoryLock || primaryCategoryLock.length === 0) return sponsorPost
      return primaryCategoryLock.includes(sponsorPost.category as Category)
        ? sponsorPost
        : null
    })()
    const sponsorMerge = mergeAiRagPostsWithSponsorSlot(posts, sponsorCompatible)
    const { ragCards: ragPosts, mergedPosts: postsForAnswer, sponsorId: sponsoredPostId } =
      sponsorMerge

    const recommendationChips = buildRecommendationChipsUi(posts)
    const factsBlock = buildRecommendationFactsBlock(posts)
    const ragContext = buildRagContextFromPosts(postsForAnswer, { sponsoredPostId })
    const rawContent = await generateAnswerWithOptionalLlm(
      text,
      ragContext,
      postsForAnswer,
      regionHint,
      keywordsUsed,
      consolidated,
      factsBlock,
      {
        sponsoredPostId,
        organicPosts: posts,
      },
    )
    const body =
      typeof rawContent === 'string' && rawContent.trim() !== '' ? rawContent : MSG_OFFTOPIC
    const content = (relaxationPrefix ?? '') + body

    let rankingTraceId: string | undefined
    try {
      const trace = await prisma.aiSearchTrace.create({
        data: {
          userId,
          retrievalQuery: retrievalQuery.slice(0, 8000),
          queryEmbedding: queryEmbedding?.length ? (queryEmbedding as unknown as object) : undefined,
          retrievalW: mergeWeightsEffective.retrievalWeight,
          businessW: mergeWeightsEffective.businessWeight,
          freshnessW: mergeWeightsEffective.freshnessWeight,
          resultCount: ragPosts.length,
          weightVersion: rankStateSnapshot.weightVersion,
          priceIntentHeur: mergeWeightsHeuristic.priceIntentRegex,
          mergeIntentLlmOk: mergeIntentLlm != null,
          semanticPriceHint,
        },
      })
      rankingTraceId = trace.id
      maybeScheduleRankRecomputeFromTraceCount()
    } catch (e) {
      console.error('[ai-search] AiSearchTrace create', e)
    }

    return NextResponse.json({
      content,
      latencyMs: Date.now() - t0,
      keywordsUsed,
      ragPosts,
      rankingTraceId,
      recommendationChips,
      cta: { href: `/posts?q=${qParam}`, label: '打开分类列表' },
      structuredQuery: primaryStructured,
      extraction,
    })
  } finally {
    releaseAiChatConcurrencySlot()
  }
}
