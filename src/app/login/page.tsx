'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import { validateEmail, validateUsername } from '@/lib/account'

const TurnstileWidget = dynamic(() => import('@/components/TurnstileWidget'), { ssr: false })

function safeCallbackUrl(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const callbackUrl = safeCallbackUrl(searchParams.get('callbackUrl'))
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileKey, setTurnstileKey] = useState(0)

  const isDirty = useMemo(
    () => identifier.trim() !== '' || password !== '',
    [identifier, password],
  )

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开登录页面，已填写内容将不会保留，确认离开吗？',
  })

  useEffect(() => {
    if (identifier) {
      fetch('/api/auth/login-attempts?identifier=' + encodeURIComponent(identifier))
        .then((r) => r.json())
        .then((d) => setAttempts(d.attempts || 0))
    }
  }, [identifier])

  function validateLoginIdentifier(value: string): string | null {
    const trimmed = value.trim()
    if (!trimmed) return '请输入邮箱或账号'
    if (trimmed.includes('@')) return validateEmail(trimmed)
    return validateUsername(trimmed)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const identifierError = validateLoginIdentifier(identifier)
    if (identifierError) {
      setError(identifierError)
      return
    }
    if (!turnstileToken) {
      setError('请完成验证码')
      return
    }
    setLoading(true)
    setError('')
    const res = await signIn('credentials', { identifier, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setError('邮箱/账号或密码错误')
      setTurnstileToken('')
      setTurnstileKey((k) => k + 1)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const field =
    'w-full rounded-xl border border-input/90 bg-background/90 px-3 py-2.5 text-sm shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="page-shell-narrow flex min-h-[80vh] items-center justify-center py-10">
      <div className="w-full max-w-md">
        {LeaveDialog}
        <BackToPrev className="mb-6" onBeforeNavigate={onBeforeNavigate} />
        <div className="mb-8 text-center">
          <h1 className="page-title">欢迎回来</h1>
          <p className="page-subtitle mx-auto mt-2 text-center">登录您的华人广场账号，继续查看帖子、发布信息和使用 AI 搜索。</p>
        </div>
        {registered && (
          <div className="info-banner mb-4 border-green-200 bg-green-50 text-green-700">
            注册成功！请登录。
          </div>
        )}
        <div className="panel-card-strong p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">邮箱或账号</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={field}
                placeholder="输入邮箱或账号"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">支持邮箱或注册时设置的账号登录</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={field}
                placeholder="••••••••"
                required
              />
              {attempts >= 3 && (
                <p className="mt-2 rounded-xl bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
                  多次输入错误？
                  <Link href="/forgot-password" className="font-medium underline ml-1">
                    点击重置密码
                  </Link>
                </p>
              )}
            </div>
            <div className="flex justify-center">
              <TurnstileWidget
                onVerify={setTurnstileToken}
                onExpire={() => setTurnstileToken('')}
                resetKey={turnstileKey}
              />
            </div>
            {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || !turnstileToken}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              登录
            </Button>
          </form>
          <div className="flex items-center justify-between mt-4 text-sm">
            <Link href="/forgot-password" className="text-muted-foreground hover:text-foreground">
              忘记密码？
            </Link>
            <span className="text-muted-foreground">
              还没有账号？
              <Link href="/register" className="text-primary hover:underline ml-1 font-medium">
                立即注册
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
