'use client'

import { usePathname } from 'next/navigation'
import TopBar from './TopBar'
import BottomNav from './BottomNav'
import Footer from './Footer'

const HIDE_NAV_ROUTES = ['/login']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = HIDE_NAV_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="relative min-h-screen">
      <TopBar />
      <main className="pb-72">
        {children}
      </main>
      <Footer />
      {!hideNav && <BottomNav />}
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-60 blur-[120px]" aria-hidden />
    </div>
  )
}
