'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUserRole } from '@/hooks/useUserRole'
import InkTrailCanvas from '@/components/InkTrailCanvas'

export default function LandingPage() {
  const router = useRouter()
  const { role } = useUserRole()

  // If already an artist, provide a quick path in UI; no auto-redirect to keep landing visible
  useEffect(() => {
    // no-op: keep landing page as entry even if authenticated
  }, [])

  return (
    <main className="relative min-h-screen">
      {/* Interactive skin + ink background */}
      <InkTrailCanvas skinColor="#F7EFE7" />

      {/* Content */}
      <div className="relative z-10">
        <header className="px-6 py-6 sm:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="text-xl font-black tracking-tight text-[#0b0b0b]">INKMATCHING</div>
            <nav className="hidden items-center gap-6 text-sm font-semibold text-[#222] sm:flex">
              <button onClick={() => router.push('/pricing')} className="hover:opacity-80">Pricing</button>
              <button onClick={() => router.push('/discover')} className="hover:opacity-80">Discover</button>
              <button onClick={() => router.push('/login')} className="rounded-full border border-black/10 bg-white/70 px-4 py-2 shadow-sm backdrop-blur-sm hover:bg-white">Sign in</button>
            </nav>
          </div>
        </header>

        <section className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 pb-20 pt-8 sm:px-10 sm:pt-16 lg:flex-row lg:gap-14">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-[#6b6b6b]">Tattoo, but smarter</p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight text-[#0b0b0b] sm:text-6xl">
              Where clients meet the perfect artist
            </h1>
            <p className="mt-4 text-pretty text-base leading-relaxed text-[#3a3a3a] sm:text-lg">
              Discover unique tattoo styles, chat without sharing phone numbers, and book with confidence. For artists, manage leads, chat, and grow your business—all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => router.push('/discover')} className="btn btn-primary">
                Discover artists
              </button>
              <button onClick={() => router.push('/pricing')} className="btn btn-secondary">
                See pricing
              </button>
            </div>
          </div>

          {/* Two audience cards */}
          <div className="grid w-full max-w-xl grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <div className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-6 shadow-xl backdrop-blur-md transition hover:shadow-2xl">
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-black/5 blur-2xl" aria-hidden />
              <h3 className="text-lg font-extrabold tracking-tight text-[#0b0b0b]">For Clients</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#444]">
                Browse curated portfolios, filters by style and city, and start a secure chat. No spam. No pressure.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#2b2b2b]">
                <li>• Explore by style or location</li>
                <li>• Private chat without sharing contacts</li>
                <li>• Save favorites and get aftercare tips</li>
              </ul>
              <div className="mt-6 flex gap-3">
                <button onClick={() => router.push('/discover')} className="btn btn-primary">Find artists</button>
                <button onClick={() => router.push('/map')} className="btn btn-secondary">Browse map</button>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-black/10 bg-white/70 p-6 shadow-xl backdrop-blur-md transition hover:shadow-2xl">
              <div className="absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-black/5 blur-2xl" aria-hidden />
              <h3 className="text-lg font-extrabold tracking-tight text-[#0b0b0b]">For Artists</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#444]">
                Get qualified leads, chat with clients, and showcase your portfolio. Keep your business flowing.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-[#2b2b2b]">
                <li>• Centralized chat and lead inbox</li>
                <li>• Portfolio and booking tools</li>
                <li>• Flexible plans—free to start</li>
              </ul>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => router.push(role === 'artist' ? '/leads' : '/login')}
                  className="btn btn-primary"
                >
                  {role === 'artist' ? 'Go to your leads' : "I'm an artist"}
                </button>
                <button onClick={() => router.push('/pricing')} className="btn btn-secondary">Plans</button>
              </div>
            </div>
          </div>
        </section>

        {/* Minimal footer */}
        <footer className="mx-auto max-w-7xl px-6 pb-10 text-xs text-[#6b6b6b] sm:px-10">
          <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p>© {new Date().getFullYear()} Inkmatching. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/pricing')} className="hover:opacity-80">Pricing</button>
              <button onClick={() => router.push('/login')} className="hover:opacity-80">Sign in</button>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
