"use client"

import { useRouter } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'

const CheckIcon = () => (
  <svg className="mt-0.5 h-5 w-5 shrink-0 text-ink-accent" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
)

export default function LandingFeatures() {
  const router = useRouter()
  const { t } = useLocale()

  const clientFeatures = [
    t('landing_clients_feature_1'),
    t('landing_clients_feature_2'),
    t('landing_clients_feature_3'),
    t('landing_clients_feature_4'),
  ]

  const artistFeatures = [
    t('landing_artists_feature_1'),
    t('landing_artists_feature_2'),
    t('landing_artists_feature_3'),
    t('landing_artists_feature_4'),
  ]

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('landing_features_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-text-muted">
            {t('landing_features_subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {/* For Clients */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-ink-accent/20 sm:p-10">
            <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-ink-accent/5 blur-3xl transition-all duration-500 group-hover:bg-ink-accent/10" aria-hidden />

            <div className="relative">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-ink-accent/10 to-ink-accent/5 p-3">
                <svg className="h-7 w-7 text-ink-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-white">{t('landing_clients_title')}</h3>
              <p className="mt-2 text-sm text-ink-text-muted">{t('landing_clients_description')}</p>

              <ul className="mt-6 space-y-3">
                {clientFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-text">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => router.push('/discover')} className="btn btn-primary">
                  {t('landing_clients_find')}
                </button>
                <button onClick={() => router.push('/map')} className="btn btn-secondary">
                  {t('landing_clients_map')}
                </button>
              </div>
            </div>
          </div>

          {/* For Artists */}
          <div className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-ink-accent-strong/20 sm:p-10">
            <div className="absolute -left-20 -bottom-20 h-40 w-40 rounded-full bg-ink-accent-strong/5 blur-3xl transition-all duration-500 group-hover:bg-ink-accent-strong/10" aria-hidden />

            <div className="relative">
              <div className="inline-flex rounded-xl bg-gradient-to-br from-ink-accent-strong/10 to-ink-accent-strong/5 p-3">
                <svg className="h-7 w-7 text-ink-accent-strong" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                </svg>
              </div>

              <h3 className="mt-5 text-2xl font-bold text-white">{t('landing_artists_title')}</h3>
              <p className="mt-2 text-sm text-ink-text-muted">{t('landing_artists_description')}</p>

              <ul className="mt-6 space-y-3">
                {artistFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-ink-text">
                    <CheckIcon />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => router.push('/login')} className="btn btn-primary">
                  {t('im_an_artist')}
                </button>
                <button onClick={() => router.push('/pricing')} className="btn btn-secondary">
                  {t('pricing')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
