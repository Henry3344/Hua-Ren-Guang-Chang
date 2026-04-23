import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const [
    userCount,
    postPending,
    postActive,
    postRejected,
    postDelisted,
    postTotal,
    merchantPending,
    merchantApproved,
    feedbackCount,
    reportPostCount,
    reportUserCount,
    locationSuggestionCount,
    adActiveCount,
  ] = await Promise.all([
    prisma.user.count({ where: { isDeleted: false } }),
    prisma.post.count({ where: { status: 'PENDING' } }),
    prisma.post.count({ where: { status: 'ACTIVE' } }),
    prisma.post.count({ where: { status: 'REJECTED' } }),
    prisma.post.count({ where: { status: 'DELISTED' } }),
    prisma.post.count(),
    prisma.merchant.count({ where: { status: 'PENDING' } }),
    prisma.merchant.count({ where: { status: 'APPROVED' } }),
    prisma.feedback.count(),
    prisma.report.count(),
    prisma.userReport.count(),
    prisma.locationSuggestion.count(),
    prisma.ad.count({
      where: { isActive: true, startAt: { lte: new Date() }, endAt: { gte: new Date() } },
    }),
  ])

  return NextResponse.json({
    users: userCount,
    posts: {
      total: postTotal,
      pending: postPending,
      active: postActive,
      rejected: postRejected,
      delisted: postDelisted,
    },
    merchants: {
      pending: merchantPending,
      approved: merchantApproved,
    },
    feedback: feedbackCount,
    reports: { posts: reportPostCount, users: reportUserCount },
    locationSuggestions: locationSuggestionCount,
    adsActive: adActiveCount,
  })
}
