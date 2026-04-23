'use client'
import type { Post } from '@prisma/client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import BackToPrev from '@/components/BackToPrev'
import { formatJobSeekPriceSummary } from '@/lib/postDisplay'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'

const locationOptions = ['纽约', '曼哈顿', '皇后区', '布鲁克林', '布朗克斯', '史坦顿岛', '长岛', '新泽西', '其他']

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    contact: '',
    jobSalaryUnit: '' as '' | 'HOURLY' | 'PER_VISIT',
  })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const baselinePostId = useRef<string | null>(null)
  const [dirtyBaseline, setDirtyBaseline] = useState<string | null>(null)

  useEffect(() => {
    if (!post?.id) return
    queueMicrotask(() => {
      if (baselinePostId.current !== post.id) {
        baselinePostId.current = post.id
        setDirtyBaseline(null)
      }
    })
  }, [post?.id])

  useEffect(() => {
    if (loading || !post || dirtyBaseline !== null) return
    queueMicrotask(() => setDirtyBaseline(JSON.stringify({ form, images })))
  }, [loading, post, form, images, dirtyBaseline])

  const isDirty = useMemo(() => {
    if (loading || !post) return false
    if (3 - (post.editCount || 0) <= 0) return false
    if (!dirtyBaseline) return false
    return JSON.stringify({ form, images }) !== dirtyBaseline
  }, [loading, post, form, images, dirtyBaseline])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开编辑页面，未保存的修改将不会保留，确认离开吗？',
  })

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    params.then(({ id }) => {
      fetch('/api/posts/' + id).then(r => r.json()).then(d => {
        if (!d.id) { router.push('/dashboard'); return }
        setPost(d)
        setForm({
          title: d.title,
          description: d.description,
          price: d.price != null ? String(d.price) : '',
          location: d.location,
          contact: d.contact,
          jobSalaryUnit:
            d.jobSalaryUnit === 'HOURLY' || d.jobSalaryUnit === 'PER_VISIT' ? d.jobSalaryUnit : '',
        })
        setImages(d.images || [])
        setLoading(false)
      })
    })
  }, [status, params, router])

  /** 仅发帖人可进入编辑页；管理员请在后台操作 */
  useEffect(() => {
    if (status !== 'authenticated' || !post) return
    const me = (session?.user as { id?: string })?.id
    if (me && post.userId && me !== post.userId) {
      router.replace('/posts/' + post.id)
    }
  }, [status, post, session, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!post) return
    setSaving(true)
    setError('')
    const res = await fetch('/api/posts/' + post.id + '/edit', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        images,
        ...(post.category === 'JOB_SEEK'
          ? {
              jobSalaryUnit:
                form.jobSalaryUnit === 'HOURLY' || form.jobSalaryUnit === 'PER_VISIT'
                  ? form.jobSalaryUnit
                  : null,
            }
          : {}),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) { setError(data.error || '保存失败'); return }
    router.push('/posts/' + post.id)
  }

  if (loading || status === 'loading') return <div className="text-center py-20">加载中...</div>
  if (!post) return null

  const field = 'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const remainingEdits = 3 - (post.editCount || 0)
  const showImages = post.category === 'RENT' || post.category === 'SECONDHAND'

  return (
    <div className="max-w-2xl mx-auto px-safe py-6 sm:py-8">
      {LeaveDialog}
      <BackToPrev className="mb-6" fallbackHref={'/posts/' + post.id} onBeforeNavigate={onBeforeNavigate} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">编辑帖子</h1>
        <span className={'text-sm px-3 py-1 rounded-full font-medium ' +
          (remainingEdits > 1 ? 'bg-green-100 text-green-700' : remainingEdits === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700')}>
          剩余编辑次数：{remainingEdits} / 3
        </span>
      </div>

      {remainingEdits <= 0 ? (
        <div className="text-center py-12 border rounded-xl bg-card">
          <p className="text-muted-foreground mb-4">该帖子已达到最大编辑次数（3次）</p>
          <Button asChild variant="outline"><Link href={'/posts/' + post.id}>返回查看</Link></Button>
        </div>
      ) : (
        <div className="border rounded-xl p-6 bg-card shadow-sm">
          {remainingEdits === 1 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
              ⚠️ 这是您最后一次编辑机会，请仔细检查后再保存。
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">标题 <span className="text-destructive">*</span></label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                className={field} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">详情描述 <span className="text-destructive">*</span></label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className={field + ' min-h-[120px] resize-y'} required />
            </div>
            <div className="grid grid-cols-2 gap-4 items-start">
              <div className="col-span-2 sm:col-span-1">
                {post.category === 'JOB_SEEK' && (
                  <div className="mb-3">
                    <label className="text-sm font-medium mb-1.5 block">期望薪资单位（选填）</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, jobSalaryUnit: '' })}
                        className={
                          'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                          (form.jobSalaryUnit === ''
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent')
                        }
                      >
                        不标注单位
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, jobSalaryUnit: 'HOURLY' })}
                        className={
                          'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                          (form.jobSalaryUnit === 'HOURLY'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent')
                        }
                      >
                        时薪（每小时）
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, jobSalaryUnit: 'PER_VISIT' })}
                        className={
                          'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                          (form.jobSalaryUnit === 'PER_VISIT'
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'hover:bg-accent')
                        }
                      >
                        按次
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      填写下方金额后，将按所选显示为 $/hr 或 $/次；不选单位则仅显示金额。
                    </p>
                  </div>
                )}
                <label className="text-sm font-medium mb-1.5 block">
                  {post.category === 'JOB'
                    ? '时薪（选填）'
                    : post.category === 'JOB_SEEK'
                      ? '期望薪资（选填）'
                      : '价格（选填）'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className={field + ' pl-7'} min="0" />
                </div>
                {(post.category === 'JOB' || post.category === 'JOB_SEEK') && (
                  <p className="text-xs text-muted-foreground mt-1">留空表示面议</p>
                )}
                {post.category === 'JOB_SEEK' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    预览：{formatJobSeekPriceSummary(form.price, form.jobSalaryUnit)}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">地区 <span className="text-destructive">*</span></label>
                <select value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
                  className={field} required>
                  {locationOptions.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {showImages && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">图片</label>
                <ImageUpload value={images} onChange={setImages} max={3} />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">联系方式 <span className="text-destructive">*</span></label>
              <input value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })}
                className={field} required />
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}保存修改
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href={'/posts/' + post.id}>取消</Link>
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
