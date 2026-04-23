import type { Metadata } from 'next'
import { Suspense } from 'react'
import AiSearchChatClient from './AiSearchChatClient'

export const metadata: Metadata = {
  title: '华人广场AI助手',
  robots: { index: false, follow: false },
}

export default function AiSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell flex min-h-[calc(100dvh-3.5rem)] items-center justify-center">
          <div className="panel-subtle px-6 py-10 text-muted-foreground">加载中…</div>
        </div>
      }
    >
      <AiSearchChatClient />
    </Suspense>
  )
}
