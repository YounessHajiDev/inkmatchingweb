'use client'

import HeroLanding from '@/components/HeroLanding'
import LandingHowItWorks from '@/components/LandingHowItWorks'
import LandingFeatures from '@/components/LandingFeatures'
import LandingTestimonials from '@/components/LandingTestimonials'
import LandingCTA from '@/components/LandingCTA'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen">
      <HeroLanding />
      <LandingHowItWorks />
      <LandingFeatures />
      <LandingTestimonials />
      <LandingCTA />
      <Footer />
    </main>
  )
}
