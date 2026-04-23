import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import cloudinary from '@/lib/cloudinary'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '请先登录' }, { status: 401 })

  const formData = await req.formData()
  const files = formData.getAll('files') as File[]

  if (!files.length) return NextResponse.json({ error: '请选择图片' }, { status: 400 })
  if (files.length > 3) return NextResponse.json({ error: '最多上传3张图片' }, { status: 400 })

  const urls: string[] = []
  const publicIds: string[] = []

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString('base64')
    const dataUri = 'data:' + file.type + ';base64,' + base64

    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'classifieds',
      transformation: [
        { width: 1200, height: 900, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    })
    urls.push(result.secure_url)
    publicIds.push(result.public_id)
  }

  return NextResponse.json({ urls, publicIds })
}
