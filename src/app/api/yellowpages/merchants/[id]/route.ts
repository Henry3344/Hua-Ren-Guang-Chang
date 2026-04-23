import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const merchant = await prisma.merchant.findUnique({
    where: { id },
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
      status: true,
      isDelisted: true,
    },
  })

  if (!merchant || merchant.status !== 'APPROVED' || merchant.isDelisted) {
    return NextResponse.json({ error: '商家不存在或已下架' }, { status: 404 })
  }

  return NextResponse.json({ merchant })
}

