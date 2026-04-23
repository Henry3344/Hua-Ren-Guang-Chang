import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizeUsername, validateUsername } from '@/lib/account'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const rawUsername = searchParams.get('username') || ''
  const username = normalizeUsername(rawUsername)

  const error = validateUsername(username)
  if (error) {
    return NextResponse.json({
      available: false,
      normalized: username,
      error,
    })
  }

  const existing = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  })

  return NextResponse.json({
    available: !existing,
    normalized: username,
    error: existing ? '该账号已被占用' : null,
  })
}
