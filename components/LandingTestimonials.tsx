"use client"

import { useLocale } from '@/hooks/useLocale'

export default function LandingTestimonials() {
  const { t } = useLocale()

  const testimonials = [
    { text: t('landing_testimonial_1_text'), name: t('landing_testimonial_1_name'), role: t('landing_testimonial_1_role') },
    { text: t('landing_testimonial_2_text'), name: t('landing_testimonial_2_name'), role: t('landing_testimonial_2_role') },
    { text: t('landing_testimonial_3_text'), name: t('landing_testimonial_3_name'), role: t('landing_testimonial_3_role') },
  ]

  return (
    <section className="relative py-24 sm:py-32">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {t('landing_testimonials_title')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-text-muted">
            {t('landing_testimonials_subtitle')}
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {testimonials.map((item, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-8 transition-all duration-300 hover:border-ink-accent/15 hover:bg-white/[0.04]"
            >
              {/* Quote icon */}
              <svg className="mb-4 h-8 w-8 text-ink-accent/30" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
              </svg>

              <p className="text-sm leading-relaxed text-ink-text">{item.text}</p>

              <div className="mt-6 flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink-accent/20 to-ink-accent-strong/20">
                  <span className="text-sm font-bold text-white">{item.name.charAt(0)}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{item.name}</div>
                  <div className="text-xs text-ink-text-muted">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
