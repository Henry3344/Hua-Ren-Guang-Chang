import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  const { id } = await params
  const { isDelisted } = await req.json().catch(() => ({}))
  const merchant = await prisma.merchant.update({
    where: { id },
    data: { isDelisted: !!isDelisted },
  })
  return NextResponse.json({ success: true, merchant })
}

