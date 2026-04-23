import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id as string | undefined

  const { type, message, contact } = await req.json().catch(() => ({}))
  if (!message || typeof message !== 'string' || message.trim().length < 3) {
    return NextResponse.json({ error: '请填写反馈内容' }, { status: 400 })
  }

  const fb = await prisma.feedback.create({
    data: {
      userId: userId || null,
      type: typeof type === 'string' && type ? type : 'FEATURE',
      message: message.trim(),
      contact: typeof contact === 'string' && contact ? contact.trim() : null,
    },
  })

  return NextResponse.json({ ok: true, feedback: { id: fb.id } })
}

