'use client'

import React, { useEffect } from 'react'
import { useLocale } from '@/hooks/useLocale'

export default function LocaleWrapper({ children }: { children: React.ReactNode }) {
  const { locale } = useLocale()

  useEffect(() => {
    try { document.documentElement.lang = locale } catch (e) {}
  }, [locale])

  return <>{children}</>
}
