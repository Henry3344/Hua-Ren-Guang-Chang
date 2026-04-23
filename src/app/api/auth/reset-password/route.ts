import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: '参数错误' }, { status: 400 })
  if (password.length < 6) return NextResponse.json({ error: '密码至少6位' }, { status: 400 })

  const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } })
  if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
    return NextResponse.json({ error: '链接已失效，请重新申请' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashed } })
  await prisma.passwordResetToken.update({ where: { token }, data: { used: true } })

  return NextResponse.json({ success: true })
}
