/**
 * 公开站点根 URL（用于 OG、sitemap、JSON-LD）。
 * 生产请设置 NEXT_PUBLIC_SITE_URL=https://你的域名（无尾斜杠）。
 * Vercel 上未设置时会回退到 VERCEL_URL。
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (explicit) return explicit.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`
  return 'http://localhost:3000'
}
