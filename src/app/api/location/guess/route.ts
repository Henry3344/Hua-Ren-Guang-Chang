import { NextResponse } from 'next/server'
import { US_STATE_CODE_TO_ZH, isSupportedStateCode, normalizeUsStateCode } from '@/lib/locationMeta'
import { labelForSelection } from '@/lib/locationMeta'
import type { LocationPref } from '@/lib/locationTypes'

/** 从反向代理 / CDN 常见头里取访客公网 IP（服务端 fetch 必须带此 IP 调 ip-api，否则会落成「服务器出口 IP」） */
function clientIpFromRequest(req: Request): string {
  const h = req.headers
  const candidates = [
    h.get('x-forwarded-for'),
    h.get('x-real-ip'),
    h.get('cf-connecting-ip'),
    h.get('true-client-ip'),
    h.get('fastly-client-ip'),
  ]
  for (const c of candidates) {
    const raw = c?.split(',')[0]?.trim()
    if (
      raw &&
      raw !== '::1' &&
      raw !== '127.0.0.1' &&
      !raw.startsWith('::ffff:127.')
    ) {
      return raw
    }
  }
  return ''
}

export async function GET(req: Request) {
  const ip = clientIpFromRequest(req)

  /** 无访客 IP 时禁止用「无参」ip-api（那会解析成 Node 服务器自己的公网 IP，全员错位） */
  if (!ip) {
    return NextResponse.json({
      ok: false,
      reason: 'no_client_ip',
      hint: '无法识别访问者 IP（常见于本地开发或未走 CDN）；请手动选择地区或点「查看全美」。',
    })
  }

  const url = `https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,countryCode,region,city`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()
    if (data.status !== 'success' || data.countryCode !== 'US') {
      return NextResponse.json({ ok: false, reason: 'not_us_or_fail' })
    }
    const code = normalizeUsStateCode(String(data.region || ''))
    const cityEn = String(data.city || '')
    if (!isSupportedStateCode(code)) {
      return NextResponse.json({
        ok: false,
        reason: 'unsupported_state',
        stateCode: code,
        cityEn,
        label: `${code} · ${cityEn || 'Unknown'}`,
      })
    }
    const stateZh = US_STATE_CODE_TO_ZH[code]
    const pref: LocationPref = {
      scope: 'state',
      stateZh,
      stateCode: code,
      cityEn: cityEn || undefined,
      label: cityEn ? `${code} · ${cityEn}` : labelForSelection({ scope: 'state', stateZh, stateCode: code }),
    }
    return NextResponse.json({
      ok: true,
      inServiceArea: true,
      stateCode: code,
      cityEn,
      stateZh,
      label: pref.label,
      pref,
    })
  } catch {
    return NextResponse.json({ ok: false, reason: 'network' })
  }
}
