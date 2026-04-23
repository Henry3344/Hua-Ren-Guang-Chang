import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { verifyTurnstile } from '@/lib/turnstile'
import { checkIpLimit } from '@/lib/rateLimit'
import cloudinary from '@/lib/cloudinary'
import { normalizeEmail, normalizeUsername, validateEmail, validateUsername } from '@/lib/account'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown'

  if (!checkIpLimit(ip, 3600000, 5)) {
    return NextResponse.json({ error: '操作次数过多，请稍候再试。' }, { status: 429 })
  }

  const { name, email, username, password, turnstileToken, avatarDataUrl, inviteCode } = await req.json()

  const valid = await verifyTurnstile(turnstileToken)
  if (!valid) return NextResponse.json({ error: '验证码无效，请重试' }, { status: 400 })

  if (!email || !username || !password || !name) {
    return NextResponse.json({ error: '请填写所有字段' }, { status: 400 })
  }

  const nameText = String(name).trim()
  const emailText = normalizeEmail(String(email))
  const usernameText = normalizeUsername(String(username))

  if (!nameText) {
    return NextResponse.json({ error: '请填写昵称' }, { status: 400 })
  }
  if (nameText.length > 40) {
    return NextResponse.json({ error: '昵称长度不能超过 40 个字符' }, { status: 400 })
  }

  const emailError = validateEmail(emailText)
  if (emailError) {
    return NextResponse.json({ error: emailError }, { status: 400 })
  }

  const usernameError = validateUsername(usernameText)
  if (usernameError) {
    return NextResponse.json({ error: usernameError }, { status: 400 })
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailText }, { username: usernameText }],
    },
    select: { email: true, username: true },
  })
  if (existing) {
    if (existing.email === emailText) {
      return NextResponse.json({ error: '该邮箱已注册' }, { status: 400 })
    }
    return NextResponse.json({ error: '该账号已被占用' }, { status: 400 })
  }

  let avatar: string | undefined
  let avatarPublicId: string | undefined
  if (
    avatarDataUrl &&
    typeof avatarDataUrl === 'string' &&
    avatarDataUrl.startsWith('data:image/')
  ) {
    if (avatarDataUrl.length > 6_000_000) {
      return NextResponse.json({ error: '头像数据过大' }, { status: 400 })
    }
    const result = await cloudinary.uploader.upload(avatarDataUrl, {
      folder: 'classifieds',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })
    avatar = result.secure_url
    avatarPublicId = result.public_id
  }

  const hashed = await bcrypt.hash(password, 12)

  let invitedById: string | undefined
  const inviteCodeNorm =
    typeof inviteCode === 'string' ? inviteCode.trim().toLowerCase() : ''
  if (inviteCodeNorm) {
    const inviter = await prisma.user.findUnique({
      where: { inviteCode: inviteCodeNorm },
      select: { id: true, isDeleted: true, isBanned: true },
    })
    if (!inviter || inviter.isDeleted || inviter.isBanned) {
      return NextResponse.json({ error: '邀请码无效' }, { status: 400 })
    }
    invitedById = inviter.id
  }

  const user = await prisma.user.create({
    data: {
      name: nameText,
      email: emailText,
      username: usernameText,
      password: hashed,
      avatar,
      avatarPublicId,
      invitedById,
    },
  })
  return NextResponse.json({ success: true, userId: user.id })
}
