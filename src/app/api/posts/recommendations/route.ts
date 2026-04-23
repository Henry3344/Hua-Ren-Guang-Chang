import { NextResponse } from 'next/server'
import { getRecommendations } from '@/lib/getRecommendations'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const data = await getRecommendations(searchParams)
  return NextResponse.json(data)
}

