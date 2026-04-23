import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  const userId = (session.user as { id: string }).id
  const body = await req.json()
  const { companyName, category, phone, email, address, licenseImage, businessScope } = body

  if (!companyName?.trim() || !category?.trim() || !phone?.trim() || !email?.trim() || !address?.trim() || !licenseImage?.trim() || !businessScope?.trim()) {
    return NextResponse.json({ error: '请填写全部必填项' }, { status: 400 })
  }

  const existing = await prisma.merchant.findUnique({ where: { userId } })
  if (existing) {
    if (existing.paymentStatus === 'COMPLETED' && existing.status !== 'REJECTED') {
      return NextResponse.json({ error: '您已提交过入驻申请' }, { status: 400 })
    }
  }

  const payload = {
    companyName: companyName.trim(),
    category: category.trim(),
    phone: phone.trim(),
    email: email.trim(),
    address: address.trim(),
    licenseImage: licenseImage.trim(),
    businessScope: businessScope.trim(),
  }

  if (existing?.paymentStatus === 'COMPLETED' && existing.status === 'REJECTED') {
    const merchant = await prisma.merchant.update({
      where: { id: existing.id },
      data: {
        ...payload,
        status: 'PENDING',
        submittedAt: new Date(),
      },
    })
    return NextResponse.json({ success: true, merchant, reviewOnly: true })
  }

  const merchant = existing
    ? await prisma.merchant.update({
        where: { id: existing.id },
        data: {
          ...payload,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
          paidAt: null,
          submittedAt: null,
          stripeSessionId: null,
        },
      })
    : await prisma.merchant.create({
        data: {
          userId,
          ...payload,
          status: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
        },
      })

  return NextResponse.json({ success: true, merchant })
}
