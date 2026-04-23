'use client'
import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, Clock } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import LocationPicker from '@/components/LocationPicker'
import BackToPrev from '@/components/BackToPrev'
import { useUnsavedLeaveGuard } from '@/hooks/useUnsavedLeaveGuard'
import {
  subCategoryButtonLabel,
  jobLangButtonLabel,
  formatJobSeekPriceSummary,
} from '@/lib/postDisplay'

const categories = [
  { value: 'RENT', label: '租房', altValue: 'RENT_SEEK', altLabel: '找房' },
  { value: 'JOB', label: '招聘', altValue: 'JOB_SEEK', altLabel: '找工' },
  { value: 'SECONDHAND', label: '二手' },
]

const subCategories: Record<string, string[]> = {
  RENT: ['整租', '合租', '单房', '床位', '车位', '商铺/办公室', '短租/民宿'],
  RENT_SEEK: ['整租', '合租', '单房', '床位', '车位', '商铺/办公室', '短租/民宿'],
  JOB: ['餐饮服务', '零售门店', '美容美发', '办公/IT', '医疗/保健', '教育/培训', '运输/搬家', '建筑/装修', '其他'],
  JOB_SEEK: ['餐饮服务', '零售门店', '美容美发', '办公/IT', '医疗/保健', '教育/培训', '运输/搬家', '建筑/装修', '其他'],
  SECONDHAND: ['手机数码', '家具家电', '服装箱包', '母婴玩具', '汽车配件', '餐饮设备', '乐器/运动', '其他'],
}

const RENT_TYPES = ['公寓', '独栋', '联排公寓', '康斗', '半土库', '阁楼']
const JOB_WORK_TYPES = ['兼职', '全职']
const JOB_TAX_TYPES = ['全税', '现金']
const JOB_LANGS = ['无要求（普通话）', '中英双语（基本）', '中英双语（流利）']
const ITEM_CONDITIONS = ['几乎全新', '明显使用', '明显瑕疵']

const IMAGE_HINT_BY_CATEGORY: Record<string, string> = {
  JOB: '上传门面照片或工作环境获得更大曝光量（注意保护隐私）',
  RENT: '上传相应室内照片获得更大曝光量与入住意愿（注意保护隐私）',
  SECONDHAND: '上传相应的物品照片获得更高曝光量与购买欲（注意保护隐私）',
  RENT_SEEK: '可上传参考图或户型偏好示意（注意保护隐私与版权）',
  JOB_SEEK: '可上传简历截图或作品节选（注意脱敏与隐私）',
}

const WARNINGS = [
  '严禁发布任何处方药、管制药物、毒品相关内容（违反美国联邦法律）',
  '严禁发布枪支、弹药、爆炸物相关内容',
  '严禁发布色情、援交、成人陪伴服务相关内容',
  '严禁发布假证件、假货币、仿冒品',
  '严禁发布人口贩卖、非法劳工相关内容',
  '严禁诈骗、洗钱及任何违法金融活动',
  '请勿要求对方预付押金，谨防诈骗',
  '请确保标题/描述/价格/照片尽可能与实际相符，否则可能被举报并面临封号风险',
]

