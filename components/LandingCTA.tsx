"use client"

import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'

export default function LandingCTA() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-ink-accent/[0.08] via-ink-bg-soft to-ink-accent-strong/[0.06] p-12 text-center sm:p-20">
          {/* Decorative glows */}
          <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-ink-accent/10 blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-ink-accent-strong/10 blur-3xl" aria-hidden />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              {t('landing_cta_title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-text-muted">
              {t('landing_cta_subtitle')}
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <button
                onClick={() => router.push('/signup/role')}
                className="btn btn-primary btn-lg shadow-glow text-base"
              >
                {t('landing_cta_button')}
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="btn btn-secondary btn-lg text-base"
              >
                {t('landing_cta_secondary')}
              </button>
            </div>

            <p className="mt-6 text-xs text-ink-text-muted">
              {t('no_credit_card_required')} &middot; {t('cancel_anytime')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
