const ipAttempts = new Map<string, { count: number; firstAt: number }>()

export function checkIpLimit(ip: string, windowMs = 3600000, max = 3): boolean {
  const now = Date.now()
  const entry = ipAttempts.get(ip)
  if (!entry || now - entry.firstAt > windowMs) {
    ipAttempts.set(ip, { count: 1, firstAt: now })
    return true
  }
  if (entry.count >= max) return false
  entry.count++
  return true
}

const loginAttempts = new Map<string, { count: number; lastAt: number }>()

export function getLoginAttempts(key: string): number {
  const entry = loginAttempts.get(key)
  if (!entry) return 0
  if (Date.now() - entry.lastAt > 1800000) {
    loginAttempts.delete(key)
    return 0
  }
  return entry.count
}

export function incrementLoginAttempts(key: string): number {
  const entry = loginAttempts.get(key)
  const count = (entry?.count || 0) + 1
  loginAttempts.set(key, { count, lastAt: Date.now() })
  return count
}

export function resetLoginAttempts(key: string) {
  loginAttempts.delete(key)
}

/** AI 助手对话：每用户滑动窗口内最多 max 次（用于 /api/ai-search/chat） */
const aiChatHits = new Map<string, number[]>()

export function checkAiChatRateLimit(
  userId: string,
  windowMs = 60_000,
  max = 2,
): boolean {
  const now = Date.now()
  let arr = aiChatHits.get(userId) ?? []
  arr = arr.filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    aiChatHits.set(userId, arr)
    return false
  }
  arr.push(now)
  aiChatHits.set(userId, arr)
  return true
}

/** AI 助手推荐卡片曝光/点击/停留埋点（高于对话主接口上限） */
const aiFeedbackHits = new Map<string, number[]>()

export function checkAiFeedbackRateLimit(
  userId: string,
  windowMs = 60_000,
  max = 120,
): boolean {
  const now = Date.now()
  let arr = aiFeedbackHits.get(userId) ?? []
  arr = arr.filter((t) => now - t < windowMs)
  if (arr.length >= max) {
    aiFeedbackHits.set(userId, arr)
    return false
  }
  arr.push(now)
  aiFeedbackHits.set(userId, arr)
  return true
}

/** AI 助手：同一进程内最多 max 路请求同时处理（多实例部署时每实例各自计数） */
const AI_CHAT_MAX_CONCURRENT = 15
let aiChatActiveCount = 0

export function tryAcquireAiChatConcurrencySlot(max = AI_CHAT_MAX_CONCURRENT): boolean {
  if (aiChatActiveCount >= max) return false
  aiChatActiveCount++
  return true
}

export function releaseAiChatConcurrencySlot(): void {
  aiChatActiveCount = Math.max(0, aiChatActiveCount - 1)
}
