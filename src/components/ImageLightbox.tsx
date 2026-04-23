'use client'
import { useEffect, useState, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  images: string[]
  initialIndex?: number
  onClose: () => void
}

export default function ImageLightbox({ images, initialIndex = 0, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex)

  const prev = useCallback(() => setCurrent(i => (i - 1 + images.length) % images.length), [images.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % images.length), [images.length])

  useEffect(() => {
    const timer = images.length > 1 ? setInterval(next, 5000) : null
    return () => { if (timer) clearInterval(timer) }
  }, [next, images.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose, prev, next])

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onClick={onClose}>
      <button onClick={onClose}
        className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div className="relative max-w-4xl w-full px-12" onClick={e => e.stopPropagation()}>
        <img src={images[current]} alt=""
          className="w-full max-h-[80vh] object-contain rounded-lg" />

        {images.length > 1 && (
          <>
            <button onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors">
              <ChevronRight className="w-8 h-8" />
            </button>
            <div className="flex justify-center gap-2 mt-4">
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className={'w-2 h-2 rounded-full transition-all ' + (i === current ? 'bg-white scale-125' : 'bg-white/40')} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-4 text-white/50 text-sm">
        {current + 1} / {images.length} · 点击空白处关闭 · ESC 退出
      </div>
    </div>
  )
}
