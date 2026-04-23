export const AD_TYPES = ['PINNED', 'BANNER', 'INLINE'] as const
export type AdType = (typeof AD_TYPES)[number]

export const AD_TYPE_LABELS: Record<AdType, string> = {
  PINNED: '置顶推广',
  BANNER: '横幅广告',
  INLINE: '信息流广告',
}

export const AD_PLACEMENTS = [
  'HOME_TOP_LEFT',
  'HOME_TOP_RIGHT',
  'HOME_MIDDLE_LEFT',
  'HOME_MIDDLE_RIGHT',
  'HOME_BOTTOM_LEFT',
  'HOME_BOTTOM_RIGHT',
  'CATEGORY_TOP_LEFT',
  'CATEGORY_TOP_RIGHT',
  'CATEGORY_BOTTOM_LEFT',
  'CATEGORY_BOTTOM_RIGHT',
  'POST_TOP_LEFT',
  'POST_TOP_RIGHT',
  'POST_BOTTOM_LEFT',
  'POST_BOTTOM_RIGHT',
  'INLINE_FEED',
  /** AI 助手对话内「赞助推荐」单卡（与信息流横幅位区分） */
  'AI_ASSISTANT_SPONSOR',
] as const
export type AdPlacement = (typeof AD_PLACEMENTS)[number]

/** AI 助手对话内赞助卡对应的 placement 值（与 `AD_PLACEMENTS` 一致） */
export const AI_ASSISTANT_SPONSOR_PLACEMENT: AdPlacement = 'AI_ASSISTANT_SPONSOR'

/** 横幅位左右成对时的逻辑名（用于 AdSlotPair） */
export type AdBannerPairBase =
  | 'HOME_TOP'
  | 'HOME_MIDDLE'
  | 'HOME_BOTTOM'
  | 'CATEGORY_TOP'
  | 'CATEGORY_BOTTOM'
  | 'POST_TOP'
  | 'POST_BOTTOM'

export function pairPlacements(base: AdBannerPairBase): [AdPlacement, AdPlacement] {
  return [`${base}_LEFT` as AdPlacement, `${base}_RIGHT` as AdPlacement]
}

/** 商家中心 / 前台展示用中文名称 */
export const AD_PLACEMENT_LABELS: Record<AdPlacement, string> = {
  HOME_TOP_LEFT: '首页置顶横幅广告（左）',
  HOME_TOP_RIGHT: '首页置顶横幅广告（右）',
  HOME_MIDDLE_LEFT: '首页中部横幅广告（左）',
  HOME_MIDDLE_RIGHT: '首页中部横幅广告（右）',
  HOME_BOTTOM_LEFT: '首页底部横幅广告（左）',
  HOME_BOTTOM_RIGHT: '首页底部横幅广告（右）',
  CATEGORY_TOP_LEFT: '分类列表页顶部横幅广告（左）',
  CATEGORY_TOP_RIGHT: '分类列表页顶部横幅广告（右）',
  CATEGORY_BOTTOM_LEFT: '分类列表页底部横幅广告（左）',
  CATEGORY_BOTTOM_RIGHT: '分类列表页底部横幅广告（右）',
  POST_TOP_LEFT: '帖子详情页顶部横幅广告（左）',
  POST_TOP_RIGHT: '帖子详情页顶部横幅广告（右）',
  POST_BOTTOM_LEFT: '帖子详情页底部横幅广告（左）',
  POST_BOTTOM_RIGHT: '帖子详情页底部横幅广告（右）',
  INLINE_FEED: '列表信息流横幅广告',
  AI_ASSISTANT_SPONSOR: 'AI 助手赞助推荐位（单条）',
}

export function getPlacementLabel(placement: string): string {
  if (isAdPlacement(placement)) return AD_PLACEMENT_LABELS[placement]
  return placement
}

export function getAdTypeLabel(type: string): string {
  if (isAdType(type)) return AD_TYPE_LABELS[type]
  return type
}

export function isAdPlacement(s: string): s is AdPlacement {
  return (AD_PLACEMENTS as readonly string[]).includes(s)
}

export function isAdType(s: string): s is AdType {
  return (AD_TYPES as readonly string[]).includes(s)
}
