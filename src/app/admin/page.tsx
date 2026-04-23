'use client'
/* eslint-disable @typescript-eslint/no-explicit-any -- admin UI binds many heterogeneous API payloads */
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import BackToPrev from '@/components/BackToPrev'
import { getAdTypeLabel, getPlacementLabel } from '@/lib/adConstants'
import {
  Trash2,
  Pin,
  PinOff,
  Eye,
  ShieldAlert,
  Check,
  X,
  Flag,
  Ban,
  LayoutDashboard,
  MessageSquare,
  MapPin,
  Users,
  ExternalLink,
  BarChart3,
} from 'lucide-react'

type AdminSection =
  | 'overview'
  | 'analytics'
  | 'posts'
  | 'reports'
  | 'announcement'
  | 'merchants'
  | 'feedback'
  | 'locations'
  | 'users'

type AdminStats = {
  users: number
  posts: { total: number; pending: number; active: number; rejected: number; delisted: number }
  merchants: { pending: number; approved: number }
  feedback: number
  reports: { posts: number; users: number }
  locationSuggestions: number
  adsActive: number
}

const categoryMap: Record<string, string> = {
  RENT: '租房',
  RENT_SEEK: '找房',
  JOB: '招聘',
  JOB_SEEK: '找工',
  SECONDHAND: '二手',
}
const statusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
  ACTIVE: { label: '已发布', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  EXPIRED: { label: '已过期', color: 'bg-gray-100 text-gray-500' },
  SOLD: { label: '已完成', color: 'bg-gray-100 text-gray-600' },
  DELISTED: { label: '违规下架', color: 'bg-amber-100 text-amber-800' },
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [section, setSection] = useState<AdminSection>('overview')
  const [posts, setPosts] = useState<any[]>([])
  const [merchants, setMerchants] = useState<any[]>([])
  const [merchantFilter, setMerchantFilter] = useState<'PENDING' | 'APPROVED'>('PENDING')
  const [selectedMerchant, setSelectedMerchant] = useState<any | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [userReports, setUserReports] = useState<any[]>([])
  const [reportPostTotal, setReportPostTotal] = useState(0)
  const [reportUserTotal, setReportUserTotal] = useState(0)
  const [reportSub, setReportSub] = useState<'post' | 'user'>('post')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [filter, setFilter] = useState('PENDING')
  const [annEnabled, setAnnEnabled] = useState(false)
  const [annText, setAnnText] = useState('')
  const [annSaving, setAnnSaving] = useState(false)
  const [annMsg, setAnnMsg] = useState('')
  const [annHistory, setAnnHistory] = useState<any[]>([])
  const [riskExposureItems, setRiskExposureItems] = useState<{ id: string; text: string }[]>([])
  const [riskDraft, setRiskDraft] = useState('')
  const [riskBusy, setRiskBusy] = useState(false)
  const [riskMsg, setRiskMsg] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [analytics, setAnalytics] = useState<{
    visitors: {
      timezoneNote: string
      summary: {
        currentHour: number
        today: number
        last7Days: number
        last30Days: number
      }
      hourly24: { hourSlot: string; count: number }[]
      daily30: { day: string; count: number }[]
    }
    content: {
      totals: { posts: number; postViews: number }
      byCategory: {
        category: string
        label: string
        total: number
        active: number
        pending: number
        rejected: number
        sold: number
        expired: number
        delisted: number
        totalViews: number
        avgViews: number
      }[]
      newPostsDaily30: { day: string; count: number }[]
      merchants: { approved: number; pending: number; rejected: number }
    }
    ads: {
      totals: {
        ads: number
        activeAds: number
        impressions: number
        clicks: number
        overallCtrPct: number
      }
      byPlacement: {
        placement: string
        ads: number
        impressions: number
        clicks: number
        ctrPct: number
      }[]
      byType: {
        type: string
        ads: number
        impressions: number
        clicks: number
        ctrPct: number
      }[]
      topAds: {
        id: string
        type: string
        placement: string
        targetUrl: string | null
        postId: string | null
        impressions: number
        clicks: number
        ctrPct: number
        startAt: string
        endAt: string
        isActive: boolean
        advertiser: { id: string; name: string | null } | null
      }[]
      topPosts: {
        id: string
        title: string
        category: string
        status: string
        viewCount: number
        location: string
        isPinned: boolean
        author: { id: string; name: string | null } | null
      }[]
      newUsersDaily30: { day: string; count: number }[]
    }
  } | null>(null)
  const [feedbackList, setFeedbackList] = useState<any[]>([])
  const [feedbackTotal, setFeedbackTotal] = useState(0)
  const [locationList, setLocationList] = useState<any[]>([])
  const [locationTotal, setLocationTotal] = useState(0)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [userSearchQ, setUserSearchQ] = useState('')
  const [usersLoading, setUsersLoading] = useState(false)
  const [creditBusyId, setCreditBusyId] = useState<string | null>(null)
  const [dismissPostReportId, setDismissPostReportId] = useState<string | null>(null)
  const [dismissUserReportId, setDismissUserReportId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return }
    if (status === 'authenticated') {
      if (!session?.user?.isAdmin) { router.push('/'); return }
      ;(async () => {
        try {
          setLoadError('')
          const [
            postsRes,
            reportsRes,
            userReportsRes,
            annRes,
            merchantsRes,
            statsRes,
            feedbackRes,
            locRes,
            riskRes,
            analyticsRes,
          ] = await Promise.all([
            fetch('/api/admin/posts'),
            fetch('/api/admin/reports'),
            fetch('/api/admin/user-reports'),
            fetch('/api/admin/announcement'),
            fetch('/api/admin/merchants'),
            fetch('/api/admin/stats'),
            fetch('/api/admin/feedback?take=50'),
            fetch('/api/admin/location-suggestions?take=100'),
            fetch('/api/admin/risk-exposure'),
            fetch('/api/admin/analytics'),
          ])
          const [
            postsText,
            reportsText,
            userReportsText,
            annText,
            merchantsText,
            statsText,
            feedbackText,
            locText,
            riskText,
            analyticsText,
          ] = await Promise.all([
            postsRes.text(),
            reportsRes.text(),
            userReportsRes.text(),
            annRes.text(),
            merchantsRes.text(),
            statsRes.text(),
            feedbackRes.text(),
            locRes.text(),
            riskRes.text(),
            analyticsRes.text(),
          ])
          const pd = postsText ? JSON.parse(postsText) : {}
          const rd = reportsText ? JSON.parse(reportsText) : {}
          const urd = userReportsText ? JSON.parse(userReportsText) : {}
          const ad = annText ? JSON.parse(annText) : {}
          const md = merchantsText ? JSON.parse(merchantsText) : {}
          const sd = statsText ? JSON.parse(statsText) : {}
          const fd = feedbackText ? JSON.parse(feedbackText) : {}
          const ld = locText ? JSON.parse(locText) : {}
          const rxd = riskText ? JSON.parse(riskText) : {}
          const axd = analyticsText ? JSON.parse(analyticsText) : {}
          if (!postsRes.ok) {
            setLoadError(pd.error || '加载帖子失败')
            setPosts([])
          } else {
            setPosts(pd.posts || [])
          }
          if (!reportsRes.ok) {
            setLoadError((prev) => prev || rd.error || '加载帖子举报失败')
            setReports([])
            setReportPostTotal(0)
          } else {
            setReports(rd.reports || [])
            setReportPostTotal(rd.total ?? (rd.reports?.length ?? 0))
          }
          if (!userReportsRes.ok) {
            setLoadError((prev) => prev || urd.error || '加载用户举报失败')
            setUserReports([])
            setReportUserTotal(0)
          } else {
            setUserReports(urd.reports || [])
            setReportUserTotal(urd.total ?? (urd.reports?.length ?? 0))
          }
          if (annRes.ok) {
            const a = ad.announcement || {}
            setAnnEnabled(!!a.enabled)
            const lines = Array.isArray(a.lines) ? a.lines : []
            setAnnText(lines.join('\n'))
            setAnnHistory(Array.isArray(ad.history) ? ad.history : [])
          }
          if (!merchantsRes.ok) {
            setLoadError((prev) => prev || md.error || '加载商家黄页失败')
            setMerchants([])
          } else {
            setMerchants(md.merchants || [])
          }
          if (statsRes.ok && sd && typeof sd.users === 'number') {
            setStats(sd as AdminStats)
          } else {
            setStats(null)
          }
          if (feedbackRes.ok) {
            setFeedbackList(fd.feedback || [])
            setFeedbackTotal(typeof fd.total === 'number' ? fd.total : (fd.feedback?.length ?? 0))
          } else {
            setFeedbackList([])
            setFeedbackTotal(0)
          }
          if (locRes.ok) {
            setLocationList(ld.suggestions || [])
            setLocationTotal(typeof ld.total === 'number' ? ld.total : (ld.suggestions?.length ?? 0))
          } else {
            setLocationList([])
            setLocationTotal(0)
          }
          if (riskRes.ok) {
            setRiskExposureItems(Array.isArray(rxd.items) ? rxd.items : [])
          } else {
            setRiskExposureItems([])
          }
          if (analyticsRes.ok && axd?.visitors && axd?.content && axd?.ads) {
            setAnalytics(axd)
          } else {
            setAnalytics(null)
          }
          setLoading(false)
        } catch {
          setLoadError('加载失败，请刷新重试')
          setPosts([])
          setMerchants([])
          setSelectedMerchant(null)
          setReports([])
          setUserReports([])
          setReportPostTotal(0)
          setReportUserTotal(0)
          setRiskExposureItems([])
          setAnalytics(null)
          setLoading(false)
        }
      })()
    }
  }, [status, session, router])

  useEffect(() => {
    if (section !== 'users') return
    if (status !== 'authenticated' || !(session?.user as { isAdmin?: boolean })?.isAdmin) return
    fetchAdminUsers(userSearchQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section])

  async function saveAnnouncement() {
    setAnnMsg('')
    setAnnSaving(true)
    try {
      const lines = annText
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      const r = await fetch('/api/admin/announcement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: annEnabled, lines }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setAnnMsg(d.error || '保存失败')
        return
      }
      setAnnMsg('已保存')
      // refresh history
      try {
        const hr = await fetch('/api/admin/announcement')
        const hd = await hr.json().catch(() => ({}))
        if (hr.ok) setAnnHistory(Array.isArray(hd.history) ? hd.history : [])
      } catch {
        // ignore
      }
    } finally {
      setAnnSaving(false)
    }
  }

  async function refreshRiskExposure() {
    try {
      const r = await fetch('/api/admin/risk-exposure')
      const d = await r.json().catch(() => ({}))
      if (r.ok) setRiskExposureItems(Array.isArray(d.items) ? d.items : [])
    } catch {
      // ignore
    }
  }

  async function addRiskExposure() {
    setRiskMsg('')
    const text = riskDraft.trim()
    if (!text) {
      setRiskMsg('请输入曝光文案')
      return
    }
    setRiskBusy(true)
    try {
      const r = await fetch('/api/admin/risk-exposure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setRiskMsg(typeof d.error === 'string' ? d.error : '添加失败')
        return
      }
      setRiskDraft('')
      setRiskMsg('已添加')
      await refreshRiskExposure()
    } finally {
      setRiskBusy(false)
    }
  }

  async function deleteRiskExposure(id: string) {
    if (!confirm('确定从顶栏曝光轮播中删除该条？')) return
    setRiskBusy(true)
    try {
      const r = await fetch('/api/admin/risk-exposure/' + encodeURIComponent(id), { method: 'DELETE' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        setRiskMsg(typeof d.error === 'string' ? d.error : '删除失败')
        return
      }
      setRiskMsg('已删除')
      await refreshRiskExposure()
    } finally {
      setRiskBusy(false)
    }
  }

  async function refreshReports() {
    try {
      const [r, ur] = await Promise.all([
        fetch('/api/admin/reports'),
        fetch('/api/admin/user-reports'),
      ])
      const [text, utext] = await Promise.all([r.text(), ur.text()])
      const d = text ? JSON.parse(text) : {}
      const ud = utext ? JSON.parse(utext) : {}
      if (r.ok) {
        setReports(d.reports || [])
        setReportPostTotal(d.total ?? (d.reports?.length ?? 0))
      }
      if (ur.ok) {
        setUserReports(ud.reports || [])
        setReportUserTotal(ud.total ?? (ud.reports?.length ?? 0))
      }
    } catch {
      // ignore
    }
  }

  async function handleDismissPostReport(reportId: string) {
    if (!confirm('确认取消该条举报？（仅删除举报记录；若该帖已无其他举报，将自动取消「被举报」标记）')) return
    setDismissPostReportId(reportId)
    try {
      const r = await fetch('/api/admin/reports/' + reportId, { method: 'DELETE' })
      const t = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(t.error || '操作失败')
        return
      }
      setReports((prev) => prev.filter((x: { id: string }) => x.id !== reportId))
      setReportPostTotal((n) => Math.max(0, n - 1))
      await refreshReports()
    } finally {
      setDismissPostReportId(null)
    }
  }

  async function handleDismissUserReport(reportId: string) {
    if (!confirm('确认取消该条用户举报记录？')) return
    setDismissUserReportId(reportId)
    try {
      const r = await fetch('/api/admin/user-reports/' + reportId, { method: 'DELETE' })
      const t = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(t.error || '操作失败')
        return
      }
      setUserReports((prev) => prev.filter((x: { id: string }) => x.id !== reportId))
      setReportUserTotal((n) => Math.max(0, n - 1))
      await refreshReports()
    } finally {
      setDismissUserReportId(null)
    }
  }

  async function handleStatus(id: string, newStatus: string) {
    await fetch('/api/admin/posts/' + id + '/status', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setPosts(posts.map(p => p.id === id ? { ...p, status: newStatus } : p))
    await refreshReports()
  }

  async function handlePin(id: string, isPinned: boolean) {
    await fetch('/api/admin/posts/' + id + '/pin', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !isPinned }),
    })
    setPosts(posts.map(p => p.id === id ? { ...p, isPinned: !isPinned } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('确定删除？')) return
    await fetch('/api/posts/' + id, { method: 'DELETE' })
    setPosts(posts.filter(p => p.id !== id))
    await refreshReports()
  }

  async function handleMerchantStatus(id: string, newStatus: string) {
    await fetch('/api/admin/merchants/' + id + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m)))
    if (selectedMerchant?.id === id) setSelectedMerchant((m: any) => ({ ...m, status: newStatus }))
  }

  async function handleMerchantPin(id: string, isPinned: boolean) {
    await fetch('/api/admin/merchants/' + id + '/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned: !isPinned }),
    })
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, isPinned: !isPinned } : m)))
    if (selectedMerchant?.id === id) setSelectedMerchant((m: any) => ({ ...m, isPinned: !isPinned }))
  }

  async function handleMerchantDelist(id: string, isDelisted: boolean) {
    await fetch('/api/admin/merchants/' + id + '/delist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDelisted: !isDelisted }),
    })
    setMerchants((prev) => prev.map((m) => (m.id === id ? { ...m, isDelisted: !isDelisted } : m)))
    if (selectedMerchant?.id === id) setSelectedMerchant((m: any) => ({ ...m, isDelisted: !isDelisted }))
  }

  async function handleMerchantDelete(id: string) {
    if (!confirm('确定删除该商家？')) return
    await fetch('/api/admin/merchants/' + id, { method: 'DELETE' })
    setMerchants((prev) => prev.filter((m) => m.id !== id))
    if (selectedMerchant?.id === id) setSelectedMerchant(null)
  }

  async function fetchAdminUsers(q?: string) {
    setUsersLoading(true)
    try {
      const url = '/api/admin/users?take=30' + (q && q.trim() ? '&q=' + encodeURIComponent(q.trim()) : '')
      const r = await fetch(url)
      const d = await r.json().catch(() => ({}))
      if (r.ok) setAdminUsers(d.users || [])
    } finally {
      setUsersLoading(false)
    }
  }

  async function handleUserBan(id: string, banned: boolean) {
    if (!confirm(banned ? '确认封禁该用户？其将无法发帖。' : '确认解除封禁？')) return
    const r = await fetch('/api/admin/users/' + id + '/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned }),
    })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      alert(d.error || '操作失败')
      return
    }
    setAdminUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isBanned: banned } : u)))
  }

  async function handleUserCredit(id: string, delta: number) {
    if (!confirm(delta < 0 ? `确认扣分 ${Math.abs(delta)}？（降到 0 会自动封禁并下架全部帖子）` : `确认加分 ${delta}？`)) return
    setCreditBusyId(id)
    try {
      const r = await fetch('/api/admin/users/' + id + '/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) {
        alert(d.error || '操作失败')
        return
      }
      const nu = d.user
      setAdminUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, creditScore: nu.creditScore, isBanned: nu.isBanned } : u)),
      )
    } finally {
      setCreditBusyId(null)
    }
  }

  const filtered = posts.filter(p => filter === 'ALL' ? true : p.status === filter)
  const pendingCount = posts.filter(p => p.status === 'PENDING').length
  const reportTotal = reportPostTotal + reportUserTotal
  const pendingMerchantCount = merchants.filter((m) => m.status === 'PENDING').length

  if (status === 'loading' || loading) return <div className="text-center py-20">加载中...</div>

  return (
    <div className="max-w-5xl mx-auto px-safe py-6 sm:py-8">
      <BackToPrev className="mb-6" />
      <div className="flex items-center gap-3 mb-6">
        <ShieldAlert className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">管理后台</h1>
      </div>

      {loadError && (
        <div className="mb-6 border border-destructive/30 bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
          {loadError}
        </div>
      )}

      <div className="flex gap-2 mb-8 flex-wrap">
        <button type="button" onClick={() => setSection('overview')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'overview' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <LayoutDashboard className="w-4 h-4" />
          总览
        </button>
        <button type="button" onClick={() => setSection('analytics')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'analytics' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <BarChart3 className="w-4 h-4" />
          访问统计
        </button>
        <button type="button" onClick={() => setSection('posts')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
            (section === 'posts' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          帖子管理
        </button>
        <button type="button" onClick={() => setSection('reports')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'reports' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <Flag className="w-4 h-4" />
          举报记录
          {reportTotal > 0 && (
            <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (section === 'reports' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
              {reportTotal}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setSection('announcement')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
            (section === 'announcement' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          更新公告
        </button>
        <button type="button" onClick={() => setSection('merchants')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
            (section === 'merchants' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          商家黄页
          {pendingMerchantCount > 0 && (
            <span className={'ml-2 text-xs rounded-full px-1.5 py-0.5 ' + (section === 'merchants' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
              {pendingMerchantCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setSection('feedback')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'feedback' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <MessageSquare className="w-4 h-4" />
          用户反馈
          {feedbackTotal > 0 && (
            <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (section === 'feedback' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
              {feedbackTotal}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setSection('locations')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'locations' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <MapPin className="w-4 h-4" />
          城市建议
          {locationTotal > 0 && (
            <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (section === 'locations' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
              {locationTotal}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setSection('users')}
          className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
            (section === 'users' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
          <Users className="w-4 h-4" />
          用户
        </button>
      </div>

      {section === 'overview' && (
        <div className="space-y-8">
          <p className="text-sm text-muted-foreground">
            在此集中处理内容审核、公告、商家与风险用户；无需改代码即可运营站点。更多能力会持续接入本页。
          </p>
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <button type="button" onClick={() => setSection('users')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold">{stats.users}</div>
                <div className="text-xs text-muted-foreground mt-1">注册用户（未删）</div>
              </button>
              <button type="button" onClick={() => setSection('posts')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold text-yellow-600">{stats.posts.pending}</div>
                <div className="text-xs text-muted-foreground mt-1">帖子待审核</div>
              </button>
              <button type="button" onClick={() => setSection('posts')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold">{stats.posts.active}</div>
                <div className="text-xs text-muted-foreground mt-1">已上架帖子</div>
              </button>
              <button type="button" onClick={() => setSection('reports')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold">{stats.reports.posts + stats.reports.users}</div>
                <div className="text-xs text-muted-foreground mt-1">举报（帖+用户）</div>
              </button>
              <button type="button" onClick={() => setSection('merchants')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold text-amber-700">{stats.merchants.pending}</div>
                <div className="text-xs text-muted-foreground mt-1">商家待审核</div>
              </button>
              <button type="button" onClick={() => setSection('feedback')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold">{stats.feedback}</div>
                <div className="text-xs text-muted-foreground mt-1">用户反馈条数</div>
              </button>
              <div className="border rounded-xl p-4 bg-card">
                <div className="text-2xl font-bold">{stats.adsActive}</div>
                <div className="text-xs text-muted-foreground mt-1">进行中广告（全站）</div>
              </div>
              <button type="button" onClick={() => setSection('locations')} className="border rounded-xl p-4 bg-card text-left hover:bg-muted/30 transition-colors">
                <div className="text-2xl font-bold">{stats.locationSuggestions}</div>
                <div className="text-xs text-muted-foreground mt-1">城市建议提交</div>
              </button>
            </div>
          )}
          {analytics && (
            <div className="border rounded-xl p-5 bg-card space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-semibold text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  访客 & 广告速览（{analytics.visitors.timezoneNote}）
                </div>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() => setSection('analytics')}
                >
                  查看详细统计 →
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                访客按浏览器 Cookie 识别并按 UTC 整点去重；广告数据来自 Ad 表累计曝光与点击。
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="text-xl font-bold tabular-nums">{analytics.visitors.summary.today}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">今日访客</div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="text-xl font-bold tabular-nums">{analytics.visitors.summary.last30Days}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">近 30 天访客</div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="text-xl font-bold tabular-nums">{analytics.ads.totals.impressions.toLocaleString()}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">广告累计曝光</div>
                </div>
                <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
                  <div className="text-xl font-bold tabular-nums">
                    {analytics.ads.totals.clicks.toLocaleString()}
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      CTR {analytics.ads.totals.overallCtrPct.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">广告累计点击 · 整体 CTR</div>
                </div>
              </div>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border rounded-xl p-5 bg-card">
              <div className="font-semibold text-sm mb-3">运营快捷入口</div>
              <div className="flex flex-col gap-2 text-sm">
                <button type="button" className="text-left text-primary hover:underline inline-flex items-center gap-1" onClick={() => setSection('announcement')}>
                  全站公告条 <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setSection('posts')}>帖子审核与下架</button>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setSection('reports')}>举报处理</button>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setSection('merchants')}>商家入驻审核</button>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setSection('feedback')}>查看用户反馈</button>
                <button type="button" className="text-left text-primary hover:underline" onClick={() => setSection('users')}>用户搜索与封禁</button>
                <button type="button" className="text-left text-primary hover:underline inline-flex items-center gap-1" onClick={() => setSection('analytics')}>
                  访问统计 <BarChart3 className="w-3.5 h-3.5 opacity-60" />
                </button>
              </div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <div className="font-semibold text-sm mb-3">前台页面（新窗口打开便于核对效果）</div>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  首页 <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>
                <Link href="/posts" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  分类信息列表 <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>
                <Link href="/yellowpages" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  商家黄页 <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>
                <Link href="/share" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                  分享本站 <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {section === 'analytics' && (
        <div className="space-y-10">
          <p className="text-sm text-muted-foreground">
            一站式后台统计（UTC）：访客、各模块发帖量与浏览量、广告曝光/点击/点击率、TOP 帖文等。
            可直接向广告方展示以增强投放信心。
          </p>
          {!analytics ? (
            <div className="text-sm text-destructive border border-destructive/30 rounded-xl p-4">
              无法加载统计数据（请确认数据库已迁移且 /api/admin/analytics 可用）。
            </div>
          ) : (
            <>
              <section className="space-y-3">
                <h2 className="text-base font-semibold">一、访客概览</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.visitors.summary.currentHour}</div>
                    <div className="text-xs text-muted-foreground mt-1">当前 UTC 整点内 · 独立访客</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.visitors.summary.today}</div>
                    <div className="text-xs text-muted-foreground mt-1">今日（UTC 日历日）· 独立访客</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.visitors.summary.last7Days}</div>
                    <div className="text-xs text-muted-foreground mt-1">近 7 个日历日 · 独立访客</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.visitors.summary.last30Days}</div>
                    <div className="text-xs text-muted-foreground mt-1">近 30 个日历日 · 独立访客</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">按小时（最近 24 个 UTC 整点）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">UTC 时间</th>
                          <th className="px-3 py-2 font-medium text-right">该小时独立访客</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.visitors.hourly24.map((row) => (
                          <tr key={row.hourSlot} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">
                              {new Date(row.hourSlot).toLocaleString('zh-CN', {
                                timeZone: 'UTC',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">按天（最近 30 个 UTC 日历日）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto max-h-[min(70vh,28rem)] overflow-y-auto">
                    <table className="w-full text-sm min-w-[360px]">
                      <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">日期（UTC）</th>
                          <th className="px-3 py-2 font-medium text-right">当日独立访客</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...analytics.visitors.daily30].reverse().map((row) => (
                          <tr key={row.day} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.day}</td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums">{row.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">二、各模块内容统计</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.content.totals.posts.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">累计帖子（全部状态）</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.content.totals.postViews.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground mt-1">累计帖子浏览量</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.content.merchants.approved}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      黄页商家（通过） · 待审 {analytics.content.merchants.pending}
                    </div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">
                      {analytics.content.newPostsDaily30.reduce((s, d) => s + d.count, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">近 30 天新增帖子</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">按模块拆分（帖子数与浏览量）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[780px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">模块</th>
                          <th className="px-3 py-2 font-medium text-right">总数</th>
                          <th className="px-3 py-2 font-medium text-right">已发布</th>
                          <th className="px-3 py-2 font-medium text-right">待审</th>
                          <th className="px-3 py-2 font-medium text-right">已成交</th>
                          <th className="px-3 py-2 font-medium text-right">下架/拒绝/过期</th>
                          <th className="px-3 py-2 font-medium text-right">总浏览量</th>
                          <th className="px-3 py-2 font-medium text-right">篇均浏览</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.content.byCategory.map((row) => (
                          <tr key={row.category} className="border-b border-border/50 last:border-0">
                            <td className="px-3 py-2 font-medium">{row.label}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.total.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-green-700">{row.active.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-yellow-700">{row.pending.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{row.sold.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {(row.delisted + row.rejected + row.expired).toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">{row.totalViews.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{row.avgViews.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">新增帖子（近 30 个 UTC 日历日）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto max-h-[min(60vh,24rem)] overflow-y-auto">
                    <table className="w-full text-sm min-w-[360px]">
                      <thead className="sticky top-0 bg-muted/90 backdrop-blur">
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">日期（UTC）</th>
                          <th className="px-3 py-2 font-medium text-right">新增帖子</th>
                          <th className="px-3 py-2 font-medium text-right">当日注册新用户</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...analytics.content.newPostsDaily30].reverse().map((row) => {
                          const u =
                            analytics.ads.newUsersDaily30.find((x) => x.day === row.day)?.count ?? 0
                          return (
                            <tr key={row.day} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2 tabular-nums text-muted-foreground">{row.day}</td>
                              <td className="px-3 py-2 text-right font-medium tabular-nums">{row.count}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{u}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-semibold">三、广告投放统计</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">{analytics.ads.totals.activeAds}</div>
                    <div className="text-xs text-muted-foreground mt-1">当前在投广告 / 共 {analytics.ads.totals.ads}</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">
                      {analytics.ads.totals.impressions.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">累计曝光</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">
                      {analytics.ads.totals.clicks.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">累计点击</div>
                  </div>
                  <div className="border rounded-xl p-4 bg-card">
                    <div className="text-2xl font-bold tabular-nums">
                      {analytics.ads.totals.overallCtrPct.toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">整体点击率（CTR）</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">按广告类型</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[520px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">类型</th>
                          <th className="px-3 py-2 font-medium text-right">投放数</th>
                          <th className="px-3 py-2 font-medium text-right">曝光</th>
                          <th className="px-3 py-2 font-medium text-right">点击</th>
                          <th className="px-3 py-2 font-medium text-right">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.ads.byType.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                              暂无数据
                            </td>
                          </tr>
                        ) : (
                          analytics.ads.byType.map((row) => (
                            <tr key={row.type} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2 font-medium">{getAdTypeLabel(row.type)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.ads}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.impressions.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.clicks.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.ctrPct.toFixed(2)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">按广告位（Placement）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">广告位</th>
                          <th className="px-3 py-2 font-medium text-right">投放数</th>
                          <th className="px-3 py-2 font-medium text-right">曝光</th>
                          <th className="px-3 py-2 font-medium text-right">点击</th>
                          <th className="px-3 py-2 font-medium text-right">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.ads.byPlacement.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                              暂无数据
                            </td>
                          </tr>
                        ) : (
                          analytics.ads.byPlacement.map((row) => (
                            <tr key={row.placement} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2 font-medium">{getPlacementLabel(row.placement)}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.ads}</td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.impressions.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.clicks.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.ctrPct.toFixed(2)}%</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">TOP 10 广告（按点击）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[820px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">广告</th>
                          <th className="px-3 py-2 font-medium">广告主</th>
                          <th className="px-3 py-2 font-medium text-right">曝光</th>
                          <th className="px-3 py-2 font-medium text-right">点击</th>
                          <th className="px-3 py-2 font-medium text-right">CTR</th>
                          <th className="px-3 py-2 font-medium">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.ads.topAds.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                              暂无数据
                            </td>
                          </tr>
                        ) : (
                          analytics.ads.topAds.map((row) => (
                            <tr key={row.id} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2">
                                <div className="font-medium">{getAdTypeLabel(row.type)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {getPlacementLabel(row.placement)}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-xs">
                                {row.advertiser ? (
                                  <Link
                                    href={'/user/' + row.advertiser.id}
                                    className="text-primary hover:underline"
                                  >
                                    {row.advertiser.name || '未命名'}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {row.impressions.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums font-medium">
                                {row.clicks.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">{row.ctrPct.toFixed(2)}%</td>
                              <td className="px-3 py-2 text-xs">
                                {row.isActive ? (
                                  <span className="text-green-700">在投</span>
                                ) : (
                                  <span className="text-muted-foreground">已停</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-2 mt-4">TOP 10 帖子（按浏览量，可作为原生流量参考）</h3>
                  <div className="border rounded-xl overflow-hidden bg-card overflow-x-auto">
                    <table className="w-full text-sm min-w-[720px]">
                      <thead>
                        <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                          <th className="px-3 py-2 font-medium">帖子</th>
                          <th className="px-3 py-2 font-medium">模块</th>
                          <th className="px-3 py-2 font-medium">地点</th>
                          <th className="px-3 py-2 font-medium">发布者</th>
                          <th className="px-3 py-2 font-medium text-right">浏览量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.ads.topPosts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                              暂无数据
                            </td>
                          </tr>
                        ) : (
                          analytics.ads.topPosts.map((row) => (
                            <tr key={row.id} className="border-b border-border/50 last:border-0">
                              <td className="px-3 py-2">
                                <Link
                                  href={'/posts/' + row.id}
                                  className="font-medium hover:text-primary line-clamp-1"
                                >
                                  {row.isPinned && <span className="text-yellow-600 mr-1">置顶</span>}
                                  {row.title}
                                </Link>
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">
                                {categoryMap[row.category] || row.category}
                              </td>
                              <td className="px-3 py-2 text-xs text-muted-foreground">{row.location}</td>
                              <td className="px-3 py-2 text-xs">
                                {row.author ? (
                                  <Link
                                    href={'/user/' + row.author.id}
                                    className="text-primary hover:underline"
                                  >
                                    {row.author.name || '匿名'}
                                  </Link>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums font-medium">
                                {row.viewCount.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      )}

      {section === 'posts' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border rounded-xl p-5 bg-card">
              <div className="text-3xl font-bold">{posts.length}</div>
              <div className="text-sm text-muted-foreground mt-1">总帖子数</div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <div className="text-3xl font-bold text-yellow-600">{pendingCount}</div>
              <div className="text-sm text-muted-foreground mt-1">待审核</div>
            </div>
            <div className="border rounded-xl p-5 bg-card">
              <div className="text-3xl font-bold text-green-600">{posts.filter(p => p.status === 'ACTIVE').length}</div>
              <div className="text-sm text-muted-foreground mt-1">已发布</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            {[['PENDING','待审核'],['ACTIVE','已发布'],['DELISTED','违规下架'],['REJECTED','已拒绝'],['ALL','全部']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setFilter(val)}
                className={'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ' +
                  (filter === val ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
                {label}{val === 'PENDING' && pendingCount > 0 && <span className="ml-1.5 bg-yellow-500 text-white text-xs rounded-full px-1.5">{pendingCount}</span>}
              </button>
            ))}
          </div>

          <div className="border rounded-xl overflow-hidden bg-card">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">暂无帖子</div>
            ) : (
              <div className="divide-y">
                {filtered.map((post) => {
                  const st = statusMap[post.status] || statusMap.PENDING
                  return (
                    <div key={post.id} className="p-4 flex items-center gap-3 hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted">{categoryMap[post.category]}</span>
                          <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + st.color}>{st.label}</span>
                          {post.isFlagged && <span className="text-xs text-amber-700 font-medium">曾被举报</span>}
                          {post.highRiskKeywords && (
                            <span className="text-xs font-medium text-orange-700 bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded-full">
                              押金/先付类关键词
                            </span>
                          )}
                          {post.isPinned && <span className="text-xs text-yellow-600 font-medium">置顶</span>}
                        </div>
                        <Link href={'/posts/' + post.id} className="text-sm font-medium hover:text-primary line-clamp-1">{post.title}</Link>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <span>{post.user?.name || '匿名'}</span>
                          <span>·</span><span>{post.location}</span>
                          <span>·</span><Eye className="w-3 h-3" /><span>{post.viewCount}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                        {post.status === 'PENDING' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-600"
                              onClick={() => handleStatus(post.id, 'ACTIVE')} title="通过">
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                              onClick={() => handleStatus(post.id, 'REJECTED')} title="拒绝">
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {post.status === 'ACTIVE' && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handlePin(post.id, post.isPinned)}
                              title={post.isPinned ? '取消置顶' : '置顶'}>
                              {post.isPinned ? <PinOff className="w-4 h-4 text-yellow-600" /> : <Pin className="w-4 h-4" />}
                            </Button>
                            <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-800 gap-1"
                              onClick={() => { if (confirm('确认下架该帖？前台用户将不可见。')) handleStatus(post.id, 'DELISTED') }}
                              title="下架">
                              <Ban className="w-4 h-4" />下架
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(post.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {section === 'reports' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button type="button" onClick={() => setReportSub('post')}
              className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
                (reportSub === 'post' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
              被举报帖子
              {reportPostTotal > 0 && (
                <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (reportSub === 'post' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
                  {reportPostTotal}
                </span>
              )}
            </button>
            <button type="button" onClick={() => setReportSub('user')}
              className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors inline-flex items-center gap-2 ' +
                (reportSub === 'user' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}>
              被举报用户
              {reportUserTotal > 0 && (
                <span className={'text-xs rounded-full px-1.5 py-0.5 ' + (reportSub === 'user' ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20')}>
                  {reportUserTotal}
                </span>
              )}
            </button>
          </div>

          {reportSub === 'post' && (
            <div className="border rounded-xl overflow-hidden bg-card">
              {reports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无帖子举报</div>
              ) : (
                <div className="divide-y">
                  {reports.map((rep: any) => {
                    const post = rep.post
                    const pst = post ? (statusMap[post.status] || statusMap.PENDING) : null
                    const reporter = rep.user?.name || (rep.user?.email ?? rep.user?.phone) || '匿名'
                    const t = new Date(rep.createdAt).toLocaleString('zh-CN')
                    const reasonLabel = rep.reason ? String(rep.reason) : '（历史记录）'
                    return (
                      <div key={rep.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap text-xs text-muted-foreground">
                            <span>{t}</span>
                            <span>·</span>
                            <span>举报人：{reporter}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                            <div>原因：{reasonLabel}</div>
                            {rep.details && <p className="line-clamp-4">说明：{rep.details}</p>}
                            {rep.contactPhone && <div>联系电话：{rep.contactPhone}</div>}
                          </div>
                          {post ? (
                            <>
                              <div className="flex items-center gap-2 mb-1 mt-2 flex-wrap">
                                <span className={'text-xs font-medium px-2 py-0.5 rounded-full ' + pst!.color}>{pst!.label}</span>
                                {post.isFlagged && <span className="text-xs text-amber-700">已标记</span>}
                              </div>
                              <Link href={'/posts/' + post.id} className="text-sm font-medium hover:text-primary line-clamp-2">
                                {post.title}
                              </Link>
                              <div className="text-xs text-muted-foreground mt-1">
                                发帖人：{post.user?.name || '匿名'} · {post.location}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground mt-2">帖子已删除</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={dismissPostReportId === rep.id}
                            onClick={() => handleDismissPostReport(rep.id)}
                          >
                            {dismissPostReportId === rep.id ? '处理中…' : '取消举报'}
                          </Button>
                          {post && (
                            <>
                              {post.status === 'ACTIVE' && (
                                <Button variant="outline" size="sm" className="text-amber-800 border-amber-300 gap-1"
                                  onClick={() => { if (confirm('确认下架该帖？')) handleStatus(post.id, 'DELISTED') }}>
                                  <Ban className="w-4 h-4" />下架
                                </Button>
                              )}
                              <Button variant="destructive" size="sm" className="gap-1"
                                onClick={() => handleDelete(post.id)}>
                                <Trash2 className="w-4 h-4" />删除帖子
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {reportSub === 'user' && (
            <div className="border rounded-xl overflow-hidden bg-card">
              {userReports.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无用户举报</div>
              ) : (
                <div className="divide-y">
                  {userReports.map((rep: any) => {
                    const reporter = rep.reporter?.name || (rep.reporter?.email ?? rep.reporter?.phone) || '匿名'
                    const reported = rep.reported?.name || (rep.reported?.email ?? rep.reported?.phone) || '用户'
                    const t = new Date(rep.createdAt).toLocaleString('zh-CN')
                    return (
                      <div key={rep.id} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap text-xs text-muted-foreground">
                            <span>{t}</span>
                            <span>·</span>
                            <span>举报人：{reporter}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">被举报用户：</span>
                            <Link href={'/user/' + rep.reportedUserId} className="font-medium hover:text-primary">
                              {reported}
                            </Link>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">原因：{rep.reason}</div>
                          {rep.details && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-3">说明：{rep.details}</p>
                          )}
                          {rep.contactPhone && (
                            <div className="text-xs text-muted-foreground mt-1">联系电话：{rep.contactPhone}</div>
                          )}
                        </div>
                        <div className="shrink-0">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={dismissUserReportId === rep.id}
                            onClick={() => handleDismissUserReport(rep.id)}
                          >
                            {dismissUserReportId === rep.id ? '处理中…' : '取消举报'}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {section === 'announcement' && (
        <div className="max-w-2xl">
          <div className="border rounded-xl p-6 bg-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold">全站更新公告条</div>
                <div className="text-xs text-muted-foreground mt-1">
                  显示在页头（Navbar 下方）。每行一条，前面会自动加喇叭图标。
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={annEnabled}
                  onChange={(e) => setAnnEnabled(e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                启用
              </label>
            </div>

            <textarea
              value={annText}
              onChange={(e) => setAnnText(e.target.value)}
              className="w-full min-h-[160px] rounded-xl border bg-background px-3 py-2 text-sm"
              placeholder="例如：&#10;上线：猜你喜欢轮播（按地区热门）&#10;优化：分类页新增细分筛选"
            />

            {annMsg && (
              <div className={'text-sm ' + (annMsg === '已保存' ? 'text-green-600' : 'text-destructive')}>
                {annMsg}
              </div>
            )}

            <div className="flex gap-2">
              <Button type="button" onClick={saveAnnouncement} disabled={annSaving}>
                {annSaving ? '保存中...' : '保存'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAnnText('')
                  setAnnEnabled(false)
                  setAnnMsg('')
                }}
              >
                清空
              </Button>
            </div>
          </div>

          <div className="mt-6 border rounded-xl p-6 bg-card space-y-4">
            <div>
              <div className="font-semibold">顶栏右侧 · 高风险 / 封禁账号曝光轮播</div>
              <div className="text-xs text-muted-foreground mt-1">
                显示在「站长警告」公告条右侧，多条自动轮播。用于曝光高风险信用或已封禁账号（文案由你填写，请避免泄露完整隐私信息）。
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={riskDraft}
                onChange={(e) => setRiskDraft(e.target.value)}
                placeholder="例：用户「测试昵称」信用分过低，已封禁"
                maxLength={220}
                className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
              />
              <Button type="button" onClick={addRiskExposure} disabled={riskBusy}>
                {riskBusy ? '处理中…' : '添加'}
              </Button>
            </div>
            {riskMsg && (
              <div
                className={
                  'text-sm ' +
                  (riskMsg.startsWith('已') ? 'text-green-600' : 'text-destructive')
                }
              >
                {riskMsg}
              </div>
            )}
            {riskExposureItems.length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">暂无条目，添加后将出现在全站顶栏右侧。</div>
            ) : (
              <ul className="divide-y rounded-lg border border-border overflow-hidden">
                {riskExposureItems.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-start gap-3 px-3 py-2.5 bg-muted/20 text-sm hover:bg-muted/40"
                  >
                    <span className="flex-1 min-w-0 break-words">{it.text}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:text-destructive"
                      title="删除"
                      disabled={riskBusy}
                      onClick={() => deleteRiskExposure(it.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 border rounded-xl bg-card overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="font-semibold">已发布公告记录</div>
              <div className="text-xs text-muted-foreground mt-1">显示最近 20 条保存记录（包含启用/关闭）。</div>
            </div>
            {annHistory.length === 0 ? (
              <div className="px-6 py-8 text-sm text-muted-foreground">暂无记录</div>
            ) : (
              <div className="divide-y">
                {annHistory.map((h) => (
                  <div key={h.id} className="px-6 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">
                        {new Date(h.updatedAt).toLocaleString('zh-CN')}
                      </div>
                      <span
                        className={
                          'text-xs px-2 py-0.5 rounded-full ' +
                          (h.enabled ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground')
                        }
                      >
                        {h.enabled ? '启用' : '关闭'}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1">
                      {(Array.isArray(h.lines) ? h.lines : []).map((t: string, i: number) => (
                        <div key={i} className="text-sm">
                          {t}
                        </div>
                      ))}
                      {(!h.lines || h.lines.length === 0) && (
                        <div className="text-sm text-muted-foreground">（空）</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'merchants' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setMerchantFilter('PENDING'); setSelectedMerchant(null) }}
              className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
                (merchantFilter === 'PENDING' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}
            >
              审核中
              {pendingMerchantCount > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-1.5">{pendingMerchantCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setMerchantFilter('APPROVED'); setSelectedMerchant(null) }}
              className={'px-4 py-2 rounded-full text-sm font-medium border transition-colors ' +
                (merchantFilter === 'APPROVED' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-transparent')}
            >
              已入驻商家
            </button>
          </div>

          <div className="flex gap-6 items-start">
            <div className="flex-1 min-w-0">
              <div className="border rounded-xl overflow-hidden bg-card">
                {merchants.filter((m) => m.status === merchantFilter).length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">暂无商家</div>
                ) : (
                  <div className="divide-y">
                    {merchants
                      .filter((m) => m.status === merchantFilter)
                      .map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMerchant(m)}
                          className={'w-full text-left p-4 hover:bg-muted/20 transition-colors ' + (selectedMerchant?.id === m.id ? 'bg-muted/30' : '')}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{m.companyName}</div>
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {m.category} · {m.phone}
                                {m.isPinned ? ' · 置顶' : ''}
                                {m.isDelisted ? ' · 已下架' : ''}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground shrink-0">
                              {new Date(m.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {selectedMerchant && (
              <div className="w-[360px] shrink-0 hidden lg:block">
                <div className="border rounded-xl bg-card overflow-hidden sticky top-20">
                  <div className="p-4 border-b">
                    <div className="font-semibold text-sm">{selectedMerchant.companyName}</div>
                    <div className="text-xs text-muted-foreground mt-1">{selectedMerchant.category}</div>
                  </div>
                  <div className="p-4 space-y-2 text-sm">
                    <div className="text-muted-foreground">电话：<span className="text-foreground">{selectedMerchant.phone}</span></div>
                    <div className="text-muted-foreground">邮箱：<span className="text-foreground">{selectedMerchant.email}</span></div>
                    <div className="text-muted-foreground">地址：<span className="text-foreground">{selectedMerchant.address}</span></div>
                    <div className="text-muted-foreground">主营业务：</div>
                    <div className="text-foreground whitespace-pre-wrap text-sm">{selectedMerchant.businessScope}</div>
                  </div>
                  <div className="p-4 border-t flex flex-wrap gap-2 justify-end">
                    {selectedMerchant.status === 'PENDING' && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-700 border-green-300"
                          onClick={() => handleMerchantStatus(selectedMerchant.id, 'APPROVED')}>
                          通过
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/40"
                          onClick={() => handleMerchantStatus(selectedMerchant.id, 'REJECTED')}>
                          拒绝
                        </Button>
                      </>
                    )}
                    {selectedMerchant.status === 'APPROVED' && (
                      <>
                        <Button variant="outline" size="sm"
                          onClick={() => handleMerchantPin(selectedMerchant.id, selectedMerchant.isPinned)}>
                          {selectedMerchant.isPinned ? '取消置顶' : '置顶'}
                        </Button>
                        <Button variant="outline" size="sm" className="text-amber-700 border-amber-300"
                          onClick={() => handleMerchantDelist(selectedMerchant.id, selectedMerchant.isDelisted)}>
                          {selectedMerchant.isDelisted ? '恢复上架' : '下架'}
                        </Button>
                      </>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => handleMerchantDelete(selectedMerchant.id)}>
                      删除
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {section === 'feedback' && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="px-4 py-3 border-b text-sm text-muted-foreground">
            来自右侧栏「反馈」提交的记录（最近 50 条），共 {feedbackTotal} 条。
          </div>
          {feedbackList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无反馈</div>
          ) : (
            <div className="divide-y">
              {feedbackList.map((fb) => (
                <div key={fb.id} className="p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{new Date(fb.createdAt).toLocaleString('zh-CN')}</span>
                    <span>·</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">{fb.type || 'FEATURE'}</span>
                    {fb.user && (
                      <>
                        <span>·</span>
                        <Link href={'/user/' + fb.user.id} className="text-primary hover:underline">
                          {fb.user.name || fb.user.email || fb.user.phone || '用户'}
                        </Link>
                      </>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{fb.message}</p>
                  {fb.contact && <p className="text-xs text-muted-foreground mt-2">联系方式：{fb.contact}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'locations' && (
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="px-4 py-3 border-b text-sm text-muted-foreground">
            用户提交的城市/地区建议（最近 100 条），共 {locationTotal} 条。可在定位功能中据此迭代词库。
          </div>
          {locationList.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">暂无记录</div>
          ) : (
            <div className="divide-y">
              {locationList.map((row) => (
                <div key={row.id} className="p-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div>
                    <span className="font-medium">{row.stateText}</span>
                    <span className="text-muted-foreground"> · </span>
                    <span>{row.cityText}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(row.createdAt).toLocaleString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {section === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
            <input
              value={userSearchQ}
              onChange={(e) => setUserSearchQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchAdminUsers(userSearchQ)}
              className="flex-1 rounded-xl border bg-background px-3 py-2 text-sm"
              placeholder="搜索：用户 ID / 邮箱 / 手机 / 昵称"
            />
            <Button type="button" variant="secondary" disabled={usersLoading} onClick={() => fetchAdminUsers(userSearchQ)}>
              {usersLoading ? '搜索中…' : '搜索'}
            </Button>
          </div>
          <div className="border rounded-xl overflow-hidden bg-card">
            {usersLoading && adminUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">加载中…</div>
            ) : adminUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">无匹配用户</div>
            ) : (
              <div className="divide-y">
                {adminUsers.map((u) => (
                  <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-medium truncate">{u.name || '未命名'}</div>
                      <div className="text-xs text-muted-foreground mt-1 break-all">
                        {u.email || u.phone || u.id}
                        {u.isAdmin && <span className="ml-2 text-primary">管理员</span>}
                        {u.isBanned && <span className="ml-2 text-destructive">已封禁</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>发帖 {u._count?.posts ?? 0}</span>
                        <span>· 注册 {new Date(u.createdAt).toLocaleDateString('zh-CN')}</span>
                        <span>· 信用 {typeof u.creditScore === 'number' ? u.creditScore : '—'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={'/user/' + u.id} target="_blank" rel="noopener noreferrer">资料页</Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={creditBusyId === u.id || u.isAdmin}
                        onClick={() => handleUserCredit(u.id, -10)}
                      >
                        扣10分
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-800"
                        disabled={creditBusyId === u.id || u.isAdmin}
                        onClick={() => handleUserCredit(u.id, -30)}
                      >
                        扣30分
                      </Button>
                      {u.isBanned ? (
                        <Button variant="outline" size="sm" className="text-green-700 border-green-300" onClick={() => handleUserBan(u.id, false)}>
                          解封
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/40" onClick={() => handleUserBan(u.id, true)}>
                          封禁
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground max-w-2xl">
            封禁后用户无法发帖，仍可浏览（与全站逻辑一致）。不能封禁自己。
          </p>
        </div>
      )}
    </div>
  )
}
