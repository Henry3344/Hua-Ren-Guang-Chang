import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/** 顶栏曝光轮播：匿名可读 */
export async function GET() {
  const items = await prisma.riskExposureItem.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, text: true },
    take: 50,
  })
  return NextResponse.json({ items })
}
