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
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.03] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <div className="absolute inset-0 bg-ink-panel opacity-70" aria-hidden />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-ink-text-muted">Discover</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">Find your next tattoo artist</h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-text-muted">Browse curated portfolios, explore by style or city, and start a conversation without sharing your personal contact details.</p>
            </div>
            <button className="btn btn-primary">
              <SparklesIcon className="h-5 w-5" />
              Curate feed
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-text-muted" />
              <input
                type="text"
                placeholder="Search artists, styles, cities…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input w-full rounded-full bg-white/[0.02] pl-12"
              />
            </div>
            <div className="flex items-center justify-between gap-3 sm:w-auto">
              <button className="btn btn-secondary">
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
              <button className="btn btn-secondary">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                Sort
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip) => (
                <span key={chip.label} className="chip">
                  {chip.icon}
                  {chip.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => setShowNearMe((prev) => !prev)}
              className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-ink-text-muted transition hover:border-ink-accent/40 hover:text-white"
            >
              <span className={showNearMe ? 'text-ink-accent' : 'text-ink-text-muted'}>Near me</span>
              <span
                data-state={showNearMe ? 'on' : 'off'}
                className="toggle"
                aria-hidden
              >
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[280px] items-center justify-center">
          <div className="text-ink-text-muted">Loading artists…</div>
        </div>
      ) : filteredArtists.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-ink-text-muted">
          No artists match your current filters. Try adjusting your search.
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtists.map((artist) => (<ArtistCard key={artist.uid} artist={artist} />))}
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
