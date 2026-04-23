'use client'
import { SessionProvider } from 'next-auth/react'
import { SiteLocationProvider } from '@/contexts/SiteLocationContext'
import VisitTracker from '@/components/VisitTracker'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <SiteLocationProvider>
        <VisitTracker />
        {children}
      </SiteLocationProvider>
    </SessionProvider>
  )
}
