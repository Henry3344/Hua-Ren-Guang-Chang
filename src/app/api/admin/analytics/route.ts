import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  computeAdsAnalytics,
  computeContentAnalytics,
  computeVisitorAnalytics,
} from '@/lib/visitorAnalytics'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  try {
    const [visitors, content, ads] = await Promise.all([
      computeVisitorAnalytics(prisma),
      computeContentAnalytics(prisma),
      computeAdsAnalytics(prisma),
    ])
    return NextResponse.json({ visitors, content, ads })
  } catch (e) {
    console.error('admin analytics', e)
    return NextResponse.json({ error: '统计查询失败' }, { status: 500 })
  }
}
