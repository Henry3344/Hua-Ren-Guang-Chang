import { notFound } from 'next/navigation'
import { getPostDetailForRsc } from '@/lib/getPostDetailPublic'
import PostDetailClient from './PostDetailClient'

export const revalidate = 60

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const initialPost = await getPostDetailForRsc(id)
  if (!initialPost) notFound()
  return <PostDetailClient postId={id} initialPost={initialPost} />
}
