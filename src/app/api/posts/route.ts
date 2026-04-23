import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { computeLevel } from '@/lib/level'
import { notifyFollowersNewPost } from '@/lib/notifications'
import { getPostsList } from '@/lib/getPostsList'
import { hasHighRiskDepositKeywords } from '@/lib/highRiskKeywords'

const SENSITIVE_WORDS = [
  '出售药物','卖药','处方药','毒品','大麻','cocaine','fentanyl','opioid',
  '枪支','firearms','weapon','炸弹','bomb','爆炸物',
  '色情','援交','陪睡','卖淫','escort','adult service',
  '洗钱','非法','走私','人口','trafficking',
  '假证','假钞','fake id','counterfeit',
]

function checkSensitive(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_WORDS.some(w => lower.includes(w.toLowerCase()))
}

function shouldAutoApprove(postCount: number, price: number | null, category: string, text: string): boolean {
  if (postCount < 3) return false
  if (checkSensitive(text)) return false
  if ((category === 'RENT' || category === 'RENT_SEEK') && price !== null && (price > 10000 || price < 1)) return false
  return true
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const viewerId = (session?.user as { id?: string } | undefined)?.id

  const { searchParams } = new URL(req.url)
  const data = await getPostsList(searchParams, viewerId)
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const {
    title,
    description,
    price,
    location,
    state,
    category,
    subCategory,
    contact,
    images,
    rentType,
    jobWorkType,
    jobTaxType,
    jobLanguage,
    jobSalaryUnit,
    itemCondition,
  } = await req.json()
  if (!title || !description || !location || !category || !contact) {
    return NextResponse.json({ error: '请填写所有必填项' }, { status: 400 })
  }

  const userId = (session.user as { id?: string } | undefined)?.id
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const account = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      creditScore: true,
      isDeleted: true,
      isBanned: true,
      invitedById: true,
      inviteRewardGrantedAt: true,
    },
  })
  if (!account || account.isDeleted || account.isBanned) {
    return NextResponse.json({ error: '账号状态异常，无法发布' }, { status: 403 })
  }
  if (account.creditScore <= 0) {
    return NextResponse.json({ error: '信用分过低，暂时无法发布（可继续浏览）' }, { status: 403 })
  }

  const fullText = title + ' ' + description
  const contactStr = String(contact ?? '')
  const hasDepositRisk = hasHighRiskDepositKeywords(`${fullText}\n${contactStr}`)

  const [userPostCount, todayPostCount] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.post.count({
      where: {
        userId,
        createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
  ])

  if (todayPostCount >= 5) {
    return NextResponse.json({ error: '您今日发帖已达上限（5条），请明天再试' }, { status: 429 })
  }

  const parsedPrice = price ? parseFloat(price) : null
  let autoApprove = shouldAutoApprove(userPostCount, parsedPrice, category, fullText)
  if (hasDepositRisk) autoApprove = false
  const isSensitive = checkSensitive(fullText)
  const status = autoApprove ? 'ACTIVE' : 'PENDING'

  const post = await prisma.post.create({
    data: {
      title,
      description,
      price: parsedPrice,
      location,
      category,
      contact,
      subCategory: subCategory || null,
      rentType: (category === 'RENT' || category === 'RENT_SEEK') ? rentType || null : null,
      jobWorkType: (category === 'JOB' || category === 'JOB_SEEK') ? jobWorkType || null : null,
      jobTaxType: (category === 'JOB' || category === 'JOB_SEEK') ? jobTaxType || null : null,
      jobLanguage: (category === 'JOB' || category === 'JOB_SEEK') ? jobLanguage || null : null,
      jobSalaryUnit:
        category === 'JOB_SEEK' && (jobSalaryUnit === 'HOURLY' || jobSalaryUnit === 'PER_VISIT')
          ? jobSalaryUnit
          : null,
      itemCondition: category === 'SECONDHAND' ? itemCondition || null : null,
      state: state || null,
      images: images || [],
      userId,
      status,
      isFlagged: isSensitive,
      highRiskKeywords: hasDepositRisk,
    },
  })

  notifyFollowersNewPost({
    authorId: userId,
    postId: post.id,
    postTitle: title,
    status,
  }).catch((e) => {
    console.error('notifyFollowersNewPost', e)
  })

  // 邀请奖励：被邀请用户首次发帖（创建成功）后，邀请人和被邀请人各获得 1 天免费置顶额度（只发放一次）
  if (userPostCount === 0 && account.invitedById && !account.inviteRewardGrantedAt) {
    const now = new Date()
    await prisma.$transaction(async (tx) => {
      const updated = await tx.user.updateMany({
        where: { id: userId, inviteRewardGrantedAt: null, invitedById: account.invitedById },
        data: { inviteRewardGrantedAt: now, freePinCredits: { increment: 1 } },
      })
      if (updated.count === 1) {
        await tx.user.updateMany({
          where: { id: account.invitedById as string, isDeleted: false, isBanned: false },
          data: { freePinCredits: { increment: 1 } },
        })
      }
    })
  }

  const [pc, agg] = await Promise.all([
    prisma.post.count({ where: { userId } }),
    prisma.post.aggregate({ where: { userId }, _sum: { viewCount: true } }),
  ])
  await prisma.user.update({
    where: { id: userId },
    data: { level: computeLevel(pc, agg._sum.viewCount ?? 0) },
  })

  return NextResponse.json({ success: true, post, status })
}
