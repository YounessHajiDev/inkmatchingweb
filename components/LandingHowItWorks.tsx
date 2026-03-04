"use client"

import { useLocale } from '@/hooks/useLocale'

const SearchIcon = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const ChatIcon = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
  </svg>
)

const CalendarIcon = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

export default function LandingHowItWorks() {
  const { t } = useLocale()

  const steps = [
    { icon: <SearchIcon />, num: '01', title: t('landing_how_step1_title'), desc: t('landing_how_step1_desc') },
    { icon: <ChatIcon />, num: '02', title: t('landing_how_step2_title'), desc: t('landing_how_step2_desc') },
    { icon: <CalendarIcon />, num: '03', title: t('landing_how_step3_title'), desc: t('landing_how_step3_desc') },
  ]

  return (
    <section className="relative py-24 sm:py-32">
      {/* Subtle divider gradient */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('landing_how_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-text-muted">
            {t('landing_how_subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="group relative">
              {/* Connector line between cards (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-px w-8 translate-x-full bg-gradient-to-r from-ink-accent/30 to-transparent sm:block" aria-hidden />
              )}

              <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-ink-accent/20 hover:bg-white/[0.04]">
                {/* Step number */}
                <div className="mb-4 text-xs font-bold uppercase tracking-widest text-ink-accent/40">
                  {step.num}
                </div>

                {/* Icon */}
                <div className="mb-5 inline-flex rounded-xl bg-gradient-to-br from-ink-accent/10 to-ink-accent-strong/10 p-3 text-ink-accent">
                  {step.icon}
                </div>

                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-text-muted">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
