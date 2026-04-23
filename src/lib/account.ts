const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^\d{6,20}$/

export const USERNAME_REGEX = /^(?=.*[a-z])[a-z0-9_]{4,20}$/

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeLoginIdentifier(value: string): string {
  return value.trim().toLowerCase()
}

export function validateEmail(value: string): string | null {
  const email = normalizeEmail(value)
  if (!email) return '请输入邮箱'
  if (!EMAIL_REGEX.test(email)) return '请输入有效邮箱地址'
  if (email.length > 120) return '邮箱长度不能超过 120 个字符'
  return null
}

export function validateUsername(value: string): string | null {
  const username = normalizeUsername(value)
  if (!username) return '请输入账号'
  if (username.length < 4 || username.length > 20) return '账号长度需为 4-20 位'
  if (!USERNAME_REGEX.test(username)) {
    return '账号仅支持小写字母、数字、下划线，且必须包含至少 1 个字母'
  }
  return null
}

export function getLoginIdentifierKind(value: string): 'email' | 'username' | 'phone' | 'unknown' {
  const trimmed = value.trim()
  const normalized = trimmed.toLowerCase()
  if (!trimmed) return 'unknown'
  if (EMAIL_REGEX.test(normalized)) return 'email'
  if (USERNAME_REGEX.test(normalized)) return 'username'
  if (PHONE_REGEX.test(trimmed)) return 'phone'
  return 'unknown'
}
