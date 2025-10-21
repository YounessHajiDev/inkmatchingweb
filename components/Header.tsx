'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try { await signOut(auth); router.push('/') } catch (e) { console.error(e) }
  }

  return (
    <header className="bg-ink-surface border-b border-ink-muted">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/" className="text-white hover:text-ink-accent font-semibold">Discover</Link>
            <Link href="/map" className="text-white hover:text-ink-accent">Map</Link>
            <Link href="/leads" className="text-white hover:text-ink-accent">Leads</Link>
            <Link href="/calendar" className="text-white hover:text-ink-accent">Calendar</Link>
            <Link href="/stencils" className="text-white hover:text-ink-accent">Stencils</Link>
            <Link href="/aftercare" className="text-white hover:text-ink-accent">Aftercare</Link>
          </div>
          <div className="flex items-center space-x-4">
            {!loading && (
              user ? (
                <>
                  <span className="text-gray-400 text-sm">{user.email}</span>
                  <button onClick={handleSignOut} className="btn btn-primary text-sm">Sign Out</button>
                </>
              ) : (
                <Link href="/login" className="btn btn-primary text-sm">Login</Link>
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
