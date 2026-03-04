"use client"

import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'
import { useEffect, useState } from 'react'

export default function HeroLanding() {
  const router = useRouter()
  const { t } = useLocale()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(id)
  }, [])

  const stats = [
    { value: t('hero_stat_1_value'), label: t('hero_stat_1_label') },
    { value: t('hero_stat_2_value'), label: t('hero_stat_2_label') },
    { value: t('hero_stat_3_value'), label: t('hero_stat_3_label') },
    { value: t('hero_stat_4_value'), label: t('hero_stat_4_label') },
  ]

  return (
    <section className="relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-ink-accent/20 via-ink-accent-strong/10 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/4 h-[400px] w-[400px] rounded-full bg-ink-accent-strong/[0.08] blur-3xl" />
        <div className="absolute left-0 bottom-0 h-[300px] w-[300px] rounded-full bg-ink-accent/[0.06] blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:px-10 sm:pt-24 lg:pt-32">
        {/* Badge */}
        <div className={`flex justify-center transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="inline-flex items-center gap-2 rounded-full border border-ink-accent/20 bg-ink-accent/5 px-5 py-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ink-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-ink-accent" />
            </span>
            <span className="text-sm font-medium text-ink-accent">{t('hero_badge')}</span>
          </div>
        </div>

        {/* Headline */}
        <div className={`mt-8 text-center transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-7xl lg:text-8xl">
            <span className="block">{t('hero_title_line1')}</span>
            <span className="block bg-gradient-to-r from-ink-accent via-ink-accent-soft to-ink-accent-strong bg-clip-text text-transparent">
              {t('hero_title_line2')}
            </span>
          </h1>
        </div>

        {/* Subtitle */}
        <p className={`mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-ink-text-muted sm:text-xl transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {t('hero_subtitle')}
        </p>

        {/* CTAs */}
        <div className={`mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => router.push('/discover')}
            className="btn btn-primary btn-lg shadow-glow text-base"
          >
            {t('hero_cta_primary')}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
          <button
            onClick={() => router.push('/pricing')}
            className="btn btn-secondary btn-lg text-base"
          >
            {t('hero_cta_secondary')}
          </button>
        </div>

        {/* Stats bar */}
        <div className={`mx-auto mt-16 max-w-4xl transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="group relative rounded-2xl border border-white/5 bg-white/[0.03] p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-ink-accent/20 hover:bg-white/[0.06]"
              >
                <div className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-text-muted sm:text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
