import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { expandSearchQuery, isLikelyPinyin } from '@/lib/searchExpand'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const mode = searchParams.get('mode') || 'suggest'
  const limitRaw = searchParams.get('limit')
  const parsed = limitRaw ? parseInt(limitRaw, 10) : NaN
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(20, parsed) : mode === 'placeholder' ? 20 : 8

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
    if (locCity) whereParts.push(Prisma.sql`p.location LIKE ${'%' + locCity + '%'}`)
    if (locArea) whereParts.push(Prisma.sql`p.location LIKE ${'%' + locArea + '%'}`)
  }

  const extras = isLikelyPinyin(q) ? expandSearchQuery(q) : []
  if (mode === 'placeholder') {
    // prefer posts with images; fall back if none
    whereParts.push(Prisma.sql`p.title IS NOT NULL`)
    const whereSql = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`
    const fromSql = Prisma.sql`FROM "Post" p INNER JOIN "User" u ON u.id = p."userId"`
    const rows = await prisma.$queryRaw<Array<{ id: string; title: string }>>(Prisma.sql`
      SELECT p.id, p.title
      ${fromSql}
      ${whereSql}
      ORDER BY (CASE WHEN cardinality(p."images") > 0 THEN 1 ELSE 0 END) DESC,
        p."viewCount" DESC,
        p."createdAt" DESC
      LIMIT ${limit}
    `)
    return NextResponse.json({ items: rows })
  }

  if (!q) return NextResponse.json({ items: [] })

  const patterns = [q, ...extras].slice(0, 6).map((s) => `%${s}%`)
  const orParts = patterns.map(
    (pat) => Prisma.sql`(p.title ILIKE ${pat} OR p.description ILIKE ${pat})`,
  )
  whereParts.push(Prisma.sql`(${Prisma.join(orParts, ' OR ')})`)

  const whereSql = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`
  const fromSql = Prisma.sql`FROM "Post" p INNER JOIN "User" u ON u.id = p."userId"`

  const rows = await prisma.$queryRaw<Array<{ id: string; title: string }>>(Prisma.sql`
    SELECT p.id, p.title
    ${fromSql}
    ${whereSql}
    ORDER BY (CASE WHEN cardinality(p."images") > 0 THEN 1 ELSE 0 END) DESC,
      p."createdAt" DESC
    LIMIT ${limit}
  `)
  return NextResponse.json({ items: rows })
}

