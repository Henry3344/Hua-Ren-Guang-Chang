/**
 * 从 AI 助手的自然语言问题中提取可用于站内 ILIKE 检索的关键词。
 * 避免整句作为单一 pattern 导致几乎匹配不到帖子。
 */

/** 常见口语/虚词/无检索价值片段；strip 时按长度从长到短匹配 */
const PHRASE_STOPS = [
  '我想买个',
  '我想买',
  '我要买个',
  '我要买',
  '我准备买',
  '能不能买',
  '可不可以买',
  '多少钱',
  '怎么样',
  '之类的',
  '左右的',
  '以内的',
  '以上的',
  '以下的',
  '附近的',
  '同城的',
  '有没有',
  '能不能',
  '可不可以',
  '请问',
  '想要',
  '希望',
  '大概',
  '可能',
  '谢谢',
  '帮忙',
  '推荐',
  '搜索',
  '查找',
  '帮我',
  '一些',
  '左右',
  '最好',
  '这个',
  '那个',
  '什么',
  '怎么',
  '如何',
  '多少',
  '我想',
  '我要',
  '我买',
]

/** 句首意图语（去掉后再抽品类词） */
const LEADING_INTENT_PREFIXES = [
  '我想买个',
  '我想买',
  '我想',
  '我要买个',
  '我要买',
  '我要',
  '我准备买',
  '我买',
  '能不能买',
  '可不可以买',
  '想买',
  '求购',
  '收购',
  '收一台',
  '收个',
]

/** 去掉「买个」类后仍可能出现在句首 */
const SECONDARY_LEADING = ['买个', '买一个', '买一台', '买一部', '买']

/** 单字虚词 */
const SINGLE_STOPS =
  /[的了和在是要有请哪么吧呢啊呀嘛很就也都还最能想问要是与或之其把被给让从对以于而及]/g

const MAX_KEYWORDS = 18
const MIN_CJK_LEN = 2
const MIN_LATIN_LEN = 2

/**
 * 中文"叠字"口语 → 站内帖常见书面形态的同义扩展。
 * 中老年华人口语常说「猫猫 / 狗狗 / 兔兔」；但发帖常写「小猫 / 蓝猫 / 猫咪 / 宠物猫」。
 * 若不扩展，ILIKE 子串搜索就会漏掉这些帖子（"猫猫"并非任何帖子的连续子串）。
 *
 * 触发规则：用户原句里出现 KEY，则把 VALUES 追加到检索词表。
 * 只加"带 2 字以上"的词（符合 MIN_CJK_LEN），避免单字匹配过宽。
 */
export const REDUPLICATION_SYNONYMS: Record<string, string[]> = {
  猫猫: ['猫咪', '小猫', '宠物猫'],
  狗狗: ['小狗', '宠物狗'],
  兔兔: ['兔子'],
  鱼鱼: ['金鱼'],
  鸟鸟: ['小鸟'],
  车车: ['汽车'],
  包包: ['手提包', '背包'],
  娃娃: ['玩偶', '洋娃娃'],
  喵喵: ['小猫', '猫咪'],
  汪汪: ['小狗'],
}

/** 把叠字口语归一到"帖子常用书面词"：返回一组 OR 匹配用的同义词（含原词） */
export function expandReduplicationSynonyms(term: string): string[] {
  const t = (term || '').trim()
  if (!t) return []
  const out = new Set<string>([t])
  if (REDUPLICATION_SYNONYMS[t]) {
    for (const s of REDUPLICATION_SYNONYMS[t]) out.add(s)
  }
  return [...out]
}

/**
 * 品牌 / 产品线 → 同义词簇。用于"品牌锁"：若用户点名了品牌或产品线，
 * 就只靠这一簇在帖子标题/描述里做 OR 过滤，丢掉 "手机/电脑/家电" 等大品类名词。
 *
 * 关键设计原则（防"跨产品线串味"）：
 *   1. **产品线键**（如 iphone / macbook / ipad / galaxy / switch）——簇内**只放严格专属的词**。
 *      反例：不能在 macbook 簇里放 "苹果"，因为 iPhone 帖子描述里也会写 "苹果官网"；
 *      加进去会把 iPhone 误判成 MacBook 的匹配项。
 *   2. **品牌伞键**（如 苹果 / apple / 三星 / 索尼 / 戴森）——簇内可以放**所有子产品线**，
 *      因为用户明说"苹果"时的确是要所有 Apple 产品都可以看。
 *   3. 只有当**品牌名 + 产品线 token 都很少跨品牌重合**时才允许互为同义（如三星用 galaxy、
 *      任天堂用 switch 这种专属关系）。
 *
 * 每簇词都以"**帖子里真的会出现**"的写法为准：中文全称 + 英文品牌/产品线。
 */
