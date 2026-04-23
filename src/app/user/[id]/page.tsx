'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import UserAvatar from '@/components/UserAvatar'
import BackToPrev from '@/components/BackToPrev'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Calendar,
  Package,
  ShoppingBag,
  Flag,
  Ban,
  UserPlus,
  UserCheck,
  Users,
  Trash2,
  Pencil,
  X,
} from 'lucide-react'
import { creditScoreColor, creditScoreLabel } from '@/lib/creditScore'
import { REPORT_REASONS } from '@/lib/reportReasons'

const DELETE_REASONS = ['不想使用了', '信息不准确', '隐私原因', '其他']

type PublicUser = Record<string, unknown> & {
  id: string
  name?: string | null
  username?: string | null
  avatar?: string | null
  creditScore?: number | null
  isDeleted?: boolean
  isBanned?: boolean
  level?: number
  isVerifiedMerchant?: boolean
  createdAt?: string | Date
  publishedCount?: number
  completedCount?: number
  isFollowing?: boolean
}

type UserProfilePayload = {
  user: PublicUser
}

type BlockListRow = {
  id: string
  blocked: {
    id: string
    name?: string | null
    email?: string | null
    phone?: string | null
    avatar?: string | null
  }
}

export default function UserProfilePage() {
  const params = useParams()
  const rawId = params?.id
  const id = typeof rawId === 'string' ? rawId : Array.isArray(rawId) ? rawId[0] : ''
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const me = session?.user?.id
  const isSelf = me === id
  const [data, setData] = useState<UserProfilePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>(REPORT_REASONS[0])
  const [reportDetail, setReportDetail] = useState('')
  const [reportContact, setReportContact] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportOutcome, setReportOutcome] = useState<'idle' | 'ok' | 'err'>('idle')
  const [reportErr, setReportErr] = useState('')

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [delReason, setDelReason] = useState(DELETE_REASONS[0])
  const [delDetail, setDelDetail] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [blockedLoading, setBlockedLoading] = useState(false)
  const [blocked, setBlocked] = useState<BlockListRow[]>([])

  const [draftName, setDraftName] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [followBusy, setFollowBusy] = useState(false)
  const [followConfirmOpen, setFollowConfirmOpen] = useState(false)
  const [blockConfirmOpen, setBlockConfirmOpen] = useState(false)
  const [blockBusy, setBlockBusy] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const COOLDOWN_HINT = '每30天才可修改头像及昵称一次。'
  const CONFIRM_EDIT = '确认提交？（每 30 天仅限一次）'

  const loadUser = useCallback(async () => {
    if (!id) {
      setLoading(false)
      setErr('无效的用户链接')
      setData(null)
      return
    }
    setLoading(true)
    setErr('')
    try {
      const r = await fetch('/api/user/' + encodeURIComponent(id), { cache: 'no-store' })
      let d: { error?: string; user?: PublicUser } = {}
      try {
        d = await r.json()
      } catch {
        setErr('服务器响应异常，请稍后重试')
        setData(null)
        return
      }
      if (!r.ok) {
        setErr(d.error || '加载失败')
        setData(null)
        return
      }
      if (!d.user) {
        setErr('资料格式错误')
        setData(null)
        return
      }
      setData(d as UserProfilePayload)
      if (d.user?.name !== undefined) setDraftName(String(d.user.name || ''))
    } catch {
      setErr('网络异常，请稍后重试')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadUser()
  }, [loadUser])

  async function loadBlocked() {
    if (!isSelf) return
    setBlockedLoading(true)
    try {
      const r = await fetch('/api/user/block')
      const d = await r.json().catch(() => ({}))
      if (r.ok) setBlocked((Array.isArray(d.blocks) ? d.blocks : []) as BlockListRow[])
    } finally {
      setBlockedLoading(false)
    }
  }

  useEffect(() => {
    if (isSelf) loadBlocked()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelf])

  async function saveName() {
    if (!confirm(CONFIRM_EDIT)) return
    setProfileBusy(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: draftName.trim() }),
    })
    const t = await res.json().catch(() => ({}))
    setProfileBusy(false)
    if (!res.ok) {
      alert(t.error || '保存失败')
      return
    }
    await loadUser()
    await update?.()
    setEditingName(false)
  }

  async function uploadAvatarThenSave(url: string, publicId: string) {
    setProfileBusy(true)
    const res = await fetch('/api/user/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar: url, avatarPublicId: publicId }),
    })
    const t = await res.json().catch(() => ({}))
    setProfileBusy(false)
    if (!res.ok) {
      alert(t.error || '保存失败')
      return
    }
    await loadUser()
    await update?.()
  }

  async function handleAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (e.target) e.target.value = ''
    if (!file || !isSelf) return
    const uu = data?.user as { canChangeAvatar?: boolean } | undefined
    if (uu?.canChangeAvatar === false) return
    if (!confirm(CONFIRM_EDIT)) return
    setProfileBusy(true)
    const fd = new FormData()
    fd.append('files', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const t = await res.json().catch(() => ({}))
    setProfileBusy(false)
    if (!res.ok) {
      alert(t.error || '上传失败')
      return
    }
    const url = t.urls?.[0]
    const pid = t.publicIds?.[0]
    if (!url || !pid) {
      alert('上传失败')
      return
    }
    await uploadAvatarThenSave(url, pid)
  }

  async function submitReport() {
    setReportLoading(true)
    setReportOutcome('idle')
    setReportErr('')
    try {
      const res = await fetch('/api/user/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportedUserId: id,
          reason: reportReason,
          details: reportDetail,
          contactPhone: reportContact,
        }),
      })
      const t = await res.json().catch(() => ({}))
      if (!res.ok) {
        setReportOutcome('err')
        setReportErr(typeof t.error === 'string' ? t.error : '提交失败')
        return
      }
      setReportOutcome('ok')
    } catch {
      setReportOutcome('err')
      setReportErr('网络异常，请稍后重试')
    } finally {
      setReportLoading(false)
    }
  }

  function openReportModal() {
    setReportReason(REPORT_REASONS[0])
    setReportDetail('')
    setReportContact('')
    setReportOutcome('idle')
    setReportErr('')
    setReportOpen(true)
  }

  function onFollowButtonClick() {
    if (!session || !id || isSelf) return
    const uu = data?.user as { isFollowing?: boolean }
    if (uu?.isFollowing) {
      void executeUnfollow()
      return
    }
    setFollowConfirmOpen(true)
  }

  async function executeFollow() {
    if (!session || !id || isSelf) return
    setFollowBusy(true)
    try {
      const res = await fetch('/api/user/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingUserId: id }),
      })
      const t = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof t.error === 'string' ? t.error : '操作失败')
        return
      }
      setData((prev: UserProfilePayload | null) =>
        prev?.user ? { ...prev, user: { ...prev.user, isFollowing: true } } : prev
      )
      setFollowConfirmOpen(false)
    } finally {
      setFollowBusy(false)
    }
  }

  async function executeUnfollow() {
    if (!session || !id || isSelf) return
    setFollowBusy(true)
    try {
      const res = await fetch('/api/user/follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingUserId: id }),
      })
      const t = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(typeof t.error === 'string' ? t.error : '操作失败')
        return
      }
      setData((prev: UserProfilePayload | null) =>
        prev?.user ? { ...prev, user: { ...prev.user, isFollowing: false } } : prev
      )
    } finally {
      setFollowBusy(false)
    }
  }

  async function executeBlock() {
    if (!id) {
      alert('用户不存在')
      return
    }
    setBlockBusy(true)
    try {
      const res = await fetch('/api/user/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedUserId: id }),
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        alert(t.error || '操作失败')
        return
      }
      setBlockConfirmOpen(false)
      router.push('/posts')
    } finally {
      setBlockBusy(false)
    }
  }

  async function unblock(blockedUserId: string) {
    if (!confirm('确认取消拉黑？')) return
    const r = await fetch('/api/user/block', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockedUserId }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) {
      alert(d.error || '操作失败')
      return
    }
    await loadBlocked()
  }

  async function submitDelete() {
    if (!confirm('确认删除吗？你账号的所有内容都会消失')) return
    setDeleteLoading(true)
    const res = await fetch('/api/user/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: delReason, detail: delDetail }),
    })
    setDeleteLoading(false)
    if (!res.ok) {
      const t = await res.json().catch(() => ({}))
      alert(t.error || '删除失败')
      return
    }
    await signOut({ callbackUrl: '/' })
  }

  if (status === 'loading' || loading) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        加载中...
      </div>
    )
  }

  if (err || !data?.user) {
    return (
      <div className="max-w-md mx-auto px-safe py-20 text-center text-muted-foreground">
        {err || '用户不存在'}
      </div>
    )
  }

  const u = data.user
  if (u.isDeleted) {
    return (
      <div className="max-w-md mx-auto px-safe py-20 text-center">
        <p className="text-muted-foreground">该账号已注销</p>
      </div>
    )
  }

  const credit = Math.max(0, u.creditScore ?? 0)

  const su = u as {
    canChangeName?: boolean
    canChangeAvatar?: boolean
    nextNameChangeAt?: string
    nextAvatarChangeAt?: string
  }
  const canChangeName = su.canChangeName !== false
  const canChangeAvatar = su.canChangeAvatar !== false

  return (
    <div className="max-w-lg mx-auto px-safe py-8">
      <BackToPrev className="mb-6" />
      <div className="border rounded-xl bg-card p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <UserAvatar src={u.avatar} name={u.name} size="lg" />
            {isSelf && (
              <>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
                <button
                  type="button"
                  disabled={profileBusy || !canChangeAvatar}
                  title={
                    !canChangeAvatar && su.nextAvatarChangeAt
                      ? `下次可修改：${new Date(su.nextAvatarChangeAt).toLocaleString('zh-CN')}`
                      : undefined
                  }
                  onClick={() => {
                    if (!canChangeAvatar) return
                    avatarInputRef.current?.click()
                  }}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                  aria-label="更换头像"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {isSelf && editingName ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-1.5 text-base font-bold"
                    maxLength={40}
                    autoFocus
                  />
                  <Button type="button" size="sm" disabled={profileBusy} onClick={saveName}>
                    {profileBusy && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingName(false)
                      setDraftName(u.name || '')
                    }}
                  >
                    取消
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-bold">{u.name || '用户'}</h1>
                  {isSelf && (
                    <button
                      type="button"
                      disabled={profileBusy || !canChangeName}
                      title={
                        !canChangeName && su.nextNameChangeAt
                          ? `下次可修改：${new Date(su.nextNameChangeAt).toLocaleString('zh-CN')}`
                          : undefined
                      }
                      onClick={() => {
                        if (!canChangeName) return
                        setDraftName(u.name || '')
                        setEditingName(true)
                      }}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                      aria-label="编辑昵称"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
              {!(isSelf && editingName) && (
                <>
                  <span className="text-sm text-muted-foreground font-medium">Lv.{u.level ?? 0}</span>
                  {u.isVerifiedMerchant && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                      已认证商家
                    </Badge>
                  )}
                </>
              )}
            </div>
            {isSelf && editingName && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground font-medium">Lv.{u.level ?? 0}</span>
                {u.isVerifiedMerchant && (
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                    已认证商家
                  </Badge>
                )}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <p
                className="text-2xl sm:text-3xl font-bold tabular-nums"
                style={{ color: creditScoreColor(credit) }}
              >
                信用 {credit}{' '}
                <span className="text-lg sm:text-2xl font-semibold">{creditScoreLabel(credit)}</span>
              </p>
              <Link
                href="/credit"
                className="text-xs font-medium leading-tight hover:underline underline-offset-2"
                style={{ color: creditScoreColor(credit) }}
              >
                这个分数意味着什么？
              </Link>
            </div>
            {isSelf && (u as { username?: string | null }).username && (
              <p className="mt-2 text-sm text-muted-foreground">
                账号：<span className="font-medium text-foreground">{String((u as { username?: string | null }).username)}</span>
              </p>
            )}
            {isSelf && <p className="text-xs text-muted-foreground mt-2">{COOLDOWN_HINT}</p>}
          </div>
        </div>

        <div className="mt-6 space-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-2 py-0.5">
            <Calendar className="w-4 h-4 shrink-0" />
            注册时间：
            {u.createdAt != null
              ? new Date(u.createdAt).toLocaleDateString('zh-CN')
              : '—'}
          </p>
          <Link
            href={'/user/' + encodeURIComponent(id) + '/posts?view=published'}
            className="flex items-center gap-2 rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-muted/70 hover:text-foreground w-full sm:w-auto"
          >
            <Package className="w-4 h-4 shrink-0" />
            <span>
              已发布{' '}
              <span className="font-medium text-foreground tabular-nums">{(u as { publishedCount?: number }).publishedCount ?? 0}</span>{' '}
              条
            </span>
          </Link>
          <Link
            href={'/user/' + encodeURIComponent(id) + '/posts?view=completed'}
            className="flex items-center gap-2 rounded-lg -mx-2 px-2 py-1.5 transition-colors hover:bg-muted/70 hover:text-foreground w-full sm:w-auto"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>
              已完成{' '}
              <span className="font-medium text-foreground tabular-nums">{(u as { completedCount?: number }).completedCount ?? 0}</span>{' '}
              条
            </span>
          </Link>
          <p className="flex items-center gap-2 py-0.5">
            <Users className="w-4 h-4 shrink-0" />
            <span>
              <span className="font-medium text-foreground tabular-nums">{(u as { followerCount?: number }).followerCount ?? 0}</span>{' '}
              人已关注
            </span>
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {!isSelf && session && (
            <Button
              type="button"
              variant={(u as { isFollowing?: boolean }).isFollowing ? 'secondary' : 'outline'}
              size="sm"
              className="gap-1"
              disabled={followBusy}
              onClick={onFollowButtonClick}
            >
              {followBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (u as { isFollowing?: boolean }).isFollowing ? (
                <UserCheck className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {(u as { isFollowing?: boolean }).isFollowing ? '已关注' : '关注'}
            </Button>
          )}
          {!isSelf && !session && (
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link href={'/login?callbackUrl=' + encodeURIComponent('/user/' + id)}>
                <UserPlus className="w-4 h-4" />
                关注
              </Link>
            </Button>
          )}
          {!isSelf && session && (
            <>
              <Button type="button" variant="outline" size="sm" className="gap-1 text-destructive" onClick={openReportModal}>
                <Flag className="w-4 h-4" />
                举报用户
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setBlockConfirmOpen(true)}>
                <Ban className="w-4 h-4" />
                拉黑用户
              </Button>
            </>
          )}
        </div>

        {isSelf && (
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm font-medium mb-3">账号管理</p>
            <Button type="button" variant="destructive" size="sm" className="gap-1" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="w-4 h-4" />
              删除账号
            </Button>
          </div>
        )}

        {isSelf && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-medium">已拉黑用户</p>
              <Button type="button" size="sm" variant="outline" onClick={loadBlocked} disabled={blockedLoading}>
                刷新
              </Button>
            </div>
            {blockedLoading ? (
              <div className="text-sm text-muted-foreground">加载中...</div>
            ) : blocked.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无拉黑用户</div>
            ) : (
              <div className="space-y-2">
                {blocked.map((b) => {
                  const u = b.blocked
                  const display = u?.name || u?.email || u?.phone || '用户'
                  return (
                    <div key={b.id} className="flex items-center gap-3 border rounded-xl p-3 bg-card">
                      <UserAvatar src={u?.avatar || undefined} name={display} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{display}</div>
                        <div className="text-xs text-muted-foreground truncate">{u?.id}</div>
                      </div>
                      <Button type="button" size="sm" variant="outline" onClick={() => unblock(u?.id)}>
                        取消拉黑
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {followConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !followBusy && setFollowConfirmOpen(false)}
        >
          <div
            className="bg-card border rounded-xl p-6 max-w-md w-full shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="follow-confirm-title"
          >
            <button
              type="button"
              onClick={() => !followBusy && setFollowConfirmOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="follow-confirm-title" className="font-semibold pr-8 mb-2">
              确认关注该用户吗？
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              用户之后发布帖文时你将收到系统通知（在右侧「系统通知」中查看）。
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void executeFollow()} disabled={followBusy}>
                {followBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                确认关注
              </Button>
            </div>
          </div>
        </div>
      )}

      {blockConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !blockBusy && setBlockConfirmOpen(false)}
        >
          <div
            className="bg-card border rounded-xl p-6 max-w-md w-full shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="block-confirm-title"
          >
            <button
              type="button"
              onClick={() => !blockBusy && setBlockConfirmOpen(false)}
              className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 id="block-confirm-title" className="font-semibold pr-8 mb-2">
              确认要拉黑对方吗？
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              拉黑后将无法在首页或分类页查看到对方的帖子，并取消关注状态（如已关注）。你也可以随时在「我的资料」里取消拉黑。
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBlockConfirmOpen(false)} disabled={blockBusy}>
                取消
              </Button>
              <Button type="button" variant="destructive" onClick={() => void executeBlock()} disabled={blockBusy}>
                {blockBusy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                确认拉黑
              </Button>
            </div>
          </div>
        </div>
      )}

      {reportOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => !reportLoading && setReportOpen(false)}
        >
          <div className="bg-card border rounded-xl p-6 max-w-md w-full shadow-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-1">举报用户</h2>
            <p className="text-xs text-muted-foreground mb-4">我们会认真审核每一条举报，不会随意封禁用户。</p>
            {reportOutcome === 'idle' || reportOutcome === 'err' ? (
              <>
                <div className="space-y-3 mb-4">
                  <label className="text-sm font-medium">原因</label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <div>
                    <label className="text-sm font-medium">补充说明（可选）</label>
                    <textarea
                      value={reportDetail}
                      onChange={(e) => setReportDetail(e.target.value)}
                      className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">你的联系方式（电话）</label>
                    <p className="text-xs text-muted-foreground mt-0.5 mb-1">我们可能会联系你简单了解详情（选填）</p>
                    <input
                      type="tel"
                      value={reportContact}
                      onChange={(e) => setReportContact(e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                      placeholder="例如：917-000-0000"
                      autoComplete="tel"
                    />
                  </div>
                </div>
                {reportOutcome === 'err' && reportErr && <p className="text-sm text-destructive mb-3">{reportErr}</p>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setReportOpen(false)} disabled={reportLoading}>
                    取消
                  </Button>
                  <Button type="button" onClick={submitReport} disabled={reportLoading}>
                    {reportLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    提交举报
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-foreground">提交成功，感谢你为维护社区安全献出的一份力！</p>
                <Button type="button" className="w-full" onClick={() => setReportOpen(false)}>
                  关闭
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setDeleteOpen(false)}>
          <div className="bg-card border rounded-xl p-6 max-w-md w-full shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-semibold mb-4">删除账号</h2>
            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium">原因</label>
              <select
                value={delReason}
                onChange={(e) => setDelReason(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {DELETE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <textarea
                placeholder="补充说明（可选）"
                value={delDetail}
                onChange={(e) => setDelDetail(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                取消
              </Button>
              <Button type="button" variant="destructive" onClick={submitDelete} disabled={deleteLoading}>
                {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                确认删除
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
