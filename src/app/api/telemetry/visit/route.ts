import { NextResponse } from 'next/server'
import { createHash, randomUUID } from 'crypto'
import { cookies, headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { floorUtcHour } from '@/lib/visitorAnalytics'

const BOT =
  /bot|crawl|spider|slurp|bingpreview|facebookexternal|embedly|monitor|scanner|whatsapp|telegram/i

export async function POST() {
  const jar = await cookies()
  let vid = jar.get('hv_vid')?.value
  const hadCookie = Boolean(vid && vid.length >= 16)
  if (!hadCookie) {
    vid = randomUUID()
  }

  const h = await headers()
  const ua = h.get('user-agent') || ''
  if (BOT.test(ua)) {
    return new NextResponse(null, { status: 204 })
  }

  const salt = process.env.VISITOR_STATS_SALT || 'classifieds-visitor-v1'
  const visitorHash = createHash('sha256').update(`${salt}:${vid}`).digest('hex')
  const hourSlot = floorUtcHour(new Date())

  try {
    await prisma.visitorHourMark.upsert({
      where: {
        visitorHash_hourSlot: { visitorHash, hourSlot },
      },
      create: { visitorHash, hourSlot },
      update: {},
    })
  } catch {
    // ignore db errors — 不影响浏览
  }

  const res = new NextResponse(null, { status: 204 })
  if (!hadCookie && vid) {
    res.cookies.set('hv_vid', vid, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 400 * 24 * 60 * 60,
      secure: process.env.NODE_ENV === 'production',
    })
  }
  return res
}
