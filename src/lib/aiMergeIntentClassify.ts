import { groqChatJson } from '@/lib/groqJson'

export type MergeIntentLlmResult = {
  price_sensitive: boolean
  quality_sensitive: boolean
}

/**
 * 轻量意图分类（Groq JSON），用于合并打分权重；失败时由路由回退到正则。
 */
export async function classifyMergeIntentWithGroq(
  userBlob: string,
): Promise<MergeIntentLlmResult | null> {
  const trimmed = (userBlob ?? '').replace(/\s+/g, ' ').trim()
  if (trimmed.length < 2) return null

  const r = await groqChatJson<MergeIntentLlmResult>(
    [
      {
        role: 'system',
        content:
          '你是站内搜索意图分类器。只输出一个 JSON 对象，键为 price_sensitive、quality_sensitive，值均为布尔。不要解释。',
      },
      {
        role: 'user',
        content: `判断用户是否主要关心【价格/预算/性价比/别太贵/合适价位/省钱】（price_sensitive），以及是否主要关心【品质/品牌/保障/靠谱/精装】（quality_sensitive）。两者可同时为 true。

price_sensitive 典型：便宜、低价、预算、租金别太高、性价比高（偏省钱）、别太贵、合适一点（偏价位）、划得来、不要太贵。
quality_sensitive 典型：要靠谱、大品牌、精装修、保修、认证、不要次品、服务好。

用户文本：
---
${trimmed.slice(0, 1400)}
---

只输出 JSON，例如：{"price_sensitive":true,"quality_sensitive":false}`,
      },
    ],
    { maxTokens: 120 },
  )

  if (!r.ok) return null
  return {
    price_sensitive: r.json.price_sensitive === true,
    quality_sensitive: r.json.quality_sensitive === true,
  }
}
