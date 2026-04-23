import { Prisma } from '@prisma/client'
import type { Category, PrismaClient } from '@prisma/client'

/** 当前时刻所在 UTC 整点 */
export function floorUtcHour(d: Date): Date {
  const x = new Date(d)
  x.setUTCMilliseconds(0)
  x.setUTCSeconds(0)
  x.setUTCMinutes(0)
  return x
}

function utcDayStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0))
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + days)
  return x
}

/** 返回 { summary, hourly24, daily30 }；时间均为 UTC */
export async function computeVisitorAnalytics(prisma: PrismaClient) {
  const now = new Date()
  const hourNow = floorUtcHour(now)
  const dayStart = utcDayStart(now)
  const dayEndExclusive = addUtcDays(dayStart, 1)

  const hour24Start = new Date(hourNow)
  hour24Start.setUTCHours(hour24Start.getUTCHours() - 23)

  const day30Start = addUtcDays(dayStart, -29)

  const sevenStart = addUtcDays(dayStart, -6)

  const [
    currentHourRows,
    todayDistinct,
    last7Distinct,
    last30Distinct,
    hourlyRaw,
    dailyRaw,
  ] = await Promise.all([
    prisma.visitorHourMark.count({ where: { hourSlot: hourNow } }),
    prisma.$queryRaw<[{ c: bigint }]>(
      Prisma.sql`
        SELECT COUNT(DISTINCT "visitorHash")::bigint AS c
        FROM "VisitorHourMark"
        WHERE "hourSlot" >= ${dayStart} AND "hourSlot" < ${dayEndExclusive}
      `,
    ),
    prisma.$queryRaw<[{ c: bigint }]>(
      Prisma.sql`
        SELECT COUNT(DISTINCT "visitorHash")::bigint AS c
        FROM "VisitorHourMark"
        WHERE "hourSlot" >= ${sevenStart}
      `,
    ),
    prisma.$queryRaw<[{ c: bigint }]>(
      Prisma.sql`
        SELECT COUNT(DISTINCT "visitorHash")::bigint AS c
        FROM "VisitorHourMark"
        WHERE "hourSlot" >= ${day30Start}
      `,
    ),
    prisma.$queryRaw<{ hourSlot: Date; c: bigint }[]>(
      Prisma.sql`
        SELECT "hourSlot", COUNT(*)::bigint AS c
        FROM "VisitorHourMark"
        WHERE "hourSlot" >= ${hour24Start} AND "hourSlot" <= ${hourNow}
        GROUP BY "hourSlot"
        ORDER BY "hourSlot" ASC
      `,
    ),
    prisma.$queryRaw<{ day: string; c: bigint }[]>(
      Prisma.sql`
        SELECT to_char("hourSlot" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(DISTINCT "visitorHash")::bigint AS c
        FROM "VisitorHourMark"
        WHERE "hourSlot" >= ${day30Start}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ),
  ])

  const hourlyMap = new Map<number, number>()
  for (const row of hourlyRaw) {
    hourlyMap.set(new Date(row.hourSlot).getTime(), Number(row.c))
  }
  const hourly24: { hourSlot: string; count: number }[] = []
  for (let i = 0; i < 24; i++) {
    const h = new Date(hour24Start)
    h.setUTCHours(h.getUTCHours() + i, 0, 0, 0)
    hourly24.push({
      hourSlot: h.toISOString(),
      count: hourlyMap.get(h.getTime()) ?? 0,
    })
  }

  const dailyMap = new Map<string, number>()
  for (const row of dailyRaw) {
    dailyMap.set(String(row.day).slice(0, 10), Number(row.c))
  }
  const daily30: { day: string; count: number }[] = []
  for (let i = 0; i < 30; i++) {
    const day = addUtcDays(day30Start, i)
    const key = day.toISOString().slice(0, 10)
    daily30.push({ day: key, count: dailyMap.get(key) ?? 0 })
  }

  return {
    timezoneNote: 'UTC',
    summary: {
      currentHour: currentHourRows,
      today: Number(todayDistinct[0]?.c ?? 0),
      last7Days: Number(last7Distinct[0]?.c ?? 0),
      last30Days: Number(last30Distinct[0]?.c ?? 0),
    },
    hourly24,
    daily30,
  }
}

export const CATEGORY_ORDER: readonly Category[] = [
  'RENT',
  'RENT_SEEK',
  'JOB',
  'JOB_SEEK',
  'SECONDHAND',
] as const

const CATEGORY_LABELS: Record<Category, string> = {
  RENT: '租房',
  RENT_SEEK: '找房',
  JOB: '招聘',
  JOB_SEEK: '找工',
  SECONDHAND: '二手',
}

/** 分模块（分类）帖子数 / 浏览量 / 均值；含黄页（商家）统计 */
export async function computeContentAnalytics(prisma: PrismaClient) {
  const thirtyAgo = new Date()
  thirtyAgo.setUTCDate(thirtyAgo.getUTCDate() - 29)
  const thirtyDayStart = new Date(
    Date.UTC(
      thirtyAgo.getUTCFullYear(),
      thirtyAgo.getUTCMonth(),
      thirtyAgo.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  )

  const [categoryStatus, categoryViews, newPosts30dRaw, merchantCounts] = await Promise.all([
    prisma.post.groupBy({
      by: ['category', 'status'],
      _count: { _all: true },
    }),
    prisma.post.groupBy({
      by: ['category'],
      _count: { _all: true },
      _sum: { viewCount: true },
      _avg: { viewCount: true },
    }),
    prisma.$queryRaw<{ day: string; c: bigint }[]>(
      Prisma.sql`
        SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS c
        FROM "Post"
        WHERE "createdAt" >= ${thirtyDayStart}
        GROUP BY 1
        ORDER BY 1 ASC
      `,
    ),
    prisma.merchant.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const totalPosts = categoryStatus.reduce((s, r) => s + r._count._all, 0)
  const totalPostViews = categoryViews.reduce((s, r) => s + (r._sum.viewCount ?? 0), 0)

  const statusByCat = new Map<Category, Record<string, number>>()
  for (const row of categoryStatus) {
    const rec = statusByCat.get(row.category) || {}
    rec[row.status] = row._count._all
    statusByCat.set(row.category, rec)
  }

  const byCategory = CATEGORY_ORDER.map((cat) => {
    const statuses = statusByCat.get(cat) || {}
    const agg = categoryViews.find((v) => v.category === cat)
    const total =
      (statuses.ACTIVE ?? 0) +
      (statuses.PENDING ?? 0) +
      (statuses.REJECTED ?? 0) +
      (statuses.SOLD ?? 0) +
      (statuses.EXPIRED ?? 0) +
      (statuses.DELISTED ?? 0)
    return {
      category: cat,
      label: CATEGORY_LABELS[cat],
      total,
      active: statuses.ACTIVE ?? 0,
      pending: statuses.PENDING ?? 0,
      rejected: statuses.REJECTED ?? 0,
      sold: statuses.SOLD ?? 0,
      expired: statuses.EXPIRED ?? 0,
      delisted: statuses.DELISTED ?? 0,
      totalViews: agg?._sum.viewCount ?? 0,
      avgViews: Math.round(((agg?._avg.viewCount ?? 0) + Number.EPSILON) * 10) / 10,
    }
  })

  const daily: { day: string; count: number }[] = []
  const dailyMap = new Map<string, number>()
  for (const row of newPosts30dRaw) {
    dailyMap.set(String(row.day).slice(0, 10), Number(row.c))
  }
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDayStart)
    d.setUTCDate(d.getUTCDate() + i)
    const key = d.toISOString().slice(0, 10)
    daily.push({ day: key, count: dailyMap.get(key) ?? 0 })
  }

  const merchants = {
    approved: merchantCounts.find((m) => m.status === 'APPROVED')?._count._all ?? 0,
    pending: merchantCounts.find((m) => m.status === 'PENDING')?._count._all ?? 0,
    rejected: merchantCounts.find((m) => m.status === 'REJECTED')?._count._all ?? 0,
  }

  return {
    totals: {
      posts: totalPosts,
      postViews: totalPostViews,
    },
    byCategory,
    newPostsDaily30: daily,
    merchants,
  }
}

/** 广告曝光、点击、点击率；分位置与类型汇总，TOP 广告与 TOP 帖子 */
export async function computeAdsAnalytics(prisma: PrismaClient) {
  const now = new Date()
  const [placementAgg, typeAgg, totals, activeCount, topAds, topPosts, newUsers30Raw] =
    await Promise.all([
      prisma.ad.groupBy({
        by: ['placement'],
        _sum: { impressions: true, clicks: true },
        _count: { _all: true },
      }),
      prisma.ad.groupBy({
        by: ['type'],
        _sum: { impressions: true, clicks: true },
        _count: { _all: true },
      }),
      prisma.ad.aggregate({
        _sum: { impressions: true, clicks: true },
        _count: { _all: true },
      }),
      prisma.ad.count({
        where: { isActive: true, startAt: { lte: now }, endAt: { gte: now } },
      }),
      prisma.ad.findMany({
        orderBy: [{ clicks: 'desc' }, { impressions: 'desc' }],
        take: 10,
        select: {
          id: true,
          type: true,
          placement: true,
          targetUrl: true,
          postId: true,
          impressions: true,
          clicks: true,
          startAt: true,
          endAt: true,
          isActive: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.post.findMany({
        where: { status: { in: ['ACTIVE', 'SOLD'] } },
        orderBy: { viewCount: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          viewCount: true,
          location: true,
          isPinned: true,
          user: { select: { id: true, name: true } },
        },
      }),
      prisma.$queryRaw<{ day: string; c: bigint }[]>(
        Prisma.sql`
          SELECT to_char("createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, COUNT(*)::bigint AS c
          FROM "User"
          WHERE "isDeleted" = false AND "createdAt" >= NOW() - INTERVAL '29 days'
          GROUP BY 1
          ORDER BY 1 ASC
        `,
      ),
    ])

  const totalImpressions = totals._sum.impressions ?? 0
  const totalClicks = totals._sum.clicks ?? 0
  const overallCtr =
    totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0

  function ctrOf(imp: number, clk: number) {
    if (imp <= 0) return 0
    return Math.round((clk / imp) * 10000) / 100
  }

  const byPlacement = placementAgg
    .map((r) => {
      const imp = r._sum.impressions ?? 0
      const clk = r._sum.clicks ?? 0
      return {
        placement: r.placement,
        ads: r._count._all,
        impressions: imp,
        clicks: clk,
        ctrPct: ctrOf(imp, clk),
      }
    })
    .sort((a, b) => b.impressions - a.impressions)

  const byType = typeAgg
    .map((r) => {
      const imp = r._sum.impressions ?? 0
      const clk = r._sum.clicks ?? 0
      return {
        type: r.type,
        ads: r._count._all,
        impressions: imp,
        clicks: clk,
        ctrPct: ctrOf(imp, clk),
      }
    })
    .sort((a, b) => b.impressions - a.impressions)

  const topAdsOut = topAds.map((a) => ({
    id: a.id,
    type: a.type,
    placement: a.placement,
    targetUrl: a.targetUrl,
    postId: a.postId,
    impressions: a.impressions,
    clicks: a.clicks,
    ctrPct: ctrOf(a.impressions, a.clicks),
    startAt: a.startAt.toISOString(),
    endAt: a.endAt.toISOString(),
    isActive:
      a.isActive && a.startAt.getTime() <= now.getTime() && a.endAt.getTime() >= now.getTime(),
    advertiser: a.user,
  }))

  const topPostsOut = topPosts.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    status: p.status,
    viewCount: p.viewCount,
    location: p.location,
    isPinned: p.isPinned,
    author: p.user,
  }))

  const userDailyMap = new Map<string, number>()
  for (const row of newUsers30Raw) {
    userDailyMap.set(String(row.day).slice(0, 10), Number(row.c))
  }
  const thirtyStart = new Date()
  thirtyStart.setUTCDate(thirtyStart.getUTCDate() - 29)
  thirtyStart.setUTCHours(0, 0, 0, 0)
  const newUsersDaily30: { day: string; count: number }[] = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyStart)
    d.setUTCDate(d.getUTCDate() + i)
    const k = d.toISOString().slice(0, 10)
    newUsersDaily30.push({ day: k, count: userDailyMap.get(k) ?? 0 })
  }

  return {
    totals: {
      ads: totals._count._all,
      activeAds: activeCount,
      impressions: totalImpressions,
      clicks: totalClicks,
      overallCtrPct: overallCtr,
    },
    byPlacement,
    byType,
    topAds: topAdsOut,
    topPosts: topPostsOut,
    newUsersDaily30,
  }
}
