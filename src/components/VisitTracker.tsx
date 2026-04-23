'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** 站内路由切换时上报一次；管理后台不计入，减轻噪声 */
export default function VisitTracker() {
  const pathname = usePathname()
  const skip =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')

  useEffect(() => {
    if (skip) return
    void fetch('/api/telemetry/visit', {
      method: 'POST',
      credentials: 'include',
      keepalive: true,
    }).catch(() => {})
  }, [pathname, skip])

  return null
}
