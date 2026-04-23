import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { getSiteUrl } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      title: true,
      description: true,
      updatedAt: true,
      status: true,
      images: true,
    },
  })

  if (!post) {
    return { title: '帖子', robots: { index: false, follow: false } }
  }

  const publicOk = post.status === 'ACTIVE' || post.status === 'SOLD'
  if (!publicOk) {
    return {
      title: '帖子',
      robots: { index: false, follow: false },
    }
  }

  const desc = (post.description || '').replace(/\s+/g, ' ').trim().slice(0, 160)
  const base = getSiteUrl()
  const firstImage = post.images?.[0]
  const ogImages = firstImage
    ? [{ url: firstImage, alt: post.title }]
    : [{ url: `${base}/home-banner.png`, width: 1200, height: 630, alt: post.title }]

  return {
    title: post.title,
    description: desc || undefined,
    alternates: { canonical: `${base}/posts/${id}` },
    openGraph: {
      title: post.title,
      description: desc || undefined,
      type: 'article',
      modifiedTime: post.updatedAt.toISOString(),
      url: `${base}/posts/${id}`,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: desc || undefined,
      images: ogImages.map((i) => i.url),
    },
  }
}

export default function PostDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
