'use client'
import { useState, useRef } from 'react'
import { ImagePlus, X, Loader2 } from 'lucide-react'

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  max?: number
}

export default function ImageUpload({ value, onChange, max = 3 }: Props) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (value.length + files.length > max) {
      setError('最多上传' + max + '张图片')
      return
    }
    setError('')
    setUploading(true)

    const formData = new FormData()
    files.forEach(f => formData.append('files', f))

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) { setError(data.error || '上传失败'); return }
    onChange([...value, ...data.urls])
    if (inputRef.current) inputRef.current.value = ''
  }

  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {value.map((url, i) => (
          <div key={i} className="relative group">
            <img src={url} alt="" className="w-24 h-24 object-cover rounded-lg border" />
            <button type="button" onClick={() => remove(i)}
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="w-24 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-accent transition-colors text-muted-foreground">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-xs">{uploading ? '上传中' : '添加图片'}</span>
          </button>
        )}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">最多{max}张，自动压缩，支持 JPG / PNG / WEBP</p>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
    </div>
  )
}
