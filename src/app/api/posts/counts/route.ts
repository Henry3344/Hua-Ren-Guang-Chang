import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const locScope = searchParams.get('locScope') || 'nationwide'
  const locState = searchParams.get('locState') || ''
  const locCity = searchParams.get('locCity') || ''
  const locArea = searchParams.get('locArea') || ''

  const whereParts: Prisma.Sql[] = [
    Prisma.sql`p.status IN ('ACTIVE'::"PostStatus", 'SOLD'::"PostStatus")`,
    Prisma.sql`u."isDeleted" = false`,
    Prisma.sql`u."isBanned" = false`,
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

  const rows = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>(Prisma.sql`
    SELECT p.category::text AS category, COUNT(*)::bigint AS count
    FROM "Post" p
    INNER JOIN "User" u ON u.id = p."userId"
    ${whereSql}
    GROUP BY p.category
  `)

  const counts: Record<string, number> = { RENT: 0, RENT_SEEK: 0, JOB: 0, JOB_SEEK: 0, SECONDHAND: 0 }
  rows.forEach((r) => {
    counts[r.category] = Number(r.count)
  })

  return NextResponse.json({ counts })
}

