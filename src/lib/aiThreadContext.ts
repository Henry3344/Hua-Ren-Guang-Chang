/**
 * 将最近多轮用户发言合并为一条文本，供 LLM / 外部 API 理解完整意图。
 */
export function consolidateUserMessagesForRetrieval(
  messages: ReadonlyArray<{ role: string; content: string }>,
  maxUserTurns = 4,
  maxLen = 2000,
): string {
  const users = messages
    .filter((m) => m.role === 'user')
    .map((m) => (m.content ?? '').trim())
    .filter(Boolean)
  return users.slice(-maxUserTurns).join(' ').slice(0, maxLen)
}

/**
 * 仅用于站内关键词检索：默认**只用当前这一轮用户话**，避免上一轮「手机」与本轮「行李箱」混成 OR。
 * 若上一轮是「预算 / 地区」等补充句，再与上一轮合并。
 */
export function buildRetrievalQueryFromThread(
  messages: ReadonlyArray<{ role: string; content: string }>,
  maxLen = 2000,
): string {
  const users = messages
    .filter((m) => m.role === 'user')
    .map((m) => (m.content ?? '').trim())
    .filter(Boolean)
  if (users.length === 0) return ''
  const last = users[users.length - 1]!
  if (users.length === 1) return last.slice(0, maxLen)

  const prev = users[users.length - 2]!
  if (isSupplementOnlyTurn(last)) {
    return `${prev} ${last}`.trim().slice(0, maxLen)
  }
  return last.slice(0, maxLen)
}

function isSupplementOnlyTurn(s: string): boolean {
  const t = s.trim()
  if (t.length <= 6) return true
  if (/^[\d\s,，。.万千百]+$/.test(t)) return true
  if (/^(预算|大概|最多|最少|价格|价位|最高|最低)/.test(t) && t.length < 40) return true
  if (
    /^(在)?(洛杉矶|旧金山|纽约|尔湾|湾区|皇后|法拉盛|布鲁克林|曼哈顿|华埠|长岛)/.test(t) &&
    t.length < 45
  ) {
    return true
  }
  if (/^(LA|NYC|NY|CA)\b/i.test(t) && t.length < 36) return true
  /** 追问样式/是否还有、承接上文 */
  if (t.length <= 36) {
    if (
      /^(怎么|怎样|哪种|啥样|什么样的|还有吗|有没有别的|再多|再找找|换一个|不要这个)/.test(t)
    ) {
      return true
    }
  }
  /** 仅追问价/量、承接上一轮主题（如「二手手机」后的「那现在有多少钱的？」） */
  if (t.length <= 40) {
    if (
      /^(那现在|现在|那|就|还)(到底|究竟)?(有)?多少(钱)?(的)?[？?！!。.…\s]*$/u.test(t) ||
      /^(大概|大约)?多少(钱)?(的)?[？?！!。.…\s]*$/u.test(t) ||
      /^(什么|啥)(价位|价钱|价格)[？?！!。.…\s]*$/u.test(t) ||
      /^价位(呢|如何)?[？?！!。.…\s]*$/u.test(t) ||
      /^(能|可以)?再(便宜|低)(一点|些)?[吗嘛?？!！。.…\s]*$/u.test(t) ||
      /^最(便宜|低价)(的)?(是)?(哪|那)(个|条)?[？?！!。.…\s]*$/u.test(t)
    ) {
      return true
    }
  }
  return false
}
