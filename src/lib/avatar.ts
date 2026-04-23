export const DEFAULT_AVATAR = '/avatar-default.svg'

export function userAvatarSrc(avatar: string | null | undefined): string {
  if (avatar && avatar.trim()) return avatar.trim()
  return DEFAULT_AVATAR
}
