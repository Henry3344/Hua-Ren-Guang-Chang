import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = (searchParams.get('category') || '').trim()

  const merchants = await prisma.merchant.findMany({
    where: {
      status: 'APPROVED',
      isDelisted: false,
      ...(category ? { category } : {}),
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      companyName: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      businessScope: true,
      createdAt: true,
      isPinned: true,
      updatedAt: true,
    },
  })

  return NextResponse.json({ merchants })
}