export default function NewPostPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pinHelpOpen, setPinHelpOpen] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'RENT',
    subCategory: '',
    contact: '',
    rentType: '',
    jobWorkType: '',
    jobTaxType: '',
    jobLanguage: '无要求（普通话）',
    itemCondition: '',
    jobSalaryUnit: '' as '' | 'HOURLY' | 'PER_VISIT',
  })
  const [location, setLocation] = useState({ state: '', city: '', area: '' })
  const [images, setImages] = useState<string[]>([])
  const [pinOnPublish, setPinOnPublish] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [agreeError, setAgreeError] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [stepError, setStepError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState<{ status: string; postId: string } | null>(null)

  const isDirty = useMemo(() => {
    if (submitted) return false
    if (step > 0) return true
    if (form.category !== 'RENT') return true
    if (form.subCategory) return true
    if (form.title.trim()) return true
    if (form.description.trim()) return true
    if (form.price.trim()) return true
    if (form.contact.trim()) return true
    if (form.rentType) return true
    if (form.jobWorkType) return true
    if (form.jobTaxType) return true
    if (form.jobLanguage !== '无要求（普通话）') return true
    if (form.itemCondition) return true
    if (form.jobSalaryUnit) return true
    if (location.state || location.city || location.area) return true
    if (images.length) return true
    if (agreed) return true
    if (pinOnPublish) return true
    return false
  }, [submitted, step, form, location, images, agreed, pinOnPublish])

  const { onBeforeNavigate, LeaveDialog } = useUnsavedLeaveGuard({
    isDirty,
    message: '将离开发帖页面，所有填写内容将不会保留，确认离开吗？',
  })

  if (status === 'loading') return <div className="text-center py-20">加载中...</div>
  if (!session) return (
    <div className="text-center py-20">
      <p className="mb-4 text-muted-foreground">请先登录后再发布</p>
      <Button asChild><Link href="/login">去登录</Link></Button>
    </div>
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agreed) { setAgreeError(true); return }
    if (!form.title || !form.description || !location.state || !form.contact || !form.subCategory) {
      setError('请填写所有必填项'); return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        location: [location.state, location.city, location.area].filter(Boolean).join(' · '),
        state: location.state,
        images,
        pinOnPublish,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || '发布失败'); return }

    if (pinOnPublish) {
      const stripeRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'POST_PIN', postId: data.post.id }),
      })
      const stripeData = await stripeRes.json()
      if (stripeData.url) { window.location.href = stripeData.url; return }
      if (stripeData.pinned) {
        const ft = stripeData.freeType === 'trial' ? 'trial' : stripeData.freeType === 'credit' ? 'credit' : ''
        router.push('/dashboard?pinned=1' + (ft ? `&free=${ft}` : ''))
        return
      }
    }
    setSubmitted({ status: data.status, postId: data.post.id })
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-safe py-20 text-center">
        {submitted.status === 'ACTIVE' ? (
          <>
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">发布成功！</h2>
            <p className="text-muted-foreground mb-6">您的帖子已上线，其他用户可以看到了。</p>
          </>
        ) : (
          <>
            <Clock className="w-14 h-14 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">提交成功，等待审核</h2>
            <p className="text-muted-foreground mb-6">审核通常在 24 小时内完成。</p>
          </>
        )}
        <div className="flex gap-3 justify-center">
          <Button asChild variant="outline"><Link href="/posts">浏览帖子</Link></Button>
          <Button asChild><Link href={'/posts/' + submitted.postId}>查看我的帖子</Link></Button>
        </div>
      </div>
    )
  }

  const field = 'w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary'
  const priceLabel =
    form.category === 'JOB'
      ? '时薪（选填）'
      : form.category === 'JOB_SEEK'
        ? '期望薪资（选填）'
        : form.category === 'RENT_SEEK'
          ? '期望月租（选填）'
          : '价格（选填）'
  const descLabel = form.category === 'JOB_SEEK' ? '自我介绍' : '详情描述'
  const imageHint = IMAGE_HINT_BY_CATEGORY[form.category] || IMAGE_HINT_BY_CATEGORY.RENT
  const subs = subCategories[form.category] || []
  const isRentLike = form.category === 'RENT' || form.category === 'RENT_SEEK'
  const isJobLike = form.category === 'JOB' || form.category === 'JOB_SEEK'
  const isRentSeek = form.category === 'RENT_SEEK'
  const isRentPost = form.category === 'RENT'
  const isJobSeek = form.category === 'JOB_SEEK'
  const isJobPost = form.category === 'JOB'
  const isSecondhand = form.category === 'SECONDHAND'
  const imagesEnabled = form.category !== 'RENT_SEEK' && form.category !== 'JOB_SEEK'
  const contactStep = imagesEnabled ? 6 : 5
  const submitStep = imagesEnabled ? 7 : 6

  function setCategoryBase(base: 'RENT' | 'JOB' | 'SECONDHAND') {
    if (base === 'RENT') {
      const next = isRentLike ? form.category : 'RENT'
      setForm({ ...form, category: next, subCategory: '', jobSalaryUnit: '' })
    } else if (base === 'JOB') {
      const next = isJobLike ? form.category : 'JOB'
      setForm({ ...form, category: next, subCategory: '', jobSalaryUnit: '' })
    } else {
      setForm({ ...form, category: 'SECONDHAND', subCategory: '', jobSalaryUnit: '' })
    }
  }

  function toggleAlt(on: boolean) {
    if (isRentLike) {
      setForm({ ...form, category: on ? 'RENT_SEEK' : 'RENT', subCategory: '', jobSalaryUnit: '' })
    } else if (isJobLike) {
      setForm({ ...form, category: on ? 'JOB_SEEK' : 'JOB', subCategory: '', jobSalaryUnit: '' })
    }
  }

  function completeCurrentStep() {
    setStepError('')
    if (step === 0) {
      if (!form.subCategory) {
        setStepError('请先选择子分类')
        return
      }
    }
    if (step === 2) {
      if (!form.title.trim()) {
        setStepError('请填写标题')
        return
      }
    }
    if (step === 3) {
      if (!form.description.trim()) {
        setStepError(form.category === 'JOB_SEEK' ? '请填写自我介绍' : '请填写详情描述')
        return
      }
    }
    if (step === 4) {
      if (!location.state) {
        setStepError('请选择地区（州/城市）')
        return
      }
      if (!imagesEnabled) {
        setStep(contactStep)
        return
      }
    }
    if (step === contactStep) {
      if (!form.contact.trim()) {
        setStepError('请填写联系方式')
        return
      }
    }
    setStep((s) => s + 1)
  }

  function editStep(idx: number) {
    setStepError('')
    setStep(idx)
  }

  return (
    <div className="max-w-2xl mx-auto px-safe py-8">
      {LeaveDialog}
      <BackToPrev className="mb-4" onBeforeNavigate={onBeforeNavigate} />
      <h1 className="text-2xl font-bold mb-6">发布信息</h1>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="font-semibold text-red-800 text-sm mb-2">⚠️ 发布前请阅读：严禁发布以下内容</div>
        <ul className="space-y-1">
          {WARNINGS.map((w, i) => (
            <li key={i} className="text-xs text-red-700 flex items-start gap-1.5">
              <span className="mt-0.5 shrink-0">•</span>{w}
            </li>
          ))}
        </ul>
      </div>

      <div className="border rounded-xl p-6 bg-card shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Step 0: Category */}
          {step > 0 ? (
            <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">已选择</div>
                <div className="font-medium text-sm truncate">
                  {isRentLike ? (form.category === 'RENT' ? '租房' : '找房') : isJobLike ? (form.category === 'JOB' ? '招聘' : '找工') : '二手'}
                  {form.subCategory ? ' · ' + subCategoryButtonLabel(form.category, form.subCategory) : ''}
                </div>
              </div>
              <button type="button" onClick={() => editStep(0)} className="text-xs text-primary hover:underline shrink-0">
                编辑
              </button>
            </div>
          ) : (
            <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">第 1 步：选择分类</div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">大类 <span className="text-destructive">*</span></label>
                <div className="flex gap-2">
                  {categories.map((cat) => {
                    const active =
                      (cat.value === 'RENT' && isRentLike) ||
                      (cat.value === 'JOB' && isJobLike) ||
                      (cat.value === 'SECONDHAND' && isSecondhand)
                    return (
                      <button
                        type="button"
                        key={cat.value}
                        onClick={() =>
                          setCategoryBase(cat.value as 'RENT' | 'JOB' | 'SECONDHAND')
                        }
                        className={
                          'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ' +
                          (active ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')
                        }
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {(isRentLike || isJobLike) && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    {isRentLike ? '你是房东还是求租？' : '你是招聘方还是求职者？'}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleAlt(false)}
                      className={
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ' +
                        ((form.category === 'RENT' || form.category === 'JOB')
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'hover:bg-accent')
                      }
                    >
                      {isRentLike ? '出租房源' : '发布招聘'}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleAlt(true)}
                      className={
                        'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ' +
                        ((form.category === 'RENT_SEEK' || form.category === 'JOB_SEEK')
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'hover:bg-accent')
                      }
                    >
                      {isRentLike ? '求租/找房' : '求职/找工'}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {isRentLike
                      ? isRentSeek
                        ? '求租帖与出租帖使用相同房型分类，方便双方互相匹配。'
                        : '出租请选择与实际房源一致的类型。'
                      : isJobSeek
                        ? '求职帖与招聘帖使用相同行业标签，方便招聘方浏览。'
                        : '招聘请选择与实际岗位最接近的行业。'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-1.5 block">
                  {isRentSeek
                    ? '想找哪一类？'
                    : isRentPost
                      ? '房源类型'
                      : isJobSeek
                        ? '意向行业 / 方向'
                        : isJobPost
                          ? '行业 / 岗位类型'
                          : '子分类'}{' '}
                  <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {subs.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setForm({ ...form, subCategory: s })}
                      className={
                        'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                        (form.subCategory === s ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')
                      }
                    >
                      {subCategoryButtonLabel(form.category, s)}
                    </button>
                  ))}
                </div>
                {!form.subCategory && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRentSeek || isJobSeek ? '选一项即可继续；与列表筛选一致。' : '请选择一个子分类'}
                  </p>
                )}
              </div>
              {stepError && <div className="text-sm text-destructive">{stepError}</div>}
              <Button type="button" className="w-full" onClick={completeCurrentStep}>
                确定，下一步
              </Button>
            </div>
          )}

          {/* Step 1: Optional filters */}
          {step >= 1 && (
            step > 1 ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">筛选（可选）</div>
                  <div className="text-sm text-muted-foreground">
                    {isRentLike &&
                      (form.rentType
                        ? `${isRentSeek ? '倾向形态' : '房源形态'}：${form.rentType}`
                        : '未选择')}
                    {isJobLike &&
                      ([
                        form.jobWorkType && `${isJobSeek ? '期望形式' : '工作类型'}：${form.jobWorkType}`,
                        form.jobTaxType && `${isJobSeek ? '报税偏好' : '报税'}：${form.jobTaxType}`,
                        form.jobLanguage &&
                          `${isJobSeek ? '语言' : '语言要求'}：${jobLangButtonLabel(form.category, form.jobLanguage)}`,
                      ]
                        .filter(Boolean)
                        .join(' · ') ||
                        '未选择')}
                    {isSecondhand && (form.itemCondition ? `物品状态：${form.itemCondition}` : '未选择')}
                  </div>
                </div>
                <button type="button" onClick={() => editStep(1)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 2 步：补充信息（选填）</div>
                {isRentLike && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      {isRentSeek ? '更倾向的房屋形态（选填）' : '房源形态（选填）'}
                    </label>
                    <p className="text-xs text-muted-foreground mb-2">
                      {isRentSeek
                        ? '公寓、独栋等指建筑形态；不选表示不限制。'
                        : '与实际出租房屋一致即可，便于租客理解。'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, rentType: '' })}
                        className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                          (!form.rentType ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                      >
                        不限
                      </button>
                      {RENT_TYPES.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setForm({ ...form, rentType: t })}
                          className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                            (form.rentType === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {isJobLike && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {isJobSeek ? '期望用工形式（选填）' : '工作类型（选填）'}
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isJobSeek ? '兼职 / 全职；不选表示都可以谈。' : '岗位是兼职还是全职。'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, jobWorkType: '' })}
                          className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                            (!form.jobWorkType ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                        >
                          不限
                        </button>
                        {JOB_WORK_TYPES.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setForm({ ...form, jobWorkType: t })}
                            className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                              (form.jobWorkType === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {isJobSeek ? '可接受的报税 / 发薪方式（选填）' : '报税类型（选填）'}
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isJobSeek
                          ? '填写你能接受的方式，便于与招聘方预期对齐。'
                          : '岗位实际发薪方式，便于求职者判断。'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, jobTaxType: '' })}
                          className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                            (!form.jobTaxType ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                        >
                          不限
                        </button>
                        {JOB_TAX_TYPES.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setForm({ ...form, jobTaxType: t })}
                            className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                              (form.jobTaxType === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1.5 block">
                        {isJobSeek ? '我能使用的语言（选填）' : '语言要求'}
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        {isJobSeek ? '方便招聘方了解你的沟通方式。' : '岗位对语言的要求。'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {JOB_LANGS.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setForm({ ...form, jobLanguage: t })}
                            className={
                              'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                              (form.jobLanguage === t
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'hover:bg-accent')
                            }
                          >
                            {jobLangButtonLabel(form.category, t)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                {isSecondhand && (
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">物品状态（选填）</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, itemCondition: '' })}
                        className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                          (!form.itemCondition ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                      >
                        不限
                      </button>
                      {ITEM_CONDITIONS.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setForm({ ...form, itemCondition: t })}
                          className={'px-3 py-1.5 rounded-lg text-sm border transition-colors ' +
                            (form.itemCondition === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button type="button" className="w-full" variant="secondary" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 2: Title */}
          {step >= 2 && (
            step > 2 ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">标题</div>
                  <div className="font-medium text-sm truncate">{form.title || '—'}</div>
                </div>
                <button type="button" onClick={() => editStep(2)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 3 步：填写标题</div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">标题 <span className="text-destructive">*</span></label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); completeCurrentStep() } }}
                    className={field}
                    placeholder="简洁明了的标题"
                    required
                  />
                </div>
                {stepError && <div className="text-sm text-destructive">{stepError}</div>}
                <Button type="button" className="w-full" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 3: Description */}
          {step >= 3 && (
            step > 3 ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">{descLabel}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2 whitespace-pre-wrap">{form.description || '—'}</div>
                </div>
                <button type="button" onClick={() => editStep(3)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 4 步：{descLabel}</div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{descLabel} <span className="text-destructive">*</span></label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className={field + ' min-h-[120px] resize-y'}
                    placeholder={form.category === 'JOB_SEEK' ? '介绍你的技能、经验、可上班时间...' : '详细描述...'}
                    required
                  />
                </div>
                {stepError && <div className="text-sm text-destructive">{stepError}</div>}
                <Button type="button" className="w-full" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 4: Price + Location */}
          {step >= 4 && (
            step > 4 ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">价格/地区</div>
                  <div className="text-sm text-muted-foreground">
                    {form.category === 'JOB_SEEK'
                      ? formatJobSeekPriceSummary(form.price, form.jobSalaryUnit)
                      : form.price
                        ? `$${form.price}`
                        : '面议/不填'}{' '}
                    · {[location.state, location.city, location.area].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <button type="button" onClick={() => editStep(4)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 5 步：填写价格与地区</div>
                <div className="grid grid-cols-2 gap-4 items-start">
                  <div className="col-span-2 sm:col-span-1">
                    {isJobSeek && (
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
                    <label className="text-sm font-medium mb-1.5 block">{priceLabel}</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <input
                        type="number"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className={field + ' pl-7'}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    {(form.category === 'JOB' || form.category === 'JOB_SEEK') && (
                      <p className="text-xs text-muted-foreground mt-1">留空表示面议</p>
                    )}
                    {form.category === 'RENT_SEEK' && (
                      <p className="text-xs text-muted-foreground mt-1">填写期望月租；留空表示面议或写在描述里</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium mb-1.5 block">地区 <span className="text-destructive">*</span></label>
                    <LocationPicker value={location} onChange={setLocation} />
                  </div>
                </div>
                {stepError && <div className="text-sm text-destructive">{stepError}</div>}
                <Button type="button" className="w-full" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 5: Images (optional, hidden for 找工/找房) */}
          {step >= 5 && imagesEnabled && (
            step > 5 ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">图片（选填）</div>
                  <div className="text-sm text-muted-foreground">{images.length ? `已上传 ${images.length} 张` : '未上传'}</div>
                </div>
                <button type="button" onClick={() => editStep(5)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 6 步：上传图片（选填）</div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">图片（选填，最多 3 张）</label>
                  <ImageUpload value={images} onChange={setImages} max={3} />
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{imageHint}</p>
                </div>
                <Button type="button" className="w-full" variant="secondary" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 6: Contact */}
          {step >= contactStep && (
            step > contactStep ? (
              <div className="border rounded-xl p-4 bg-muted/20 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-muted-foreground">联系方式</div>
                  <div className="text-sm text-muted-foreground truncate">{form.contact || '—'}</div>
                </div>
                <button type="button" onClick={() => editStep(contactStep)} className="text-xs text-primary hover:underline shrink-0">
                  编辑
                </button>
              </div>
            ) : (
              <div className="border rounded-xl p-4 bg-muted/10 space-y-3">
                <div className="font-semibold text-sm">第 {contactStep + 1} 步：填写联系方式</div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">联系方式 <span className="text-destructive">*</span></label>
                  <input
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); completeCurrentStep() } }}
                    className={field}
                    placeholder="电话 / 微信号 / 邮箱"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">电话显示为拨号按钮，微信号显示为一键复制</p>
                </div>
                {stepError && <div className="text-sm text-destructive">{stepError}</div>}
                <Button type="button" className="w-full" onClick={completeCurrentStep}>
                  确定，下一步
                </Button>
              </div>
            )
          )}

          {/* Step 7: Pin + Agree + Submit */}
          {step >= submitStep && (
            <div className="border rounded-xl p-4 bg-muted/10 space-y-4">
              <div className="font-semibold text-sm">第 {submitStep + 1} 步：确认并发布</div>

              <div className="border rounded-xl p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="pin" checked={pinOnPublish} onChange={e => setPinOnPublish(e.target.checked)}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-primary" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label htmlFor="pin" className="text-sm font-medium cursor-pointer">
                        发布后立即置顶 30 天
                      </label>
                      <button
                        type="button"
                        onClick={() => setPinHelpOpen((v) => !v)}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-200 text-yellow-800 text-sm font-bold leading-none"
                        aria-expanded={pinHelpOpen}
                        aria-controls="pin-help"
                        title="说明"
                      >
                        ?
                      </button>
                    </div>
                    {pinHelpOpen && (
                      <div id="pin-help" className="mt-2 rounded-lg border bg-background/70 p-3 text-xs text-muted-foreground leading-relaxed">
                        置顶后，帖子会在所在地区首页及分类页更靠前展示，提升曝光与成交机会。
                        <br />
                        每个账号首次使用置顶，可免费体验<strong className="font-semibold text-foreground"> 5 小时</strong>（不用会一直保留；用过后下次勾选将跳转付款）。
                        <br />
                        如账号有邀请奖励等<strong className="font-semibold text-foreground">免费置顶额度（按天）</strong>，系统会自动优先使用免费额度。
                      </div>
                    )}
                    <p className="text-xs text-yellow-700 mt-0.5">
                      勾选后点击发布：若仍有 5 小时试用或免费额度，会自动置顶；否则跳转付款，完成后立即生效。
                    </p>
                  </div>
                </div>
              </div>

              <div className={('border rounded-xl p-4 transition-colors ') + (agreeError ? 'border-destructive bg-red-50' : 'bg-muted/30')}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" id="agree" checked={agreed}
                    onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setAgreeError(false) }}
                    className="mt-0.5 w-4 h-4 cursor-pointer accent-primary" />
                  <label htmlFor="agree" className={'text-xs cursor-pointer leading-relaxed ' + (agreeError ? 'text-destructive' : 'text-muted-foreground')}>
                    我确认即将发布的内容不含任何违法信息，不涉及诈骗、毒品、枪支、色情、人口贩卖等违禁内容；并确保标题/描述/价格/照片尽可能与实际相符（否则可能被举报并面临封号风险）。我理解并同意为所发布内容承担全部法律责任，华人广场平台不对用户发布内容负责。
                    {agreeError && <span className="block mt-1 font-medium text-destructive">← 请先勾选同意后再发布</span>}
                  </label>
                </div>
              </div>

              {error && <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}
                onClick={() => { if (!agreed) setAgreeError(true) }}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {agreed ? '发布' : '请先同意上方条款'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
