'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SparklesIcon, MapIcon, PencilSquareIcon, ChatBubbleOvalLeftEllipsisIcon, HeartIcon, InboxIcon, CalendarDaysIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  exact?: boolean
}

const guestNav: NavItem[] = [
  { href: '/', label: 'Discover', icon: SparklesIcon },
  { href: '/map', label: 'Explore', icon: MapIcon },
  { href: '/stencils', label: 'Stencils', icon: PencilSquareIcon },
]

const clientNav: NavItem[] = [
  { href: '/', label: 'Discover', icon: SparklesIcon },
  { href: '/map', label: 'Explore', icon: MapIcon },
  { href: '/stencils', label: 'Stencils', icon: PencilSquareIcon },
  { href: '/aftercare', label: 'Aftercare', icon: HeartIcon },
  { href: '/chat', label: 'Chat', icon: ChatBubbleOvalLeftEllipsisIcon },
]

const artistNav: NavItem[] = [
  { href: '/leads', label: 'Leads', icon: InboxIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  { href: '/stencils', label: 'Stencils', icon: PencilSquareIcon },
  { href: '/aftercare', label: 'Aftercare', icon: HeartIcon },
  { href: '/chat', label: 'Chat', icon: ChatBubbleOvalLeftEllipsisIcon },
]

const adminNav: NavItem[] = [
  { href: '/', label: 'Discover', icon: SparklesIcon },
  { href: '/map', label: 'Explore', icon: MapIcon },
  { href: '/stencils', label: 'Stencils', icon: PencilSquareIcon },
  { href: '/chat', label: 'Chat', icon: ChatBubbleOvalLeftEllipsisIcon },
  { href: '/admin', label: 'Admin', icon: Cog6ToothIcon },
]

function navFor(role: string | null, authenticated: boolean): NavItem[] {
  if (!authenticated) return guestNav
  if (role === 'artist') return artistNav
  if (role === 'client') return clientNav
  if (role === 'admin') return adminNav
  return clientNav
}

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { role } = useUserRole()

  const items = navFor(role ?? null, Boolean(user))
  if (items.length === 0) return null

  return (
    <nav className="pointer-events-none fixed bottom-6 left-1/2 z-40 w-full max-w-3xl -translate-x-1/2 px-4 sm:px-0">
      <div className="pointer-events-auto relative mx-auto flex items-center justify-between gap-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-3 shadow-glow-soft backdrop-blur-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'group relative flex flex-1 flex-col items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                isActive ? 'text-white' : 'text-ink-text-muted hover:text-white'
              )}
            >
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full">
                {isActive && (
                  <span className="absolute inset-0 rounded-full bg-ink-accent/20 blur-[14px]" />
                )}
                <span
                  className={clsx(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.08] transition',
                    isActive && 'border-ink-accent/50 bg-gradient-to-br from-white/15 to-white/5 text-white shadow-glow'
                  )}
                >
                  <Icon className={clsx('h-5 w-5', isActive ? 'text-white' : 'text-ink-text-muted group-hover:text-white')} />
                </span>
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
