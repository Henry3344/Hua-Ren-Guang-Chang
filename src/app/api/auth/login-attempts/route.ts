import { NextResponse } from 'next/server'
import { getLoginAttempts } from '@/lib/rateLimit'
import { normalizeLoginIdentifier } from '@/lib/account'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const identifier = searchParams.get('identifier') || searchParams.get('email') || ''
  const attempts = getLoginAttempts(normalizeLoginIdentifier(identifier))
  return NextResponse.json({ attempts })
}
