'use client'

import { useEffect, useState } from 'react'
import { Megaphone, ShieldAlert } from 'lucide-react'

type RiskItem = { id: string; text: string }

function RiskExposureCarousel({ items }: { items: RiskItem[] }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (items.length <= 1) return
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % items.length)
    }, 4500)
    return () => window.clearInterval(t)
  }, [items.length])

  const safeIdx = items.length > 0 ? idx % items.length : 0
  const cur = items[safeIdx]
  if (!cur) return null

  return (
    <div className="flex items-center gap-1.5 min-w-0 justify-end w-full">
      <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-destructive" aria-hidden />
      <p
        key={cur.id + idx}
        className="text-[11px] leading-tight text-destructive font-semibold truncate text-right"
        title={cur.text}
      >
        {cur.text}
      </p>
    </div>
  )
}

export default function GlobalAnnouncement() {
  const [lines, setLines] = useState<string[]>([])
  const [enabled, setEnabled] = useState(false)
  const [riskItems, setRiskItems] = useState<RiskItem[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/announcement').then((r) => r.json()),
      fetch('/api/risk-exposure').then((r) => r.json()),
    ])
      .then(([a, r]) => {
        setEnabled(!!a.enabled)
        setLines(Array.isArray(a.lines) ? a.lines : [])
        setRiskItems(Array.isArray(r.items) ? r.items : [])
      })
      .catch(() => {
        setEnabled(false)
        setLines([])
        setRiskItems([])
      })
  }, [])

  const hasAnn = enabled && lines.length > 0
  const hasRisk = riskItems.length > 0
  if (!hasAnn && !hasRisk) return null

  return (
    <div className="border-t border-b bg-gradient-to-r from-muted/30 via-muted/15 to-muted/30">
      <div className="max-w-6xl mx-auto px-safe min-h-7 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-0 py-0.5 sm:py-0">
        {hasAnn && (
          <div
            className={
              'text-[11px] text-muted-foreground flex items-center gap-5 overflow-x-auto whitespace-nowrap min-w-0 ' +
              (hasRisk ? 'sm:flex-1 sm:pr-3' : 'w-full')
            }
          >
            {lines.map((t, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 shrink-0">
                <Megaphone className="w-3.5 h-3.5 text-primary/70" aria-hidden />
                {t}
              </span>
            ))}
          </div>
        )}
        {hasRisk && (
          <div
            className={
              'flex items-center min-h-7 min-w-0 ' +
              (hasAnn
                ? 'sm:shrink-0 sm:max-w-[min(46vw,24rem)] sm:border-l sm:border-border/60 sm:pl-4 sm:self-stretch'
                : 'w-full flex-1')
            }
          >
            <RiskExposureCarousel items={riskItems} />
          </div>
        )}
      </div>
    </div>
  )
}
