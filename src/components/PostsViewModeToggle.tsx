'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PostsViewMode } from '@/hooks/usePostsViewMode'

type Props = {
  mode: PostsViewMode
  onChange: (m: PostsViewMode) => void
  className?: string
}

export default function PostsViewModeToggle({ mode, onChange, className = '' }: Props) {
  return (
    <div
      className={'inline-flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5 ' + className}
      role="group"
      aria-label="显示方式"
    >
      <Button
        type="button"
        variant={mode === 'card' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 px-2.5 gap-1.5 shrink-0"
        onClick={() => onChange('card')}
        aria-pressed={mode === 'card'}
        title="卡片"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-medium">卡片</span>
      </Button>
      <Button
        type="button"
        variant={mode === 'list' ? 'default' : 'ghost'}
        size="sm"
        className="h-8 px-2.5 gap-1.5 shrink-0"
        onClick={() => onChange('list')}
        aria-pressed={mode === 'list'}
        title="列表"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline text-xs font-medium">列表</span>
      </Button>
    </div>
  )
}
