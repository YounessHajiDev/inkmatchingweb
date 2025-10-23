'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'

export default function Header() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useLocale()

  const handleSignOut = async () => {
    try { await signOut(auth); router.push('/') } catch (e) { console.error(e) }
  }

  return (
    <header className="bg-ink-surface border-b border-ink-muted">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/" className="text-white hover:text-ink-accent font-semibold">{t('discover_label')}</Link>
            <Link href="/map" className="text-white hover:text-ink-accent">{t('map_label') ?? 'Map'}</Link>
            <Link href="/leads" className="text-white hover:text-ink-accent">{t('leads_label') ?? 'Leads'}</Link>
            <Link href="/calendar" className="text-white hover:text-ink-accent">{t('calendar_label') ?? 'Calendar'}</Link>
            <Link href="/stencils" className="text-white hover:text-ink-accent">{t('stencils_label') ?? 'Stencils'}</Link>
            <Link href="/aftercare" className="text-white hover:text-ink-accent">{t('aftercare_label') ?? 'Aftercare'}</Link>
          </div>
          <div className="flex items-center space-x-4">
            {!loading && (
              user ? (
                <>
                  <span className="text-gray-400 text-sm">{user.email}</span>
                  <button onClick={handleSignOut} className="btn btn-primary text-sm">{t('sign_out')}</button>
                </>
              ) : (
                <Link href="/login" className="btn btn-primary text-sm">{t('sign_in')}</Link>
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}
