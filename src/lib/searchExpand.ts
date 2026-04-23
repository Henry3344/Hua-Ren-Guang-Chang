const PINYIN_MAP: Record<string, string[]> = {
  danfang: ['单房'],
  zhengzu: ['整租'],
  hezu: ['合租'],
  chuangwei: ['床位'],
  chewei: ['车位'],
  duanzu: ['短租', '民宿'],
  minsuh: ['民宿'],
  gongyu: ['公寓'],
  dundong: ['独栋'],
  lianpai: ['联排公寓'],
  kangdou: ['康斗'],
  bantuku: ['半土库'],
  gelou: ['阁楼'],
  jianzhi: ['兼职'],
  quanzhi: ['全职'],
  quanShui: ['全税'],
  xianjin: ['现金'],
}

function normalizeLatin(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
}

export function expandSearchQuery(q: string): string[] {
  const nq = normalizeLatin(q)
  if (!nq) return []
  const parts = nq.split(' ').filter(Boolean)
  const extras = new Set<string>()
  for (const p of parts) {
    const v = PINYIN_MAP[p]
    if (v) v.forEach((x) => extras.add(x))
  }
  return [...extras]
}

export function isLikelyPinyin(q: string) {
  const s = q.trim()
  if (!s) return false
  return /^[a-z0-9\s]+$/i.test(s)
}

