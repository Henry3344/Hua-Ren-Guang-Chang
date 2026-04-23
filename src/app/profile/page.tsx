'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ProfileRedirectPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
      return
    }
    if (status === 'authenticated' && session?.user) {
      const id = (session.user as { id?: string }).id
      if (id) {
        router.replace('/user/' + id)
        return
      }
      router.replace('/login?callbackUrl=/profile&error=NoUserId')
    }
  }, [status, session, router])

  return <div className="text-center py-20 text-muted-foreground">跳转中...</div>
}
