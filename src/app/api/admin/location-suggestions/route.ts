import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const take = Math.min(200, Math.max(1, parseInt(searchParams.get('take') || '100', 10) || 100))

  const items = await prisma.locationSuggestion.findMany({
    orderBy: { createdAt: 'desc' },
    take,
  })

  const total = await prisma.locationSuggestion.count()

  return NextResponse.json({ suggestions: items, total })
}
