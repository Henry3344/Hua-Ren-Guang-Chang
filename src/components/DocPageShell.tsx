'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'
import DocToc, { type DocTocItem } from '@/components/DocToc'

/**
 * 静态内容页（关于我们 / 免责声明 / 隐私声明 / 信用分说明 / 广告合作 等）
 * 的统一布局：
 *
 * - `md+` 屏幕：左侧显示 sticky 的「本页目录」侧栏，正文在右；
 * - `sm` 屏幕：目录折叠在正文上方，点击后展开；点击条目会自动收起。
 *
 * 调用方只需传入 `toc` 列表与 `children`（正文 `<article>`），由本组件负责
 * 顶部返回按钮、整体容器宽度（`max-w-5xl`）、内外边距与两栏布局。
 */
export default function DocPageShell({
  toc,
  backFallbackHref,
  children,
}: {
  toc: readonly DocTocItem[]
  backFallbackHref?: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="page-shell-tight pt-10 sm:pt-12">
      <BackToPrev className="mb-6" fallbackHref={backFallbackHref} />

      <div className="md:flex md:gap-8 lg:gap-12">
        {/* ---------- 桌面端 sticky 目录 ---------- */}
        {/*
          注意：sticky 生效的前提是「所在的滚动容器比 sticky 元素高」。
          这里让 <aside> 本身成为 sticky，它作为 flex 子项会默认 stretch 到
          与正文等高，使外层 flex 容器成为 sticky 的定位参考框；这样用户
          向下滚动时，目录会始终贴在视口顶部（top-20 预留给站内 header）。
          原来包了一层 div 再 sticky、加上 `items-start` 会让 aside 高度被
          压缩到目录自身高度，sticky 永远没有滚动区间，视觉上就不动了。
        */}
        <aside className="hidden md:block md:w-52 lg:w-60 md:shrink-0 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-1">
          <DocToc items={toc} />
        </aside>

        <div className="flex-1 min-w-0">
          {/* ---------- 移动端折叠目录 ---------- */}
          <div className="panel-card mb-6 md:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-foreground"
              aria-expanded={mobileOpen}
            >
              <span>本页目录（{toc.length} 项）</span>
              <ChevronDown
                className={
                  'w-4 h-4 transition-transform ' + (mobileOpen ? 'rotate-180' : '')
                }
              />
            </button>
            {mobileOpen && (
              <div className="border-t px-4 py-3">
                <DocToc items={toc} onNavigate={() => setMobileOpen(false)} />
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
