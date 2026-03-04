'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import InkTrailCanvas from '@/components/InkTrailCanvas'
import { useLocale } from '@/hooks/useLocale'
import HeroLanding from '@/components/HeroLanding'

export default function LandingPage() {
  const router = useRouter()
  const { role } = useUserRole()
  const { t } = useLocale()

  // If already an artist, provide a quick path in UI; no auto-redirect to keep landing visible
  useEffect(() => {
    // no-op: keep landing page as entry even if authenticated
  }, [])

  return (
    <main className="relative min-h-screen">
      {/* Transparent canvas over app background; fast-fading rainbow ink */}
      <InkTrailCanvas fadeAlpha={0.18} />

      {/* Content */}
      <div className="relative z-10">
        <HeroLanding />
      </div>
    </main>
  )
}
