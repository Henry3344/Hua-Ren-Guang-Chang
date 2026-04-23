'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function BackToPrev({
  className = '',
  fallbackHref = '/',
  onBeforeNavigate,
}: {
  className?: string
  fallbackHref?: string
  /** 若提供，由调用方决定是否执行 proceed()（例如先弹窗确认再离开） */
  onBeforeNavigate?: (proceed: () => void) => void
}) {
  const router = useRouter()

  const onClick = useCallback(() => {
    const navigate = () => {
      // history.length includes current page; <= 1 usually means no meaningful back.
      if (typeof window !== 'undefined' && window.history.length > 1) {
        router.back()
        return
      }
      router.push(fallbackHref)
    }
    if (onBeforeNavigate) {
      onBeforeNavigate(navigate)
      return
    }
    navigate()
  }, [router, fallbackHref, onBeforeNavigate])

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/85 px-3 py-1.5 text-sm text-muted-foreground shadow-sm shadow-black/5 backdrop-blur-sm hover:border-border hover:bg-accent/70 hover:text-foreground ' +
        className
      }
      aria-label="返回上一页"
    >
      <ArrowLeft className="w-4 h-4" />
      返回上一页
    </button>
  )
}

