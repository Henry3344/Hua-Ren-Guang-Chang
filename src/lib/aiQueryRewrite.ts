import { DEFAULT_GROQ_MODEL, groqChatJson } from '@/lib/groqJson'

type MultiRewriteJson = { variants?: string[] | null }

const SYSTEM_MULTI = [
  '你是「华人广场」分类信息站的检索查询改写器。',
  '请基于用户原意输出 **2～3 条彼此不同角度** 的检索短句（用于站内 OR 关键词命中），提高召回。',
  '输出唯一 JSON：字段 variants（字符串数组，长度 2～3）；不要 Markdown。',
  '',
  '核心边界（与单条改写相同，违约即为严重错误）：',
  '- 禁止写入用户与合并意图里**从未出现**的地名、城市、区域、邮编；不得从「当前站点地区」臆造地点。',
  '- 禁止添加用户未给出的具体金额、面积、月份等数字约束（除非原文已有）。',
  '- 多条的**差异**应来自可检索说法：例如偏「价格实惠/性价比」、偏「拎包入住/家具」、偏「普通整租/合租床位」、偏「急租/长租」等（须与租房/招聘/二手等用户意图一致）。',
  '- 每条应是完整可搜的中文短句，可含大类词（租房、二手、招聘等）。',
  '- 若用户明确在找二手/闲置/数码/家电，variants 中不得加入租房、出租、房源、住宅、招聘等与该意图无关的大类词。',
  '- 不要编造房源细节；内容不得互相矛盾。',
].join('\n')

function normalizeQuery(s: string): string {
  return s.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * 多候选改写：一次请求返回 2～3 条不同角度的检索句，供多轨并行召回后合并。
 */
export async function rewriteAiRetrievalQueryCandidates(opts: {
  retrievalQuery: string
  consolidated: string
  regionHint: string
}): Promise<
  | { ok: true; variants: string[]; groqModel: string }
  | { ok: false; error: string }
> {
  const { retrievalQuery, consolidated, regionHint } = opts
  const rq = retrievalQuery.replace(/\s+/g, ' ').trim()
  if (!rq) return { ok: false, error: 'empty' }

  const cons = consolidated.replace(/\s+/g, ' ').trim()
  const userBlock = [
    '用户本轮用于检索的句子（主句）：',
    rq,
    '',
    cons && cons !== rq ? `多轮合并补充上下文：\n${cons}\n` : '',
    `当前站点地区（仅供理解；不得写入 variants）：${regionHint}`,
    '',
    '请输出 JSON：{"variants":["…","…","…"]}（2～3 条）',
  ]
    .filter(Boolean)
    .join('\n')

  const r = await groqChatJson<MultiRewriteJson>(
    [{ role: 'system', content: SYSTEM_MULTI }, { role: 'user', content: userBlock }],
    { maxTokens: 520 },
  )
  if (!r.ok) return { ok: false, error: r.error }

  const raw = Array.isArray(r.json?.variants) ? r.json!.variants! : []
  const seen = new Set<string>([normalizeQuery(rq)])
  const out: string[] = []
  for (const v of raw) {
    const t = String(v ?? '')
      .replace(/\s+/g, ' ')
      .trim()
    if (!t || t.length > 2000) continue
    const n = normalizeQuery(t)
    if (seen.has(n)) continue
    seen.add(n)
    out.push(t)
    if (out.length >= 3) break
  }

  if (out.length === 0) return { ok: false, error: 'empty_variants' }

  return {
    ok: true,
    variants: out,
    groqModel: process.env.GROQ_MODEL || DEFAULT_GROQ_MODEL,
  }
}
