/** level = min(100, floor(发帖数 * 2 + 浏览数 / 50)) */
export function computeLevel(postCount: number, totalViewCount: number): number {
  return Math.min(100, Math.floor(postCount * 2 + totalViewCount / 50))
}
