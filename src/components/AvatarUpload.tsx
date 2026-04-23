'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2 } from 'lucide-react'

type Props = {
  disabled?: boolean
  onUploaded: (url: string, publicId: string) => void
}

export default function AvatarUpload({ disabled, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr('')
    setBusy(true)
    const fd = new FormData()
    fd.append('files', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
    if (!res.ok) {
      setErr(data.error || '上传失败')
      return
    }
    const url = data.urls?.[0]
    const pid = data.publicIds?.[0]
    if (!url || !pid) {
      setErr('上传失败')
      return
    }
    onUploaded(url, pid)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed text-sm hover:bg-accent disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
        {busy ? '上传中…' : '选择图片'}
      </button>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <p className="text-xs text-muted-foreground">与发帖图片相同云端存储，更换头像后会覆盖旧图。</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
      />
    </div>
  )
}
