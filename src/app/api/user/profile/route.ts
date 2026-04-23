import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import cloudinary from '@/lib/cloudinary'
import { canChangeAfter } from '@/lib/profileCooldown'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const userId = session.user.id
  if (!userId) return NextResponse.json({ error: '无效会话' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const nameRaw = body.name !== undefined ? String(body.name).trim() : undefined
  const avatar = body.avatar !== undefined ? String(body.avatar).trim() || null : undefined
  const avatarPublicIdIn = body.avatarPublicId !== undefined ? String(body.avatarPublicId).trim() || null : undefined

  if (nameRaw === undefined && avatar === undefined) {
    return NextResponse.json({ error: '无更新内容' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      avatar: true,
      avatarPublicId: true,
      lastNameChangeAt: true,
      lastAvatarChangeAt: true,
    },
  })
  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })

  const data: Prisma.UserUpdateInput = {}

  if (nameRaw !== undefined) {
    if (nameRaw.length < 1 || nameRaw.length > 40) {
      return NextResponse.json({ error: '昵称长度为 1–40 个字符' }, { status: 400 })
    }
    if (nameRaw !== (user.name || '')) {
      if (!canChangeAfter(user.lastNameChangeAt)) {
        return NextResponse.json({ error: '改名每 30 天仅能进行一次，请稍后再试' }, { status: 429 })
      }
      data.name = nameRaw
      data.lastNameChangeAt = new Date()
    }
  }

  if (avatar !== undefined) {
    const prev = user.avatar || null
    const next = avatar
    if (next !== prev) {
      if (prev) {
        if (!canChangeAfter(user.lastAvatarChangeAt)) {
          return NextResponse.json({ error: '更换头像每 30 天仅能进行一次，请稍后再试' }, { status: 429 })
        }
        if (user.avatarPublicId) {
          try {
            await cloudinary.uploader.destroy(user.avatarPublicId)
          } catch {
            // ignore
          }
        }
      }
      data.avatar = next
      data.avatarPublicId = next ? avatarPublicIdIn ?? null : null
      data.lastAvatarChangeAt = new Date()
    }
  }

  if (Object.keys(data).length === 0) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatar: true },
    })
    return NextResponse.json({ ok: true, user: u })
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, avatar: true, avatarPublicId: true, lastNameChangeAt: true, lastAvatarChangeAt: true },
  })

  return NextResponse.json({ ok: true, user: updated })
}
