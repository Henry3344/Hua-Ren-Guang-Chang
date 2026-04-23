'use client'
import { useMemo, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'

function ResetContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const isDirty = useMemo(
    () => !done && (password !== '' || confirm !== ''),
    [done, password, confirm],
  )

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开当前页面，已填写内容将不会保留，确认离开吗？',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('两次密码不一致'); return }
    if (password.length < 6) { setError('密码至少6位'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    })
    const d = await res.json()
    setLoading(false)
    if (res.ok) { setDone(true); setTimeout(() => router.push('/login'), 2000) }
    else setError(d.error || '重置失败')
  }

  const field =
    'w-full rounded-xl border border-input/90 bg-background/90 px-3 py-2.5 text-sm shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="page-shell-narrow flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        {LeaveDialog}
        <BackToPrev className="mb-6" onBeforeNavigate={onBeforeNavigate} />
        <div className="mb-8 text-center">
          <h1 className="page-title">重置密码</h1>
        </div>
        <div className="panel-card-strong p-6 sm:p-8">
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-medium">密码已重置</p>
              <p className="text-sm text-muted-foreground">正在跳转到登录页...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">新密码</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className={field} placeholder="至少6位" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">确认新密码</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className={field} placeholder="再输一次" required />
              </div>
              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}确认重置
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return <Suspense><ResetContent /></Suspense>
}
