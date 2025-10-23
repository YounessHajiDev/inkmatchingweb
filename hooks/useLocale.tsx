'use client'

import { useEffect, useState } from 'react'
import { AVAILABLE_LOCALES, DEFAULT_LOCALE, Locale, TRANSLATIONS } from '@/lib/i18n'

export function detectSystemLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE
  const lang = navigator.language?.slice(0, 2) ?? DEFAULT_LOCALE
  return AVAILABLE_LOCALES.includes(lang as Locale) ? (lang as Locale) : DEFAULT_LOCALE
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      const stored = typeof window !== 'undefined' && localStorage.getItem('inkmatching-locale')
      if (stored && AVAILABLE_LOCALES.includes(stored as Locale)) return stored as Locale
    } catch (e) {}
    return detectSystemLocale()
  })

  useEffect(() => {
    try {
      localStorage.setItem('inkmatching-locale', locale)
    } catch (e) {}
  }, [locale])

  const t = (key: string) => TRANSLATIONS[locale][key] ?? TRANSLATIONS[DEFAULT_LOCALE][key] ?? key

  return { locale, setLocale, t }
}
