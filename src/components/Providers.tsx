'use client'
import { SessionProvider } from 'next-auth/react'
import { SiteLocationProvider } from '@/contexts/SiteLocationContext'
import VisitTracker from '@/components/VisitTracker'
import ScrollToTopOnRouteChange from '@/components/ScrollToTopOnRouteChange'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider basePath="/api/auth">
      <SiteLocationProvider>
        <VisitTracker />
        <ScrollToTopOnRouteChange />
        {children}
      </SiteLocationProvider>
    </SessionProvider>
  )
}
