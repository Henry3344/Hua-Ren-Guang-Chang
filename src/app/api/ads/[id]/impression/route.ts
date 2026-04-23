import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ad = await prisma.ad.findUnique({ where: { id } })
  if (!ad) {
    return NextResponse.json({ error: '不存在' }, { status: 404 })
  }

  await prisma.ad.update({
    where: { id },
    data: { impressions: { increment: 1 } },
  })

  return NextResponse.json({ success: true })
}
