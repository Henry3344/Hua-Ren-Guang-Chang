import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || !session.user?.isAdmin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 })
  }
  const { id } = await params
  try {
    await prisma.riskExposureItem.delete({ where: { id } })
  } catch {
    return NextResponse.json({ error: '删除失败或条目不存在' }, { status: 404 })
  }
  return NextResponse.json({ ok: true })
}
