import type { Category } from '@prisma/client'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export default async function RelatedPosts({ category, excludeId }: { category: string; excludeId: string }) {
  const posts = await prisma.post.findMany({
    where: { category: category as Category, status: 'ACTIVE', id: { not: excludeId } },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    take: 4,
  })

  if (posts.length === 0) return null

  const priceLabel = (post: (typeof posts)[number]) =>
    post.category === 'JOB'
      ? (post.price != null ? '$' + post.price + '/hr' : '面议')
      : post.category === 'JOB_SEEK'
        ? (post.price != null ? '$' + post.price : '面议')
        : (post.price != null ? '$' + post.price.toLocaleString() : '面议')

  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="p-4 border-b font-semibold text-sm">相关推荐</div>
      <div className="divide-y">
        {posts.map(post => (
          <Link key={post.id} href={'/posts/' + post.id}
            className="flex gap-3 p-3 hover:bg-accent transition-colors group">
            {post.images?.[0] ? (
              <img src={post.images[0]} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-xl opacity-30">
                {post.category === 'RENT' || post.category === 'RENT_SEEK'
                  ? '🏠'
                  : post.category === 'JOB' || post.category === 'JOB_SEEK'
                    ? '💼'
                    : '📦'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{post.title}</p>
              <p className="text-primary font-bold text-sm mt-1">{priceLabel(post)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{post.location}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
