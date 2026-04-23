import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const stateText = String(body.stateText || '').trim()
  const cityText = String(body.cityText || '').trim()
  if (!stateText || !cityText) {
    return NextResponse.json({ error: '请填写州与城市' }, { status: 400 })
  }
  await prisma.locationSuggestion.create({
    data: { stateText: stateText.slice(0, 200), cityText: cityText.slice(0, 200) },
  })
  return NextResponse.json({ ok: true })
}
