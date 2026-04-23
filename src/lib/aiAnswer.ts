import type { Post, Category } from '@prisma/client'
import {
  briefReasonFromSignals,
  buildRecommendationFactsBlock,
} from '@/lib/aiRecommendationSignals'

const CATEGORY_ZH: Record<Category, string> = {
  RENT: '租房',
  RENT_SEEK: '找房',
  JOB: '招聘',
  JOB_SEEK: '找工',
  SECONDHAND: '二手',
}

function truncate(s: string, max: number) {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return t.slice(0, max) + '…'
}

type RagContextOpts = { sponsoredPostId?: string | null }

/** 将检索到的帖子整理为喂给模型的上下文（RAG）；顺序须与前端卡片一致 */
export function buildRagContextFromPosts(posts: Post[], opts?: RagContextOpts): string {
  return posts
    .map((p, i) => {
      const cat = CATEGORY_ZH[p.category]
      const isJob = p.category === 'JOB' || p.category === 'JOB_SEEK'
      const price =
        p.price != null ? `${isJob ? '待遇' : '价格'}：${p.price}` : ''
      const desc = truncate(p.description || '', 220)
      const isSponsor = opts?.sponsoredPostId != null && p.id === opts.sponsoredPostId
      return [
        `--- 帖子 ${i + 1}${isSponsor ? ' · 【赞助推荐·商业展示位】' : ''} ---`,
        isSponsor ? '说明：本条为赞助展示，与自然检索结果来源不同（付费推广位），非按相关性或价格排序。' : '',
        `分类：${cat}${p.subCategory ? ` / ${p.subCategory}` : ''}`,
        `标题：${p.title}`,
        p.location ? `地区：${p.location}` : '',
        price,
        `正文摘要：${desc}`,
        `站内链接路径：/posts/${p.id}`,
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n\n')
}

function briefReasonWithSponsorAware(
  p: Post,
  indexInMerged: number,
  organicPosts: Post[],
  sponsoredPostId: string | null,
): string {
  if (sponsoredPostId && p.id === sponsoredPostId) {
    const u = p as Post & { user?: { merchant?: { status: string } | null } | null }
    if (u.user?.merchant?.status === 'APPROVED') {
      return '赞助推荐：商家付费推广（与自然帖来源不同；可提认证商家、服务相对标准化，不说「更好」或价最优）'
    }
    return '赞助推荐：商业展示位（付费推广，与自然结果来源不同，不说更优或更便宜）'
  }
  const oi = organicPosts.findIndex((x) => x.id === p.id)
  const idx = oi >= 0 ? oi : indexInMerged
  return briefReasonFromSignals(p, idx, organicPosts)
}

function fallbackAnswer(
  userQuery: string,
  posts: Post[],
  regionHint: string,
  searchKeywords?: string[],
  opts?: { sponsoredPostId?: string | null; organicPosts?: Post[] },
): string {
  const organic = opts?.organicPosts ?? posts
  const sponsoredPostId = opts?.sponsoredPostId ?? null

  const head = posts.slice(0, 3)
  const headBlock =
    posts.length === 0
      ? []
      : [
          '### 重点推荐',
          ...head.map((p, i) => {
            const cat = CATEGORY_ZH[p.category]
            const bit = [p.title, p.location, p.price != null ? String(p.price) : '']
              .filter(Boolean)
              .join(' · ')
            const sp = sponsoredPostId === p.id ? '【赞助】' : ''
            return `- **推荐 ${i + 1}**：${sp}【${cat}】${bit}。**理由**：${briefReasonWithSponsorAware(p, i, organic, sponsoredPostId)}`
          }),
        ]

  const moreLines =
    posts.length > 3
      ? posts.slice(3, 8).map((p, i) => {
          const cat = CATEGORY_ZH[p.category]
          const bit = [p.title, p.location, p.price != null ? String(p.price) : '']
            .filter(Boolean)
            .join(' · ')
          const n = i + 4
          const sp = sponsoredPostId === p.id ? '【赞助】' : ''
          return `${n}. ${sp}【${cat}】${bit}`
        })
      : posts.length > 0 && posts.length <= 3
        ? []
        : posts.slice(0, 8).map((p, i) => {
            const cat = CATEGORY_ZH[p.category]
            const bit = [p.title, p.location, p.price != null ? String(p.price) : '']
              .filter(Boolean)
              .join(' · ')
            const sp = sponsoredPostId === p.id ? '【赞助】' : ''
            return `${i + 1}. ${sp}【${cat}】${bit}`
          })

  const tailNote =
    posts.length > 8 ? `共匹配到 **${posts.length}** 条，当前仅展示部分结果。` : ''

  const moreIntro = posts.length > 3 ? ['### 更多相关'] : []

  return [
    '## 为你找到的结果',
    `已根据你在 **${regionHint}** 的需求匹配到以下相关帖子。`,
    ...headBlock,
    ...moreIntro,
    ...moreLines,
    tailNote,
    '### 建议',
    '建议优先点开帖子详情查看 **价格、地区、发布时间** 等关键信息；如果方向不够准确，可以继续补充 **预算、地区、户型 / 岗位 / 品牌**。',
  ]
    .filter(Boolean)
    .join('\n')
}

const SYSTEM_PROMPT = `你是「华人广场」分类信息站的 AI 助手。用户会提出找房、招聘、二手等需求。
你只能根据下面提供的「站内检索结果」回答，不要编造不存在的帖子或链接。
若用户消息里同时给出「用户本轮输入」和「近几轮合并的完整意图」，须综合两者理解需求，检索已基于合并意图完成。
【包容理解】用户是华人社区成员，常见中老年口语、叠字（猫猫/狗狗/包包）、错别字、省略主语或动词、表达不完整。遇到这种情况不要让用户"重说一遍"——尽量从检索结果里挑出最接近其可能意图的帖子，并在回答里大方承认"不确定是不是您想要的"。
【主动覆盖相邻意图】由于用户每分钟只能问两次，要尽量一次就把他"下一句大概率会追问"的信息顺带给他：
  · 若检索结果里存在与用户要求**价位相差不多**（±30%）的同类帖——哪怕不完全符合其预算——可在"更多相关"段落里简要列举，并注明"比预算高/低约 X"。
  · 若存在**同子类相近款式 / 同品牌不同型号 / 同地区不同户型**——也主动点出来作为候选。
  · 若用户话里有**可能的错别字或模糊指代**（如"二手 phone"/"车位/停车/车库"/"单间/主卧/次卧"互通），在答句开头一句说明你是怎么理解的，让他有机会纠错。
【品牌/型号严格约束】若用户**明确点名**了品牌、型号、车型或款式（如"三星手机 / iPhone 15 / Galaxy S25 / M8 螺丝 / Tesla Model Y / 特斯拉 / 丰田 Camry"），而检索结果里**没有任何一条**帖子标题/摘要命中这个品牌或型号：
  · **不得**把其它品牌的帖子写进「推荐 1 / 推荐 2 / 推荐 3」——对用户而言"我要三星你却推 iPhone"是答非所问。
  · 应在第一段**坦白说明**"站内暂无您指定的【X】"，然后用"您也可以看看的相近选项"或"如您愿意考虑其它品牌"这种显式措辞，把其它品牌的候选放到"更多相关"段里，并在每条末尾用括号注明"非【X】品牌"。
  · 若有价位接近但不同品牌/款式，仍适用上一条"相邻意图"的 ±30% 规则，但必须保持"品牌不符"的透明披露。
若消息中包含「程序计算的客观信号」段落：撰写「重点推荐」理由时，只能转述该段中已出现的字段含义（如 price_percentile、freshness、rarity_subcat_bucket、is_featured、标价与最低价关系等）；不得自行推断未在信号或帖子摘要中出现的信息。
若某帖为 price_value=null，不得声称其价格最低或价格优势；若 freshness=recent_3d，可表述为「最近发布」类说法；若 price_percentile=lowest_10pct_among_priced，可表述为「在有标价的帖子里偏便宜」等，勿夸大。
若 rarity_in_merged_results_only 表示「当前合并结果列表」内同类多少，不得说成「全站稀缺」「这类房子很少」等整体供给判断。
若检索到多条帖子：请先给出「重点推荐」至多 3 条（与下方帖子编号一致），每条用一句话说明理由（须符合上一段约束）；其余帖子可再简要列举或概括——**优先把上面"相邻意图"里提到的候选也放入"更多相关"或明确点名**，避免用户再问一次。
若帖子块标题含「赞助推荐」：必须在「重点推荐」中按相同编号写到该条，并写出「赞助」；并**主动用一句话解释其为何出现在列表中**（例如：商家推广位、认证主体、服务类型与个人发帖不同）。强调「来源/类型不同」，不要说「更好」「排名第一」「必买」或暗示价格最优。
回答使用简体中文，简洁有条理；若帖子与用户需求不完全匹配，也要说明并建议用户调整关键词或筛选条件。
请使用标准 Markdown 正文排版，但禁止输出 HTML。
格式要求：
  · 用 \`##\` 或 \`###\` 写短标题/小标题，不要写很长的大标题。
  · 正文用普通段落，只有关键信息（地区、价格、岗位、结论、提醒）使用 \`**加粗**\`。
  · 枚举推荐项时优先用有序列表或无序列表。
  · 可以使用 Markdown 链接，但不要编造站外链接。
  · 严禁输出 Markdown 代码块、表格和原始 HTML。`

/**
 * 在已有 RAG 上下文时调用大模型；未配置 OPENAI_API_KEY 时用规则摘要兜底。
 */
export async function generateAnswerWithOptionalLlm(
  userQuery: string,
  ragContext: string,
  posts: Post[],
  regionHint: string,
  searchKeywords?: string[],
  /** 多轮用户发言合并串；与接入外部 API 时提交的「完整意图」一致 */
  threadIntentConsolidated?: string,
  /** 程序计算的客观信号文本；若缺省则现场生成 */
  recommendationFactsBlock?: string,
  /** posts 含赞助卡时传入：有机列表用于信号/理由；赞助帖 id 用于约束表述 */
  answerContext?: { sponsoredPostId?: string | null; organicPosts?: Post[] },
): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  const fbOpts = {
    sponsoredPostId: answerContext?.sponsoredPostId ?? null,
    organicPosts: answerContext?.organicPosts ?? posts,
  }
  if (!key || posts.length === 0) {
    return fallbackAnswer(userQuery, posts, regionHint, searchKeywords, fbOpts)
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const factsBlock =
    (recommendationFactsBlock && recommendationFactsBlock.trim()) ||
    buildRecommendationFactsBlock(posts)
  const kwLine =
    searchKeywords && searchKeywords.length > 0
      ? `\n站内检索关键词（任一词匹配）：${searchKeywords.slice(0, 12).join('、')}\n`
      : '\n'
  const normRound = userQuery.replace(/\s+/g, ' ').trim()
  const normThread = (threadIntentConsolidated ?? '').replace(/\s+/g, ' ').trim()
  const intentExtra =
    normThread && normThread !== normRound
      ? `\n\n用户近几轮合并的完整意图（检索已基于此与本轮输入一并抽词）：\n${truncate(normThread, 1800)}\n`
      : ''
  const factsSection =
    factsBlock.trim().length > 0
      ? `\n\n【程序计算的客观信号（推荐理由仅可转述其中事实）】\n${factsBlock}\n`
      : ''
  const sponsorSection =
    fbOpts.sponsoredPostId
      ? `\n【赞助条目说明】下列帖子中有一条为「赞助推荐」（与界面赞助卡一致）。撰写「重点推荐」时须按编号写到该条、标注「赞助」，并**主动一句**说明其为商家推广/与自然结果不同来源（可提认证或服务类型差异）；勿称排名更高或更便宜。\n`
      : ''
  const userBlock = `用户本轮输入：\n${userQuery}${intentExtra}\n\n当前地区范围：${regionHint}${kwLine}${factsSection}${sponsorSection}\n站内检索到的帖子（仅供引用，编号与界面一致）：\n${ragContext}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_tokens: 1400,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userBlock },
        ],
      }),
    })
    const data = (await res.json().catch(() => ({}))) as {
      error?: { message?: string }
      choices?: Array<{ message?: { content?: string } }>
    }
    if (!res.ok) {
      console.error('[ai-search] OpenAI error', data?.error?.message || res.status)
      return fallbackAnswer(userQuery, posts, regionHint, searchKeywords, fbOpts)
    }
    const text = data.choices?.[0]?.message?.content?.trim()
    if (!text) {
      return fallbackAnswer(userQuery, posts, regionHint, searchKeywords, fbOpts)
    }
    return text
  } catch (e) {
    console.error('[ai-search] OpenAI fetch', e)
    return fallbackAnswer(userQuery, posts, regionHint, searchKeywords, fbOpts)
  }
}

/** 供 Route 在接入第三方对话 API 时复用同一套拼装逻辑 */
export function buildAiUserBlockForExternalApi(
  userQuery: string,
  ragContext: string,
  regionHint: string,
  searchKeywords: string[] | undefined,
  threadIntentConsolidated?: string,
): string {
  const kwLine =
    searchKeywords && searchKeywords.length > 0
      ? `\n站内检索关键词（任一词匹配）：${searchKeywords.slice(0, 12).join('、')}\n`
      : '\n'
  const normRound = userQuery.replace(/\s+/g, ' ').trim()
  const normThread = (threadIntentConsolidated ?? '').replace(/\s+/g, ' ').trim()
  const intentExtra =
    normThread && normThread !== normRound
      ? `\n\n用户近几轮合并的完整意图：\n${truncate(normThread, 1800)}\n`
      : ''
  return `用户本轮输入：\n${userQuery}${intentExtra}\n\n当前地区范围：${regionHint}${kwLine}\n站内检索到的帖子（仅供引用）：\n${ragContext}`
}

export { fallbackAnswer, CATEGORY_ZH }