export const BRAND_SYNONYMS: Record<string, string[]> = {
  // ===== 苹果生态：品牌伞 vs 产品线严格分离 =====
  苹果: ['苹果', 'apple', 'iphone', 'ipad', 'macbook', 'imac', 'airpods'],
  apple: ['苹果', 'apple', 'iphone', 'ipad', 'macbook', 'imac', 'airpods'],
  /**
   * 产品线簇刻意**不含 "苹果/apple"**——iPhone/MacBook/iPad 的帖子描述里都会写
   * "苹果官网/苹果原装"，把品牌伞词纳进产品线簇会让 iphone 查询拉进 macbook 帖、反之亦然。
   * 产品线词（iphone/macbook/ipad/imac/airpods）在站内极少出现在非自己产品线的帖子里，
   * 单词独立已经足够收敛。
   */
  iphone: ['iphone'],
  ipad: ['ipad'],
  macbook: ['macbook'],
  imac: ['imac'],
  airpods: ['airpods'],

  // ===== 三星：品牌名和 galaxy 产品线几乎不跨品牌出现，可互为同义 =====
  三星: ['三星', 'samsung', 'galaxy'],
  samsung: ['三星', 'samsung', 'galaxy'],
  galaxy: ['三星', 'samsung', 'galaxy'],

  // ===== 华为 / 荣耀 =====
  华为: ['华为', 'huawei', 'mate'],
  huawei: ['华为', 'huawei', 'mate'],
  荣耀: ['荣耀', 'honor'],
  honor: ['荣耀', 'honor'],

  // ===== 小米生态：品牌伞 vs 子品牌分离 =====
  小米: ['小米', 'xiaomi', 'redmi', '红米'],
  xiaomi: ['小米', 'xiaomi', 'redmi', '红米'],
  /** redmi 是小米子品牌但定位独立，查 redmi 时不反向带出小米全系 */
  redmi: ['redmi', '红米'],
  红米: ['redmi', '红米'],

  // ===== Google：品牌名带 pixel，但 pixel 只专一 =====
  谷歌: ['谷歌', 'google', 'pixel'],
  google: ['谷歌', 'google', 'pixel'],
  pixel: ['pixel'],

  // ===== 其它手机品牌（多为专属名，不做跨链接） =====
  oppo: ['oppo'],
  vivo: ['vivo'],
  iqoo: ['iqoo'],
  一加: ['一加', 'oneplus'],
  oneplus: ['一加', 'oneplus'],

  // ===== 游戏主机：品牌伞带产品线；单独查产品线时不反向 =====
  任天堂: ['任天堂', 'nintendo', 'switch'],
  nintendo: ['任天堂', 'nintendo', 'switch'],
  switch: ['switch'],
  索尼: ['索尼', 'sony', 'playstation', 'ps5', 'ps4', 'ps3'],
  sony: ['索尼', 'sony', 'playstation'],
  playstation: ['playstation', 'ps5', 'ps4', 'ps3'],
  微软: ['微软', 'microsoft', 'xbox', 'surface'],
  microsoft: ['微软', 'microsoft', 'xbox', 'surface'],
  /** xbox / surface 帖子描述里也常写 "微软" → 产品线簇不纳入品牌伞词，防串味 */
  xbox: ['xbox'],
  surface: ['surface'],

  // ===== VR：Quest 产品线由 Meta/Oculus 代表，互为同义相对安全 =====
  quest: ['quest', 'oculus', 'meta'],
  oculus: ['quest', 'oculus', 'meta'],

  // ===== 汽车 =====
  特斯拉: ['特斯拉', 'tesla'],
  tesla: ['特斯拉', 'tesla', 'model'],
  丰田: ['丰田', 'toyota'],
  toyota: ['丰田', 'toyota'],
  本田: ['本田', 'honda'],
  honda: ['本田', 'honda'],
  日产: ['日产', 'nissan'],
  nissan: ['日产', 'nissan'],
  宝马: ['宝马', 'bmw'],
  bmw: ['宝马', 'bmw'],
  奔驰: ['奔驰', 'benz', 'mercedes'],
  benz: ['奔驰', 'benz', 'mercedes'],
  mercedes: ['奔驰', 'benz', 'mercedes'],
  奥迪: ['奥迪', 'audi'],
  audi: ['奥迪', 'audi'],
  福特: ['福特', 'ford'],
  ford: ['福特', 'ford'],
  lexus: ['雷克萨斯', 'lexus'],
  雷克萨斯: ['雷克萨斯', 'lexus'],

  // ===== 家电（品牌名多为专属词，不跨产品线） =====
  戴森: ['戴森', 'dyson'],
  dyson: ['戴森', 'dyson'],
  美的: ['美的', 'midea'],
  格力: ['格力', 'gree'],
  海尔: ['海尔', 'haier'],
  飞利浦: ['飞利浦', 'philips'],
  博世: ['博世', 'bosch'],
  西门子: ['西门子', 'siemens'],
  松下: ['松下', 'panasonic'],
}

