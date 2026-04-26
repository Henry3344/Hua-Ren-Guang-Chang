import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function isMissingMerchantPaymentStatus(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2022' &&
    String(error.meta?.column || '').includes('Merchant.paymentStatus')
  )
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  let merchants
  try {
    merchants = await prisma.merchant.findMany({
      orderBy: [{ status: 'asc' }, { isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    })
  } catch (error) {
    if (!isMissingMerchantPaymentStatus(error)) throw error

    merchants = await prisma.merchant.findMany({
      orderBy: [{ status: 'asc' }, { isPinned: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        userId: true,
        companyName: true,
        category: true,
        phone: true,
        email: true,
        address: true,
        licenseImage: true,
        businessScope: true,
        status: true,
        submittedAt: true,
        isPinned: true,
        isDelisted: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
  }

  return NextResponse.json({ merchants })
}

