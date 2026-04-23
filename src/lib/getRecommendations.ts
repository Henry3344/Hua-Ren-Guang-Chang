import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/** 与 GET /api/posts/recommendations 一致。 */
export async function getRecommendations(searchParams: URLSearchParams) {
  const limitRaw = searchParams.get('limit')
  const parsed = limitRaw ? parseInt(limitRaw, 10) : NaN
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(30, parsed) : 18

  const locScope = searchParams.get('locScope') || 'nationwide'
  const locState = searchParams.get('locState') || ''
  const locCity = searchParams.get('locCity') || ''
  const locArea = searchParams.get('locArea') || ''

  const whereParts: Prisma.Sql[] = [
    Prisma.sql`p.status IN ('ACTIVE'::"PostStatus", 'SOLD'::"PostStatus")`,
    Prisma.sql`u."isDeleted" = false`,
    Prisma.sql`u."isBanned" = false`,
    Prisma.sql`cardinality(p."images") > 0`,
  ]

  if (locScope !== 'nationwide' && locState) {
    whereParts.push(Prisma.sql`p.state = ${locState}`)
    if (locCity) {
      const likeCity = `%${locCity}%`
      whereParts.push(Prisma.sql`p.location LIKE ${likeCity}`)
    }
    if (locArea) {
      const likeArea = `%${locArea}%`
      whereParts.push(Prisma.sql`p.location LIKE ${likeArea}`)
    }
  }

  const whereSql = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`

  const rows = await prisma.$queryRaw<
    Array<{
      id: string
      score: number
    }>
  >(Prisma.sql`
    SELECT
      p.id,
      (p."viewCount" + COUNT(f.id) * 5)::int AS score
    FROM "Post" p
    INNER JOIN "User" u ON u.id = p."userId"
    LEFT JOIN "Favorite" f ON f."postId" = p.id
    ${whereSql}
    GROUP BY p.id
    ORDER BY score DESC, p."createdAt" DESC
    LIMIT ${limit}
  `)

  const ids = rows.map((r) => r.id)
  if (ids.length === 0) return { posts: [] }

  const postsUnordered = await prisma.post.findMany({
    where: { id: { in: ids } },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          merchant: { select: { status: true } },
        },
      },
    },
  })

  const orderMap = new Map(ids.map((id, i) => [id, i]))
  const posts = [...postsUnordered].sort(
    (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
  )
  return { posts }
}