/** 只在"用户点了品牌"的前提下才应丢弃的"大品类名词"——避免品牌+品类联合 OR 串味 */
const GENERIC_ITEM_NOUNS = new Set([
  '手机',
  '平板',
  '电脑',
  '笔记本',
  '电视',
  '耳机',
  '相机',
  '游戏机',
  '游戏',
  '家具',
  '家电',
  '冰箱',
  '洗衣机',
  '烘干机',
  '洗碗机',
  '微波炉',
  '烤箱',
  '空调',
  '吸尘器',
  '扫地机',
  '咖啡机',
  '净化器',
  '加湿器',
  '汽车',
  '车',
  'phone',
  'laptop',
  'tablet',
  'tv',
])

/**
 * 在任意文本里扫描"品牌命中"。用于以下两类场景：
 *   · LLM 把 brand 并进 item（回传 item="三星手机"）→ 严格 key 匹配会漏。
 *   · LLM 完全漏抽品牌，但用户原句明明写了 "三星" / "iphone"。
 *
 * 匹配规则：
 *   · CJK 品牌键（如 "三星"）做**子串匹配**——中文词内嵌入也安全。
 *   · ASCII 品牌键（如 "audi"）做**单词边界**匹配——避免 "audi" 误触 "audiobook"。
 */
export function detectBrandsInText(text: string): string[] {
  const t = (text || '').trim()
  if (!t) return []
  const lower = t.toLowerCase()
  const matched = new Set<string>()
  for (const [key, cluster] of Object.entries(BRAND_SYNONYMS)) {
    const isAscii = /^[a-z]+$/.test(key)
    if (isAscii) {
      const re = new RegExp(`\\b${key}\\b`, 'i')
      if (re.test(lower)) {
        for (const s of cluster) matched.add(s)
      }
    } else {
      if (t.includes(key)) {
        for (const s of cluster) matched.add(s)
      }
    }
  }
  return [...matched]
}

/**
 * 判断一组 requiredAnyOf token 里是否含品牌线——用来决定弱轨兜底能不能"拿掉品牌约束"：
 * 若是品牌搜索，必须把品牌限制透传到兜底，避免"搜三星手机却回 iPhone"。
 */
export function requiredAnyOfHasBrandLock(tokens: readonly string[] | undefined): boolean {
  if (!tokens || tokens.length === 0) return false
  for (const t of tokens) {
    const k = (t || '').trim().toLowerCase()
    if (k && BRAND_SYNONYMS[k]) return true
    /** 品牌簇 value 里的 token（如 'samsung'/'galaxy'/'iphone'）也算命中品牌锁。 */
    for (const cluster of Object.values(BRAND_SYNONYMS)) {
      if (cluster.includes(t) || cluster.includes(k)) return true
    }
  }
  return false
}

/**
 * 基于"raw items + 原始 queryText"构造最终的 requiredAnyOf：
 *   1) 先用叠字同义 + 品牌同义把每个 item 扩展；
 *   2) **并行扫 queryText 做品牌识别**——覆盖 LLM 把 brand 并进 item
 *      （item="三星手机"）或漏抽 brand 的场景；
 *   3) 若任何一路检测到品牌，则把 GENERIC_ITEM_NOUNS 从结果中剔除——
 *      让"三星 手机"只命中真的有三星字样的帖，而不是任何含"手机"的帖。
 *
 * 注：品牌簇里包含其主力产品线前缀（如 apple 簇含 iphone），
 *     因此"苹果 手机"仍能命中 iPhone 帖（blob 含 "iphone"）。
 */
