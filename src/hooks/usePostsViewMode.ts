'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'postsViewMode'

export type PostsViewMode = 'card' | 'list'

function readMode(): PostsViewMode {
  if (typeof window === 'undefined') return 'card'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'list' ? 'list' : 'card'
}

function subscribe(onStoreChange: () => void) {
  const sync = () => onStoreChange()
  window.addEventListener('storage', sync)
  window.addEventListener('postsviewmode', sync)
  return () => {
    window.removeEventListener('storage', sync)
    window.removeEventListener('postsviewmode', sync)
  }
}

function getServerSnapshot(): PostsViewMode {
  return 'card'
}

/** 首页与 /posts 共用：卡片（默认）或列表（左侧小卡片） */
export function usePostsViewMode() {
  const mode = useSyncExternalStore(subscribe, readMode, getServerSnapshot)

  const setMode = useCallback((m: PostsViewMode) => {
    localStorage.setItem(STORAGE_KEY, m)
    window.dispatchEvent(new Event('postsviewmode'))
  }, [])

  return { mode, setMode }
}
