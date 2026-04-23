'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

export default function DeleteButton({ postId, userId }: { postId: string; userId: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const me = session?.user?.id
  const isAdmin = session?.user?.isAdmin
  if (!session || (me !== userId && !isAdmin)) return null

  async function handleDelete() {
    if (!confirm('确定要删除这条帖子吗？')) return
    setLoading(true)
    await fetch('/api/posts/' + postId, { method: 'DELETE' })
    router.push('/posts')
    router.refresh()
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
      <Trash2 className="w-4 h-4 mr-1" />删除
    </Button>
  )
}
