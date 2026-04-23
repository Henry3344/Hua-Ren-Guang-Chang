import { prisma } from '@/lib/prisma'
import { Category, Prisma } from '@prisma/client'
import { expandSearchQuery, isLikelyPinyin } from '@/lib/searchExpand'

export type GetPostsListOptions = {
  /** 多关键词 OR 匹配（标题/描述/联系方式），用于 AI 助手；设置时忽略 URL 中的 q */
  keywordOrTokens?: string[]
  /** AI 助手按意图收窄大类；与 URL category 二选一（优先此项） */
  categoryIn?: Category[]
  /** 用于 AI 的价格区间筛选（通用，覆盖租房/二手/招聘 price 字段） */
  priceMin?: number | null
  priceMax?: number | null
}

/**
 * 与 GET /api/posts 一致：供 Route Handler、RSC、ISR 复用。
 */
export async function getPostsList(
  searchParams: URLSearchParams,
  viewerId?: string | null,
  options?: GetPostsListOptions,
) {
  const category = searchParams.get('category') as Category | null
  const q = searchParams.get('q') || ''
  const keywordOrTokens = (options?.keywordOrTokens ?? []).map((s) => s.trim()).filter(Boolean)
  const categoryInOpt = (options?.categoryIn ?? []).filter(Boolean) as Category[]
  const useCategoryIn = categoryInOpt.length > 0
  const priceMinOpt =
    options?.priceMin != null && Number.isFinite(Number(options.priceMin)) ? Number(options.priceMin) : null
  const priceMaxOpt =
    options?.priceMax != null && Number.isFinite(Number(options.priceMax)) ? Number(options.priceMax) : null
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limitRaw = searchParams.get('limit')
  const parsed = limitRaw ? parseInt(limitRaw, 10) : NaN
  /** AI 助手等会传较大 limit；过小时易漏掉仅出现在子类/地区的帖 */
  const limit = Number.isFinite(parsed) && parsed > 0 ? Math.min(120, parsed) : 20
  const skip = (page - 1) * limit

  const sub = searchParams.get('sub') || ''

  const locScope = searchParams.get('locScope') || 'nationwide'
  const locState = searchParams.get('locState') || ''
  const locCity = searchParams.get('locCity') || ''
  const locArea = searchParams.get('locArea') || ''

  const tr = searchParams.get('tr') || 'all'
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc'
  const priceBand = searchParams.get('pb') || ''
  const rentType = searchParams.get('rt') || ''
  const jobWorkType = searchParams.get('jwt') || ''
  const jobTaxType = searchParams.get('jtt') || ''
  const jobLanguage = searchParams.get('jl') || ''
  const itemCondition = searchParams.get('ic') || ''
  const isRandom = searchParams.get('random') === '1'
  const excludeIds = (searchParams.get('exclude') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const whereParts: Prisma.Sql[] = [
    Prisma.sql`p.status IN ('ACTIVE'::"PostStatus", 'SOLD'::"PostStatus")`,
    Prisma.sql`u."isDeleted" = false`,
    Prisma.sql`u."isBanned" = false`,
  ]
  if (useCategoryIn) {
    whereParts.push(
      Prisma.sql`p.category IN (${Prisma.join(
        categoryInOpt.map((c) => Prisma.sql`${c}::"Category"`),
      )})`,
    )
  } else if (category) {
    whereParts.push(Prisma.sql`p.category = ${category}::"Category"`)
  }
  /** 多类 IN 时不做子类筛选项（避免与 URL 混用）；单类 IN 或单 URL category 时沿用 */
  const catForSubfilters: Category | null = useCategoryIn
    ? categoryInOpt.length === 1
      ? categoryInOpt[0]!
      : null
    : category
  if (sub && sub !== '') {
    whereParts.push(Prisma.sql`p."subCategory" = ${sub}`)
  }
  if ((catForSubfilters === 'RENT' || catForSubfilters === 'RENT_SEEK') && rentType) {
    whereParts.push(Prisma.sql`p."rentType" = ${rentType}`)
  }
  if ((catForSubfilters === 'JOB' || catForSubfilters === 'JOB_SEEK') && jobWorkType) {
    whereParts.push(Prisma.sql`p."jobWorkType" = ${jobWorkType}`)
  }
  if ((catForSubfilters === 'JOB' || catForSubfilters === 'JOB_SEEK') && jobTaxType) {
    whereParts.push(Prisma.sql`p."jobTaxType" = ${jobTaxType}`)
  }
  if ((catForSubfilters === 'JOB' || catForSubfilters === 'JOB_SEEK') && jobLanguage) {
    whereParts.push(Prisma.sql`p."jobLanguage" = ${jobLanguage}`)
  }
  if (catForSubfilters === 'SECONDHAND' && itemCondition) {
    whereParts.push(Prisma.sql`p."itemCondition" = ${itemCondition}`)
  }
  if (priceMinOpt != null) {
    whereParts.push(Prisma.sql`p.price IS NOT NULL AND p.price >= ${priceMinOpt}`)
  }
  if (priceMaxOpt != null) {
    whereParts.push(Prisma.sql`p.price IS NOT NULL AND p.price <= ${priceMaxOpt}`)
  }
  if (keywordOrTokens.length > 0) {
    const orKeywordParts: Prisma.Sql[] = []
    for (const kw of keywordOrTokens.slice(0, 15)) {
      const extras = isLikelyPinyin(kw) ? expandSearchQuery(kw) : []
      const patterns = [kw, ...extras].slice(0, 6).map((s) => `%${s}%`)
      const innerOr = patterns.map(
        (pat) =>
          Prisma.sql`(p.title ILIKE ${pat} OR p.description ILIKE ${pat} OR p.contact ILIKE ${pat} OR COALESCE(p."subCategory",'') ILIKE ${pat} OR p.location ILIKE ${pat})`,
      )
      orKeywordParts.push(Prisma.sql`(${Prisma.join(innerOr, ' OR ')})`)
    }
    if (orKeywordParts.length > 0) {
      whereParts.push(Prisma.sql`(${Prisma.join(orKeywordParts, ' OR ')})`)
    }
  } else if (q) {
    const extras = isLikelyPinyin(q) ? expandSearchQuery(q) : []
    const patterns = [q, ...extras].slice(0, 6).map((s) => `%${s}%`)
    const orParts = patterns.map(
      (pat) =>
        Prisma.sql`(p.title ILIKE ${pat} OR p.description ILIKE ${pat} OR COALESCE(p."subCategory",'') ILIKE ${pat} OR p.location ILIKE ${pat})`,
    )
    whereParts.push(Prisma.sql`(${Prisma.join(orParts, ' OR ')})`)
  }
  if (viewerId) {
    whereParts.push(
      Prisma.sql`NOT EXISTS (SELECT 1 FROM "Block" b WHERE b."blockerId" = ${viewerId} AND b."blockedId" = u.id)`,
    )
  }

  if (excludeIds.length) {
    whereParts.push(
      Prisma.sql`p.id NOT IN (${Prisma.join(excludeIds.map((id) => Prisma.sql`${id}`))})`,
    )
  }

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

  const now = new Date()
  if (tr === '7d') {
    whereParts.push(Prisma.sql`p."createdAt" >= ${new Date(now.getTime() - 7 * 86400000)}`)
  } else if (tr === '30d') {
    whereParts.push(Prisma.sql`p."createdAt" >= ${new Date(now.getTime() - 30 * 86400000)}`)
  } else if (tr === '180d') {
    whereParts.push(Prisma.sql`p."createdAt" >= ${new Date(now.getTime() - 180 * 86400000)}`)
  } else if (tr === '1y_plus') {
    whereParts.push(Prisma.sql`p."createdAt" < ${new Date(now.getTime() - 365 * 86400000)}`)
  }

  if ((catForSubfilters === 'RENT' || catForSubfilters === 'RENT_SEEK') && priceBand !== '') {
    const n = parseInt(priceBand, 10)
    if (n === 0) {
      whereParts.push(Prisma.sql`(p.price IS NULL OR p.price < 500)`)
    } else if (n === 1) {
      whereParts.push(Prisma.sql`p.price >= 500 AND p.price < 1000`)
    } else if (n === 2) {
      whereParts.push(Prisma.sql`p.price >= 1000 AND p.price < 1500`)
    } else if (n === 3) {
      whereParts.push(Prisma.sql`p.price >= 1500 AND p.price < 2000`)
    } else if (n === 4) {
      whereParts.push(Prisma.sql`p.price >= 2000 AND p.price < 2500`)
    } else if (n === 5) {
      whereParts.push(Prisma.sql`p.price >= 2500`)
    }
  }

  const orderCreated =
    sortDir === 'asc' ? Prisma.sql`p."createdAt" ASC` : Prisma.sql`p."createdAt" DESC`

  const whereSql = Prisma.sql`WHERE ${Prisma.join(whereParts, ' AND ')}`
  const fromSql = Prisma.sql`FROM "Post" p INNER JOIN "User" u ON u.id = p."userId"`

  const idQuery = isRandom
    ? prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT p.id
        ${fromSql}
        ${whereSql}
        ORDER BY RANDOM()
        LIMIT ${limit}
      `)
    : prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
        SELECT p.id
        ${fromSql}
        ${whereSql}
        ORDER BY p."isPinned" DESC,
          (CASE WHEN cardinality(p."images") > 0 THEN 1 ELSE 0 END) DESC,
          cardinality(p."images") DESC,
          ${orderCreated}
        LIMIT ${limit} OFFSET ${skip}
      `)

  const [countRows, idRows] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS count
      ${fromSql}
      ${whereSql}
    `),
    idQuery,
  ])

  const total = Number(countRows[0]?.count ?? 0)
  const ids = idRows.map((r) => r.id)

  if (ids.length === 0) {
    return { posts: [], total, page, totalPages: Math.ceil(total / limit) || 1 }
  }

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

  const totalPages = isRandom ? 1 : Math.ceil(total / limit)

  return {
    posts,
    total,
    page: isRandom ? 1 : page,
    totalPages: totalPages || 1,
  }
}
