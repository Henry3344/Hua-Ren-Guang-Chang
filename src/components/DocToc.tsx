'use client'

import { useCallback, useEffect, useState, type MouseEvent } from 'react'

export type DocTocItem = {
  /** DOM `id` of the target heading (must match `<h2 id=...>` in the page) */
  id: string
  /** Text to display in the table of contents */
  label: string
}

/**
 * 客户端渲染的「目录 / 快速跳转」组件：
 * - 外层布局（sticky 侧栏 / 折叠面板）由调用方控制；
 * - 本组件只负责渲染链接列表，并通过 `IntersectionObserver` 高亮当前正在阅读的章节。
 *
 * 典型用法：
 * ```tsx
 * <DocToc items={[{ id: 'sec-1', label: '一、xxx' }, ...]} />
 * ```
 */
export default function DocToc({
  items,
  onNavigate,
}: {
  items: readonly DocTocItem[]
  /** 点击某条目后回调，例如在移动端用于关闭 `<details>` 抽屉 */
  onNavigate?: () => void
}) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? '')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el))
    if (targets.length === 0) return

    // 留出顶部 sticky header 高度的缓冲，避免跳转时被遮住
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0.01 }
    )
    targets.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  /**
   * 点击目录项时：
   * - 阻止默认的 `href="#id"` 跳转（它会向浏览器 history 里塞一条 hash 记录，
   *   导致页面上的「返回上一页」按钮第一次点击只是在目录锚点之间跳，而不是
   *   真正回到上一页）；
   * - 用 `scrollIntoView` 平滑滚到目标；
   * - 用 `history.replaceState` 把 hash 写进 URL，但**不新增 history 条目**，
   *   这样 `router.back()` / 浏览器返回依然会直接回到进入本页之前的那一页。
   */
  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>, id: string) => {
      // 修饰键点击（新标签页等）保持默认行为
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      const el = typeof document !== 'undefined' ? document.getElementById(id) : null
      if (!el) return
      e.preventDefault()
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      if (typeof window !== 'undefined' && typeof window.history?.replaceState === 'function') {
        const { pathname, search } = window.location
        window.history.replaceState(window.history.state, '', `${pathname}${search}#${id}`)
      }
      onNavigate?.()
    },
    [onNavigate],
  )

  return (
    <nav aria-label="本页目录" className="text-sm">
      <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">
        本页目录
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => {
          const isActive = activeId === item.id
          return (
            <li key={item.id} className="-ml-px">
              <a
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={
                  'block border-l py-1.5 pl-3 text-[13px] leading-snug transition ' +
                  (isActive
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/40')
                }
              >
                {item.label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
