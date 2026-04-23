'use client'

import dynamic from 'next/dynamic'

const HomeCategoryCards = dynamic(() => import('@/components/HomeCategoryCards'), {
  ssr: false,
  loading: () => (
    <div className="w-full" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 border bg-muted/30 animate-pulse min-h-[140px] sm:min-h-[160px]" />
        ))}
      </div>
    </div>
  ),
})

export default function HomeCategoryCardsLazy() {
  return <HomeCategoryCards />
}
