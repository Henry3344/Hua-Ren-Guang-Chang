'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const DEFAULT_TITLE = '确认离开？'
const DEFAULT_MESSAGE = '离开后将不会保存当前填写内容，确认离开吗？'

export function useUnsavedLeaveGuard(opts: {
  isDirty: boolean
  title?: string
  message?: string
}) {
  const router = useRouter()
  const { isDirty, title = DEFAULT_TITLE, message = DEFAULT_MESSAGE } = opts
  const headingId = useId()
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented) return
      if (e.button !== 0) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const el = (e.target as Element | null)?.closest?.('a[href]')
      if (!el) return
      const a = el as HTMLAnchorElement
      if (a.target === '_blank' || a.target === '_parent') return
      if (a.hasAttribute('download')) return
      const href = a.getAttribute('href')
      if (!href || href.startsWith('#')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      pendingRef.current = () => {
        router.push(url.pathname + url.search + url.hash)
      }
      setOpen(true)
    }
    document.addEventListener('click', handler, true)
    return () => document.removeEventListener('click', handler, true)
  }, [isDirty, router])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        pendingRef.current = null
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const confirmLeave = useCallback(() => {
    setOpen(false)
    const fn = pendingRef.current
    pendingRef.current = null
    fn?.()
  }, [])

  const cancelLeave = useCallback(() => {
    pendingRef.current = null
    setOpen(false)
  }, [])

  const onBeforeNavigate = useCallback(
    (proceed: () => void) => {
      if (!isDirty) {
        proceed()
        return
      }
      pendingRef.current = proceed
      setOpen(true)
    },
    [isDirty],
  )

  const LeaveDialog = open ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={headingId}
      onClick={cancelLeave}
    >
      <div
        className="bg-card rounded-xl p-6 max-w-sm w-full shadow-lg border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={headingId} className="font-semibold text-base mb-2">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={cancelLeave}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={confirmLeave}>
            确认离开
          </Button>
        </div>
      </div>
    </div>
  ) : null

  return { onBeforeNavigate, LeaveDialog }
}
