import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Edge：轻量透传 + 可选地理头（便于后续按地区做实验或 CDN 策略）。
 * 不使用 Prisma / Node-only API。
 */
export function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const country = request.headers.get('x-vercel-ip-country')
  if (country) {
    res.headers.set('x-geo-country', country)
  }
  const region = request.headers.get('x-vercel-ip-country-region')
  if (region) {
    res.headers.set('x-geo-region', region)
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
