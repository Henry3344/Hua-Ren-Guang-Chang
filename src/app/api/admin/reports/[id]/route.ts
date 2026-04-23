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
  const rep = await prisma.report.findUnique({ where: { id } })
  if (!rep) {
    return NextResponse.json({ error: '记录不存在' }, { status: 404 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.delete({ where: { id } })
    const remaining = await tx.report.count({ where: { postId: rep.postId } })
    if (remaining === 0) {
      await tx.post.update({
        where: { id: rep.postId },
        data: { isFlagged: false },
      })
    }
  })

  return NextResponse.json({ success: true })
}
