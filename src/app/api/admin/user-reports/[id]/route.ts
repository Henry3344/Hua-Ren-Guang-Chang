import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || !(session.user as { isAdmin?: boolean }).isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }

  const { id } = await params
  const rep = await prisma.userReport.findUnique({ where: { id } })
  if (!rep) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 })
  }

  await prisma.userReport.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
