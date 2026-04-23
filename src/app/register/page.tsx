'use client'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, ImagePlus } from 'lucide-react'
import dynamic from 'next/dynamic'
import UserAvatar from '@/components/UserAvatar'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import { normalizeUsername, validateEmail, validateUsername } from '@/lib/account'

const TurnstileWidget = dynamic(() => import('@/components/TurnstileWidget'), { ssr: false })

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}

function RegisterContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', confirm: '', inviteCode: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [usernameAvailability, setUsernameAvailability] = useState<{
    state: 'idle' | 'checking' | 'available' | 'taken' | 'error'
    message: string
  }>({ state: 'idle', message: '' })

  const inviteFromUrl = useMemo(() => (searchParams.get('invite') || '').trim(), [searchParams])
  const inviteLocked = Boolean(inviteFromUrl)
  const usernameFormatError = useMemo(() => {
    const rawUsername = form.username.trim()
    if (!rawUsername) return ''
    return validateUsername(rawUsername) || ''
  }, [form.username])

  const usernameStatus = useMemo(() => {
    const rawUsername = form.username.trim()
    if (!rawUsername) return { state: 'idle' as const, message: '' }
    if (usernameFormatError) return { state: 'invalid' as const, message: usernameFormatError }
    return usernameAvailability
  }, [form.username, usernameAvailability, usernameFormatError])

  const isDirty = useMemo(() => {
    if (step !== 1) return true
    if (form.name.trim() || form.email.trim() || form.username.trim() || form.password || form.confirm) return true
    if (avatarFile || avatarPreview) return true
    if (agreed) return true
    if (turnstileToken) return true
    if (inviteLocked && form.inviteCode !== inviteFromUrl) return true
    if (!inviteLocked && form.inviteCode.trim()) return true
    return false
  }, [step, form, avatarFile, avatarPreview, agreed, turnstileToken, inviteLocked, inviteFromUrl])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开注册页面，已填写内容将不会保留，确认离开吗？',
  })

  useEffect(() => {
    if (!inviteFromUrl) return
    queueMicrotask(() =>
      setForm((f) => (f.inviteCode ? f : { ...f, inviteCode: inviteFromUrl })),
    )
  }, [inviteFromUrl])

  useEffect(() => {
    const rawUsername = form.username.trim()
    if (!rawUsername || usernameFormatError) return

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setUsernameAvailability({ state: 'checking', message: '正在检查账号是否可用...' })
      try {
        const res = await fetch(
          '/api/auth/username-availability?username=' + encodeURIComponent(rawUsername),
          { signal: controller.signal },
        )
        const data = (await res.json()) as {
          available?: boolean
          error?: string | null
          normalized?: string
        }

        if (data.normalized && data.normalized !== form.username) {
          setForm((prev) =>
            prev.username === rawUsername ? { ...prev, username: data.normalized || rawUsername } : prev,
          )
        }

        if (data.available) {
          setUsernameAvailability({ state: 'available', message: '该账号可以使用' })
          return
        }

        setUsernameAvailability({
          state: data.error ? 'taken' : 'error',
          message: data.error || '该账号暂不可用',
        })
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setUsernameAvailability({ state: 'error', message: '账号校验失败，请稍后重试' })
      }
    }, 350)

    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [form.username, usernameFormatError])

  function validateStepOne(): string | null {
    if (!form.name.trim() || !form.email.trim() || !form.username.trim() || !form.password) {
      return '请填写账号信息'
    }
    if (form.name.trim().length > 40) {
      return '昵称长度不能超过 40 个字符'
    }
    const emailError = validateEmail(form.email)
    if (emailError) return emailError
    const usernameError = validateUsername(form.username)
    if (usernameError) return usernameError
    if (usernameStatus.state === 'checking') return '账号可用性校验中，请稍候'
    if (usernameStatus.state === 'taken' || usernameStatus.state === 'invalid' || usernameStatus.state === 'error') {
      return usernameStatus.message || '请更换一个可用账号'
    }
    if (usernameStatus.state !== 'available') return '请先确认账号是否可用'
    if (form.password !== form.confirm) return '两次密码不一致'
    if (form.password.length < 6) return '密码至少6位'
    return null
  }

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(f)
    setAvatarPreview(URL.createObjectURL(f))
    setError('')
  }

  function clearAvatar() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarFile(null)
    setAvatarPreview(null)
  }

  async function submitRegister() {
    const stepOneError = validateStepOne()
    if (stepOneError) {
      setError(stepOneError)
      return
    }
    if (!agreed) {
      setError('请先勾选同意后再完成注册')
      return
    }
    if (!turnstileToken) {
      setError('请完成验证码')
      return
    }
    if (form.password !== form.confirm) {
      setError('两次密码不一致')
      return
    }
    if (form.password.length < 6) {
      setError('密码至少6位')
      return
    }
    setLoading(true)
    setError('')
    let avatarDataUrl: string | undefined
    if (avatarFile) {
      try {
        avatarDataUrl = await readDataUrl(avatarFile)
      } catch {
        setError('头像读取失败')
        setLoading(false)
        return
      }
    }
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        username: normalizeUsername(form.username),
        password: form.password,
        turnstileToken,
        avatarDataUrl,
        inviteCode: form.inviteCode || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      setError(data.error || '注册失败')
      return
    }
    router.push('/login?registered=1')
  }

  const field =
    'w-full rounded-xl border border-input/90 bg-background/90 px-3 py-2.5 text-sm shadow-sm shadow-black/5 focus:outline-none focus:ring-2 focus:ring-primary'

  return (
    <div className="page-shell-narrow flex min-h-[80vh] items-center justify-center py-8 sm:py-10">
      <div className="w-full max-w-md">
        {LeaveDialog}
        <BackToPrev className="mb-6" onBeforeNavigate={onBeforeNavigate} />
        <div className="mb-8 text-center">
          <h1 className="page-title">创建账号</h1>
          <p className="page-subtitle mx-auto mt-2 text-center">加入华人广场社区，发布信息、收藏内容并获得更完整的浏览体验。</p>
          <p className="mt-2 text-xs text-muted-foreground">
            步骤 {step}/2：{step === 1 ? '账号信息' : '头像（可选）'}
          </p>
        </div>
        <div className="panel-card-strong p-6 sm:p-8">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">昵称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={field}
                  placeholder="您的昵称"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={field}
                  placeholder="输入常用邮箱"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">邮箱将作为账号唯一标识之一，后续可用邮箱或账号登录</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">账号</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => {
                    setForm({ ...form, username: e.target.value })
                    setError('')
                  }}
                  onBlur={() => setForm((prev) => ({ ...prev, username: normalizeUsername(prev.username) }))}
                  className={field}
                  placeholder="例如：henry_88"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="username"
                  required
                />
                <p
                  className={`mt-1 text-xs ${
                    usernameStatus.state === 'available'
                      ? 'text-green-600'
                      : usernameStatus.state === 'taken' || usernameStatus.state === 'invalid'
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                  }`}
                >
                  {usernameStatus.message || '仅支持小写字母、数字、下划线，长度 4-20 位，且至少包含 1 个字母'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">密码</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className={field}
                  placeholder="至少6位"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">确认密码</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className={field}
                  placeholder="再输一次"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">邀请码（选填）</label>
                <input
                  type="text"
                  value={form.inviteCode}
                  onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
                  className={field}
                  placeholder="通过分享链接进入会自动填写"
                  disabled={inviteLocked}
                />
                {inviteLocked ? (
                  <p className="text-xs text-destructive mt-1">
                    该邀请码来自分享链接，为确保奖励正常发放，请勿手动修改。
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">没有可留空</p>
                )}
              </div>
              <div className="flex justify-center">
                <TurnstileWidget onVerify={setTurnstileToken} onExpire={() => setTurnstileToken('')} />
              </div>
              {error && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button
                type="button"
                className="w-full"
                onClick={() => {
                  setError('')
                  const stepOneError = validateStepOne()
                  if (stepOneError) {
                    setError(stepOneError)
                    return
                  }
                  if (!turnstileToken) {
                    setError('请完成验证码')
                    return
                  }
                  setStep(2)
                }}
              >
                下一步：设置头像
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <UserAvatar src={avatarPreview || undefined} name={form.name} size="lg" />
                <div className="flex flex-wrap gap-2 justify-center">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed cursor-pointer hover:bg-accent text-sm">
                    <ImagePlus className="w-4 h-4" />
                    {avatarFile ? '更换图片' : '上传头像'}
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarPick} />
                  </label>
                  {avatarFile && (
                    <Button type="button" variant="ghost" size="sm" onClick={clearAvatar}>
                      清除
                    </Button>
                  )}
                </div>
              </div>
              <div className="border rounded-xl p-4 bg-muted/30">
                <label className="flex items-start gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => {
                      setAgreed(e.target.checked)
                      if (e.target.checked) setError('')
                    }}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-primary"
                  />
                  <span className="text-muted-foreground leading-relaxed">
                    我已阅读并同意
                    <Link
                      href="/about"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium mx-1"
                    >
                      《关于我们》
                    </Link>
                    <Link
                      href="/disclaimer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium mx-1"
                    >
                      《免责声明》
                    </Link>
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium mx-1"
                    >
                      《隐私声明》
                    </Link>
                    。
                  </span>
                </label>
              </div>
              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  上一步
                </Button>
                <Button type="button" className="flex-1" disabled={loading} onClick={submitRegister}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  完成注册
                </Button>
              </div>
            </div>
          )}
          <p className="text-center text-sm text-muted-foreground mt-6">
            已有账号？
            <Link href="/login" className="text-primary hover:underline font-medium ml-1">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  )
}
