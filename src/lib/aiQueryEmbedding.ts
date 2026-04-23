/**
 * 查询语义向量（OpenAI text-embedding），用于存档与轻量语义意图（与规则/Groq 互补）。
 */
const EMBED_MODEL = process.env.AI_QUERY_EMBEDDING_MODEL || 'text-embedding-3-small'

export async function embedQueryText(text: string): Promise<number[] | null> {
  const key = process.env.OPENAI_API_KEY
  const t = (text ?? '').replace(/\s+/g, ' ').trim()
  if (!key || t.length < 2) return null

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: EMBED_MODEL,
        input: t.slice(0, 8000),
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      data?: Array<{ embedding?: number[] }>
      error?: { message?: string }
    }
    if (!res.ok) {
      console.error('[aiQueryEmbedding]', data?.error?.message || res.status)
      return null
    }
    const emb = data?.data?.[0]?.embedding
    return Array.isArray(emb) && emb.length > 0 ? emb : null
  } catch (e) {
    console.error('[aiQueryEmbedding] fetch', e)
    return null
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!
    na += a[i]! * a[i]!
    nb += b[i]! * b[i]!
  }
  const d = Math.sqrt(na) * Math.sqrt(nb)
  return d > 0 ? dot / d : 0
}

let cachedAnchorEmbedding: number[] | null | undefined

/** 与「价格/预算敏感」锚点句子的相似度；用于补充关键词与 Groq 未覆盖的口语。 */
export async function semanticPriceIntentFromEmbedding(
  queryEmbedding: number[] | null,
): Promise<boolean> {
  if (!queryEmbedding) return false
  const threshold = Number(process.env.AI_SEMANTIC_PRICE_COSINE ?? '0.72')
  if (cachedAnchorEmbedding === undefined) {
    const anchor =
      process.env.AI_PRICE_INTENT_ANCHOR_TEXT ??
      '用户想找便宜实惠租金预算低性价比高别太贵合适价位的房子商品或服务'
    cachedAnchorEmbedding = await embedQueryText(anchor)
    if (!cachedAnchorEmbedding) cachedAnchorEmbedding = null
  }
  if (!cachedAnchorEmbedding) return false
  return cosineSimilarity(queryEmbedding, cachedAnchorEmbedding) >= threshold
}