export function buildRequiredAnyOfWithBrandLock(
  rawItems: readonly string[],
  queryText?: string,
): string[] {
  const expanded = new Set<string>()
  let hasBrand = false
  for (const raw of rawItems) {
    const t = (raw || '').trim()
    if (!t) continue
    const lower = t.toLowerCase()
    const cluster = BRAND_SYNONYMS[lower] || BRAND_SYNONYMS[t]
    if (cluster) {
      hasBrand = true
      for (const s of cluster) expanded.add(s)
    }
    for (const s of expandReduplicationSynonyms(t)) expanded.add(s)
  }
  /** 兜底扫 queryText：LLM 常把品牌融进 item 字段（"三星手机"），或完全漏抽品牌。 */
  if (queryText) {
    const brandTokens = detectBrandsInText(queryText)
    if (brandTokens.length > 0) {
      hasBrand = true
      for (const s of brandTokens) expanded.add(s)
    }
  }
  let out = [...expanded]
  if (hasBrand) {
    out = out.filter((w) => !GENERIC_ITEM_NOUNS.has(w.toLowerCase()))
  }
  return out
}

function stripLeadingIntent(s: string): string {
  let t = s.trim()
  const p1 = [...LEADING_INTENT_PREFIXES].sort((a, b) => b.length - a.length)
  for (const p of p1) {
    if (t.startsWith(p)) {
      t = t.slice(p.length).trim()
      break
    }
  }
  const p2 = [...SECONDARY_LEADING].sort((a, b) => b.length - a.length)
  for (const p of p2) {
    if (t.startsWith(p)) {
      t = t.slice(p.length).trim()
      break
    }
  }
  return t
}

function stripPhraseStops(s: string): string {
  const phrases = [...PHRASE_STOPS].sort((a, b) => b.length - a.length)
  let t = s
  for (const ph of phrases) {
    if (ph.length >= 2) {
      t = t.split(ph).join(' ')
    }
  }
  return t
}

/**
 * 将连续中文段拆成可检索词：保留整段，并对 4 字及以上补充 2 字片（如 二手手机 → 二手、手机）。
 */
function expandSegmentIntoKeywords(seg: string): string[] {
  const s = seg.trim()
  if (s.length < MIN_CJK_LEN) return []
  if (s.length <= 3) return [s]
  const out = new Set<string>([s])
  out.add(s.slice(0, 2))
  out.add(s.slice(2, 4))
  if (s.length > 4) {
    out.add(s.slice(-2))
    for (let i = 4; i + 2 <= s.length; i += 2) {
      out.add(s.slice(i, i + 2))
    }
  }
  return [...out].filter((x) => x.length >= MIN_CJK_LEN)
}

/**
 * 提取关键词：中文连续片段、英文单词、数字预算等。
 */
export function extractAiQueryKeywords(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []

  let s = text.replace(/[，。、；：！？…·～~\-—（）()\[\]「」『』《》"'“”‘’]+/g, ' ')
  s = stripLeadingIntent(s)
  s = stripPhraseStops(s)
  s = s.replace(SINGLE_STOPS, ' ')
  s = s.replace(/\s+/g, ' ').trim()

  const seen = new Set<string>()
  const add = (w: string) => {
    const x = w.trim()
    if (!x) return
    if (seen.has(x)) return
    seen.add(x)
  }

  for (const [redup, synonyms] of Object.entries(REDUPLICATION_SYNONYMS)) {
    if (text.includes(redup)) {
      for (const syn of synonyms) add(syn)
    }
  }

  for (const m of s.matchAll(/\d{2,6}/g)) {
    add(m[0])
  }

  for (const m of s.matchAll(/[A-Za-z][A-Za-z0-9.\-]{1,24}/g)) {
    if (m[0].length >= MIN_LATIN_LEN) add(m[0])
  }

  for (const part of s.split(/\s+/)) {
    if (!part) continue
    for (const m of part.matchAll(/[\u4e00-\u9fff]{2,}/g)) {
      const seg = m[0]
      if (seg.length <= 8) {
        for (const x of expandSegmentIntoKeywords(seg)) {
          add(x)
        }
      } else {
        add(seg.slice(0, 4))
        add(seg.slice(-4))
        let n = 0
        for (let i = 0; i + MIN_CJK_LEN <= seg.length && n < 10; i += 2) {
          const chunk = seg.slice(i, Math.min(i + 4, seg.length))
          if (chunk.length >= MIN_CJK_LEN) {
            add(chunk)
            n++
          }
        }
      }
    }
  }

  const out = [...seen].filter((k) => {
    if (/^\d+$/.test(k)) return k.length >= 2
    if (/^[A-Za-z]/.test(k)) return k.length >= MIN_LATIN_LEN
    return k.length >= MIN_CJK_LEN
  })

  return out.slice(0, MAX_KEYWORDS)
}
