import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'
import { getLoginIdentifierKind, normalizeEmail, normalizeUsername } from '@/lib/account'
import { resolveBaseUrl } from '@/lib/stripePayments'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { identifier } = await req.json()
  if (!identifier) return NextResponse.json({ error: '请输入邮箱或账号' }, { status: 400 })
  const rawIdentifier = String(identifier).trim()
  const kind = getLoginIdentifierKind(rawIdentifier)

  if (kind !== 'email' && kind !== 'username') {
    return NextResponse.json({ error: '请输入邮箱或账号' }, { status: 400 })
  }

  const user = await prisma.user.findFirst({
    where:
      kind === 'email'
        ? { email: normalizeEmail(rawIdentifier) }
        : { username: normalizeUsername(rawIdentifier) },
  })
  if (!user) return NextResponse.json({ success: true })
  const email = user.email
  if (!email) return NextResponse.json({ success: true })

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60)

  await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: user.id },
  })

  const resetUrl = resolveBaseUrl(req) + '/reset-password?token=' + token

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: '华人广场 - 重置密码',
    html: '<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">' +
      '<h2 style="color:#111">重置您的密码</h2>' +
      '<p style="color:#555">点击下方按钮重置密码，链接 1 小时内有效：</p>' +
      '<a href="' + resetUrl + '" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin:16px 0">重置密码</a>' +
      '<p style="color:#999;font-size:12px">如果您没有申请重置密码，请忽略此邮件。</p>' +
      '</div>',
  })

  return NextResponse.json({ success: true })
}
