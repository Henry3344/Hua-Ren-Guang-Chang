import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { hasHighRiskDepositKeywords } from '@/lib/highRiskKeywords'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: '帖子不存在' }, { status: 404 })

  const userId = session.user.id
  if (post.userId !== userId) return NextResponse.json({ error: '无权限' }, { status: 403 })
  if (post.status === 'DELISTED') {
    return NextResponse.json({ error: '该帖已下架，无法编辑' }, { status: 403 })
  }

  const editCount = post.editCount ?? 0
  if (editCount >= 3) {
    return NextResponse.json({ error: '该帖子已达到最大编辑次数（3次）' }, { status: 400 })
  }

  const { title, description, price, location, contact, images, jobSalaryUnit } = await req.json()
  const fullText = `${title} ${description}`
  const hasDepositRisk = hasHighRiskDepositKeywords(`${fullText}\n${String(contact ?? '')}`)
  const bumpPending = hasDepositRisk && post.status === 'ACTIVE'

  const data: Prisma.PostUpdateInput = {
    title,
    description,
    price: price ? parseFloat(price) : null,
    location,
    contact,
    images: images || [],
    editCount: editCount + 1,
    highRiskKeywords: hasDepositRisk,
    ...(bumpPending ? { status: 'PENDING' as const } : {}),
    ...(post.category === 'JOB_SEEK'
      ? {
          jobSalaryUnit:
            jobSalaryUnit === 'HOURLY' || jobSalaryUnit === 'PER_VISIT' ? jobSalaryUnit : null,
        }
      : {}),
  }

  const updated = await prisma.post.update({
    where: { id },
    data,
  })

  return NextResponse.json({ success: true, post: updated })
}
