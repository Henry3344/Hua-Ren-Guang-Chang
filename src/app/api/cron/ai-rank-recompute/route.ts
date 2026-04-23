import { NextResponse } from 'next/server'
import { recomputeAiRankWeightsFromAggregates } from '@/lib/aiRankRecompute'

/**
 * 定时任务：聚合近 N 天交互并更新学习权重。
 * 鉴权：查询参数 `secret` 或 Header `x-cron-secret` 须与 CRON_SECRET 一致。
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET
  if (!expected) {
    return NextResponse.json({ error: 'CRON_SECRET 未配置' }, { status: 503 })
  }
  const url = new URL(req.url)
  const q = url.searchParams.get('secret')
  const h = req.headers.get('x-cron-secret')
  if (q !== expected && h !== expected) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const days = Number(url.searchParams.get('days') ?? process.env.AI_LTR_AGGREGATE_DAYS ?? '7')
  const result = await recomputeAiRankWeightsFromAggregates(Number.isFinite(days) ? days : 7)
  return NextResponse.json(result)
}
