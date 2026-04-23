import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean })?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const take = Math.min(50, Math.max(1, parseInt(searchParams.get('take') || '30', 10) || 30))

  const where: Prisma.UserWhereInput = { isDeleted: false }
  if (q) {
    where.OR = [
      { email: { contains: q, mode: 'insensitive' } },
      { username: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { name: { contains: q, mode: 'insensitive' } },
      { id: { equals: q } },
    ]
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      isAdmin: true,
      isBanned: true,
      creditScore: true,
      createdAt: true,
      _count: { select: { posts: true } },
    },
  })

  return NextResponse.json({ users })
}
