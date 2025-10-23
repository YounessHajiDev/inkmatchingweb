"use client"

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLocale } from '@/hooks/useLocale'

export default function HeroLanding() {
  const router = useRouter()
  const { t } = useLocale()

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16 pt-8 sm:px-10 sm:pt-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-neutral-900 p-8 shadow-2xl">
        {/* soft glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-black/30 to-black/60 opacity-60" />
        <div className="relative grid gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left: headline + sub */}
          <div className="z-10 max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-ink-text-muted">{t('tattoo_but_smarter')}</p>
            <h1 className="text-4xl font-extrabold leading-tight text-white sm:text-6xl">
              <span className="block text-4xl sm:text-6xl">{t('hero_title_line1')}</span>
              <span className="block mt-2 text-3xl font-semibold text-ink-accent sm:text-4xl">{t('hero_title_line2')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-text-muted">{t('hero_subtitle')}</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => router.push('/discover')} className="btn btn-primary shadow-glow">
                {t('hero_cta_primary')}
              </button>
              <button onClick={() => router.push('/pricing')} className="btn btn-secondary">
                {t('hero_cta_secondary')}
              </button>
            </div>

            <div className="mt-8 flex gap-8">
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">{t('hero_stat_1_value')}</span>
                <span className="text-sm text-ink-text-muted">{t('hero_stat_1_label')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">{t('hero_stat_2_value')}</span>
                <span className="text-sm text-ink-text-muted">{t('hero_stat_2_label')}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-white">{t('hero_stat_3_value')}</span>
                <span className="text-sm text-ink-text-muted">{t('hero_stat_3_label')}</span>
              </div>
            </div>
          </div>

          {/* Right: visual card with countdown bubble */}
          <div className="z-10 flex items-center justify-center">
            <div className="relative w-full max-w-2xl">
              <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent shadow-xl">
                {/* Placeholder image / artboard */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 blur-[30px] opacity-30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-40 w-72 rounded-md border border-white/5 bg-gradient-to-br from-white/[0.03] to-transparent" />
                </div>
              </div>

              {/* Countdown bubble */}
              <div className="absolute -right-8 -top-8 flex items-center gap-4 rounded-full bg-gradient-to-br from-indigo-700 to-pink-600 p-4 text-white shadow-2xl">
                <div className="text-xs text-ink-text-muted">{t('hero_countdown_label')}</div>
                <div className="ml-2 rounded-full bg-white/10 px-3 py-1 text-lg font-semibold">22d</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
