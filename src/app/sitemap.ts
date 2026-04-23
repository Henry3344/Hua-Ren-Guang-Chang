import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/site'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl()
  const now = new Date()

  const staticPaths: MetadataRoute.Sitemap = [
    '',
    '/posts',
    '/posts/new',
    '/yellowpages',
    '/about',
    '/credit',
    '/disclaimer',
    '/privacy',
    '/advertising',
    '/login',
    '/register',
    '/forgot-password',
    '/dashboard',
    '/favorites',
    '/merchant',
    '/merchant/apply',
    '/share',
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : ('weekly' as const),
    priority: path === '' ? 1 : path === '/posts' ? 0.95 : 0.7,
  }))

  let postEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await prisma.post.findMany({
      where: { status: { in: ['ACTIVE', 'SOLD'] } },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 8000,
    })
    postEntries = posts.map((p) => ({
      url: `${base}/posts/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // 无数据库或构建环境不可连库时仍输出静态 URL
  }

  return [...staticPaths, ...postEntries]
}
