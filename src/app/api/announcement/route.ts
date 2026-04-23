import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const a = await prisma.announcement.findFirst({
    orderBy: { updatedAt: 'desc' },
  })
  if (!a || !a.enabled || !a.lines?.length) {
    return NextResponse.json({ enabled: false, lines: [] })
  }
  return NextResponse.json({ enabled: true, lines: a.lines })
}

