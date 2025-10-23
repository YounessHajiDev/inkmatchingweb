'use client'

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { ArrowRightOnRectangleIcon, Cog6ToothIcon, PaperAirplaneIcon, PlusCircleIcon, UserCircleIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { useUserRole } from '@/hooks/useUserRole'

function initialsFromEmail(email?: string | null) {
  if (!email) return '?'
  const [name] = email.split('@')
  if (!name) return email.slice(0, 1).toUpperCase()
  return name
    .split(/[.\-_]/)
    .filter(Boolean)
    .map((segment) => segment[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function TopBar() {
  const { user } = useAuth()
  const { role } = useUserRole()
  const pathname = usePathname()
  
  // Artists go to /leads, others go to homepage
  const homeLink = role === 'artist' ? '/leads' : '/'
  
  const actionIcon = useMemo(() => {
    if (pathname.startsWith('/map')) return <PaperAirplaneIcon className="h-5 w-5" />
    if (pathname.startsWith('/chat')) return <PlusCircleIcon className="h-5 w-5" />
    return <PaperAirplaneIcon className="h-5 w-5" />
  }, [pathname])

  return (
    <header className="relative z-30 border-b border-white/5 bg-white/[0.02] backdrop-blur-lg">
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-transparent to-transparent" />
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Link href={homeLink} className="group flex items-end gap-3">
          <div className="relative">
            <span className="text-[1.8rem] font-semibold tracking-tight text-white transition-colors group-hover:text-ink-accent">InkMatch</span>
            <span className="absolute -top-2 -right-4 text-sm text-ink-accent">✶</span>
          </div>
          <span className="hidden text-[0.6rem] font-semibold uppercase tracking-[0.5em] text-ink-text-muted sm:inline-flex">
            Tattoo Market
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-ink-text">
            <Link href="/pricing" className="hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/discover" className="hover:text-white transition-colors">
              Discover
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/settings"
                className="pill hover:border-ink-accent/60 hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white shadow-inner">
                  {initialsFromEmail(user.email)}
                </span>
                <span className="hidden text-sm font-semibold text-white sm:block">
                  {user.email}
                </span>
                <Cog6ToothIcon className="h-5 w-5 text-ink-accent" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup/role"
                  className="pill hover:border-ink-accent/60 hover:text-white"
                >
                  <UserPlusIcon className="h-5 w-5 text-ink-accent" />
                  <span className="hidden text-sm font-semibold text-white sm:block">Join us</span>
                </Link>
                <Link
                  href="/login"
                  className="btn btn-primary"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
