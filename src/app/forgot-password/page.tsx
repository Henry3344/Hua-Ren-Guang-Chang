'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isDirty = useMemo(() => !done && identifier.trim() !== '', [done, identifier])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开当前页面，已填写内容将不会保留，确认离开吗？',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    setLoading(false)
    if (res.ok) { setDone(true) } else {
      const d = await res.json()
      setError(d.error || '发送失败')
    }
  }

  return (
    <div className="page-shell-narrow flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        {LeaveDialog}
        <BackToPrev className="mb-6" onBeforeNavigate={onBeforeNavigate} />
        <div className="mb-8 text-center">
          <h1 className="page-title">忘记密码</h1>
          <p className="page-subtitle mx-auto mt-2 text-center">输入注册邮箱或账号，我们会向你的邮箱发送重置链接。</p>
        </div>
        <div className="panel-card-strong p-6 sm:p-8">
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium">重置链接已发送</p>
              <p className="text-sm text-muted-foreground">请检查您的邮箱（包括垃圾邮件），链接 1 小时内有效。</p>
              <Link href="/login" className="text-sm text-primary hover:underline block mt-4">返回登录</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">邮箱或账号</label>
                <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-input/90 bg-background/90 px-3 py-2.5 text-sm shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="输入邮箱或账号" required />
              </div>
              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}发送重置链接
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">返回登录</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
