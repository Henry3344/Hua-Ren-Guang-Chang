'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

const RAINBOW_SPIN =
  'conic-gradient(from 210deg, #2563eb 0deg, #7c3aed 55deg, #dc2626 115deg, #ea580c 165deg, #ca8a04 215deg, #16a34a 275deg, #0ea5e9 330deg, #2563eb 360deg)'

export default function AiAssistantFab() {
  const pathname = usePathname()
  const { status } = useSession()

  const href = useMemo(() => {
    if (status === 'authenticated') return '/ai-search'
    if (status === 'unauthenticated') {
      return `/login?callbackUrl=${encodeURIComponent('/ai-search')}`
    }
    return '/ai-search'
  }, [status])

  if (pathname === '/ai-search' || pathname.startsWith('/ai-search/')) {
    return null
  }

  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-3 z-[45] h-[3.75rem] w-[3.75rem] sm:right-4">
      {/* 旋转的圆锥彩虹环（与首页 AI 帮我找 一致） */}
      <div className="absolute inset-0 overflow-hidden rounded-full">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 animate-[spin_10s_linear_infinite] motion-reduce:animate-none"
          style={{ background: RAINBOW_SPIN, opacity: 0.95 }}
          aria-hidden
        />
      </div>
      <Link
        href={href}
        className="absolute inset-[2px] z-10 flex flex-col items-center justify-center rounded-full border border-white/10 bg-zinc-900/92 px-1 py-0.5 text-center text-amber-100 shadow-[0_8px_30px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm transition-colors hover:bg-zinc-800/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:border-zinc-700/80"
        aria-label="打开华人广场AI助手"
        title="华人广场AI助手"
      >
        <span className="text-[15px] font-bold leading-none tracking-tight">AI</span>
        <span className="mt-0.5 text-[12px] font-medium leading-none text-white/95">助手</span>
      </Link>
    </div>
  )
}
