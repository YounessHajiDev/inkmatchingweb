"use client"

import Link from 'next/link'
import { useLocale } from '@/hooks/useLocale'

export default function Footer() {
  const { t, locale, setLocale } = useLocale()

  return (
    <footer className="mt-16 border-t border-white/5 bg-white/[0.01] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-semibold text-white">InkMatch</div>
            <div className="text-sm text-ink-text-muted">{t('tattoo_market')}</div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-ink-text-muted">
            <Link href="/discover" className="hover:text-white">{t('discover_label')}</Link>
            <Link href="/pricing" className="hover:text-white">{t('pricing')}</Link>
            <Link href="/about" className="hover:text-white">{t('about_label') || 'About'}</Link>
            <Link href="/privacy" className="hover:text-white">{t('privacy_label') || 'Privacy'}</Link>
            <Link href="/terms" className="hover:text-white">{t('terms_label') || 'Terms'}</Link>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-ink-text-muted">{t('language')}</label>
            <select value={locale} onChange={(e) => setLocale(e.target.value as any)} className="bg-transparent border border-white/5 rounded px-2 py-1 text-sm">
              <option value="en">EN</option>
              <option value="fr">FR</option>
            </select>
          </div>
        </div>

        <div className="mt-6 border-t border-white/5 pt-4 text-sm text-ink-text-muted">
          <div className="flex items-center justify-between">
            <div>© {new Date().getFullYear()} InkMatch</div>
            <div>{t('copyright_notice') || 'All rights reserved.'}</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
