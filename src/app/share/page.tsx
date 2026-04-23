import { headers } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ShareClient from './ShareClient'

async function getOriginFromHeaders(): Promise<string | null> {
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  if (!host) return null
  const proto = h.get('x-forwarded-proto') || 'https'
  return `${proto}://${host}`
}

export default async function SharePage() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as { id?: string } | undefined)?.id

  if (!userId) {
    return <ShareClient authed={false} />
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { inviteCode: true, freePinCredits: true },
  })

  const origin = await getOriginFromHeaders()
  const inviteCode = user?.inviteCode || ''
  const shareUrl = origin && inviteCode ? `${origin}/register?invite=${encodeURIComponent(inviteCode)}` : undefined

  return (
    <ShareClient
      authed={true}
      inviteCode={inviteCode}
      freePinCredits={user?.freePinCredits ?? undefined}
      shareUrl={shareUrl}
    />
  )
}

