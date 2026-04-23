/** 约 30 天（毫秒），用于昵称 / 头像修改间隔 */
export const PROFILE_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000

export function canChangeAfter(last: Date | null | undefined): boolean {
  if (!last) return true
  return Date.now() - new Date(last).getTime() >= PROFILE_CHANGE_COOLDOWN_MS
}

export function nextAllowedChangeAt(last: Date | null | undefined): Date | null {
  if (!last) return null
  return new Date(new Date(last).getTime() + PROFILE_CHANGE_COOLDOWN_MS)
}
