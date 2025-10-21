'use client'

import { useEffect, useMemo, useState } from 'react'
import { fetchArtistsOnce } from '@/lib/publicProfiles'
import ArtistCard from '@/components/ArtistCard'
import type { ArtistWithProfile } from '@/types'
import { AdjustmentsHorizontalIcon, FunnelIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline'

export default function DiscoverPage() {
  const [artists, setArtists] = useState<ArtistWithProfile[]>([])
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNearMe, setShowNearMe] = useState(false)

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const data = await fetchArtistsOnce(100)
        setArtists(data)
        setFilteredArtists(data)
      } catch (error) {
        console.error('Error loading artists:', error)
      } finally {
        setLoading(false)
      }
    }
    loadArtists()
  }, [])

  useEffect(() => {
    if (!search.trim()) { setFilteredArtists(artists); return }
    const query = search.toLowerCase()
    const filtered = artists.filter((artist) =>
      artist.displayName.toLowerCase().includes(query) ||
      artist.city.toLowerCase().includes(query) ||
      artist.normalizedStyles.toLowerCase().includes(query)
    )
    setFilteredArtists(filtered)
  }, [search, artists])

  const filterChips = useMemo(() => ([
    { label: 'All cities', icon: <MapLabelIcon key="city" /> },
    { label: 'All styles', icon: <PenNibIcon key="style" /> },
    { label: 'Any rating', icon: <StarIcon key="rating" className="h-4 w-4" /> },
  ]), [])

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-8 shadow-2xl backdrop-blur-xl sm:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-ink-accent/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-10 -left-10 h-60 w-60 rounded-full bg-purple-500/5 blur-3xl" aria-hidden />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink-accent">
                <SparklesIcon className="h-4 w-4" />
                Discover
              </p>
              <h1 className="mt-3 bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl lg:text-6xl">
                Find your next tattoo artist
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-text-muted/90">
                Browse curated portfolios, explore by style or city, and start a conversation without sharing your personal contact details.
              </p>
            </div>
            <button className="btn btn-primary group shrink-0 shadow-lg shadow-ink-accent/20 hover:shadow-xl hover:shadow-ink-accent/30">
              <SparklesIcon className="h-5 w-5 transition group-hover:rotate-12" />
              Curate feed
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur-md sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-text-muted transition" />
              <input
                type="text"
                placeholder="Search artists, styles, cities…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full rounded-2xl border-white/5 bg-white/[0.03] pl-12 pr-4 transition-all duration-200 placeholder:text-ink-text-muted/60 focus:border-ink-accent/30 focus:bg-white/[0.05] focus:shadow-lg focus:shadow-ink-accent/5"
              />
            </div>
            <div className="flex items-center gap-3 sm:w-auto">
              <button className="btn btn-secondary group border-white/10 bg-white/[0.05] shadow-md transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg">
                <FunnelIcon className="h-5 w-5 transition group-hover:scale-110" />
                Filters
              </button>
              <button className="btn btn-secondary group border-white/10 bg-white/[0.05] shadow-md transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg">
                <AdjustmentsHorizontalIcon className="h-5 w-5 transition group-hover:scale-110" />
                Sort
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip, idx) => (
                <span 
                  key={chip.label} 
                  className="chip border-white/10 bg-white/[0.05] shadow-md backdrop-blur-sm transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowNearMe((prev) => !prev)}
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold shadow-md backdrop-blur-sm transition-all hover:border-ink-accent/40 hover:bg-white/[0.08] hover:shadow-lg"
            >
              <span className={`transition-colors ${showNearMe ? 'text-ink-accent' : 'text-ink-text-muted group-hover:text-white'}`}>
                Near me
              </span>
              <span
                data-state={showNearMe ? 'on' : 'off'}
                className="toggle shadow-inner"
                aria-hidden
              >
                <span className="toggle-thumb shadow-lg" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-ink-accent" />
            <span className="text-ink-text-muted">Loading artists…</span>
          </div>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent p-12 text-center shadow-xl backdrop-blur-md">
          <div className="mx-auto max-w-md">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05]">
              <MagnifyingGlassIcon className="h-8 w-8 text-ink-text-muted/50" />
            </div>
            <p className="text-lg font-semibold text-white">No artists found</p>
            <p className="mt-2 text-sm text-ink-text-muted">Try adjusting your search or filters to discover more artists.</p>
          </div>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist, idx) => (
            <div 
              key={artist.uid}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
            >
              <ArtistCard artist={artist} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 4.432a2.25 2.25 0 0 1 4.374 0l.277.908a2.25 2.25 0 0 0 1.43 1.43l.908.277a2.25 2.25 0 0 1 0 4.374l-.908.277a2.25 2.25 0 0 0-1.43 1.43l-.277.908a2.25 2.25 0 0 1-4.374 0l-.277-.908a2.25 2.25 0 0 0-1.43-1.43l-.908-.277a2.25 2.25 0 0 1 0-4.374l.908-.277a2.25 2.25 0 0 0 1.43-1.43l.277-.908z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12h.008v.008H15V12zm-3.75-4.5h.008v.008h-.008V7.5zm0 9h.008v.008h-.008V16.5zm4.5-4.5h.008v.008H15.75V12z" />
    </svg>
  )
}

function MapLabelIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 11.25a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.5-7.5 11.25-7.5 11.25S4.5 18 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
    </svg>
  )
}

function PenNibIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12c2.25 0 4.5-2.25 4.5-4.5S14.25 3 12 3 7.5 5.25 7.5 7.5 9.75 12 12 12z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21h7.5" />
    </svg>
  )
}
