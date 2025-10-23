'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchArtistsOnce } from '@/lib/publicProfiles'
import ArtistCard from '@/components/ArtistCard'
import type { ArtistWithProfile } from '@/types'
import { AdjustmentsHorizontalIcon, FunnelIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline'
import { useUserRole } from '@/hooks/useUserRole'

export default function DiscoverPage() {
  const router = useRouter()
  const { role } = useUserRole()
  const [artists, setArtists] = useState<ArtistWithProfile[]>([])
  const [filteredArtists, setFilteredArtists] = useState<ArtistWithProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showNearMe, setShowNearMe] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [showFiltersModal, setShowFiltersModal] = useState(false)
  const [showSortModal, setShowSortModal] = useState(false)

  // Redirect artists to their leads page
  useEffect(() => {
    if (role === 'artist') {
      router.push('/leads')
    }
  }, [role, router])

  // Get unique cities and styles from artists
  const cities = useMemo(() => {
    const uniqueCities = Array.from(new Set(artists.map(a => a.city).filter(Boolean)))
    return uniqueCities.sort()
  }, [artists])

  const styles = useMemo(() => {
    const allStyles = artists.flatMap(a => 
      typeof a.styles === 'string' 
        ? a.styles.split(',').map(s => s.trim()) 
        : Array.isArray(a.styles) 
          ? a.styles 
          : []
    ).filter(Boolean)
    return Array.from(new Set(allStyles)).sort()
  }, [artists])

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

  // Get user location when "Near me" is enabled
  useEffect(() => {
    if (showNearMe && !userLocation) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lon: position.coords.longitude,
            })
          },
          (error) => {
            console.error('Error getting location:', error)
            alert('Unable to get your location. Please enable location services.')
            setShowNearMe(false)
          }
        )
      } else {
        alert('Geolocation is not supported by your browser.')
        setShowNearMe(false)
      }
    }
  }, [showNearMe, userLocation])

  // Apply all filters
  useEffect(() => {
    let filtered = [...artists]

    // Search filter
    if (search.trim()) {
      const query = search.toLowerCase()
      filtered = filtered.filter((artist) =>
        artist.displayName.toLowerCase().includes(query) ||
        artist.city.toLowerCase().includes(query) ||
        artist.normalizedStyles.toLowerCase().includes(query)
      )
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(artist => artist.city === selectedCity)
    }

    // Style filter
    if (selectedStyle) {
      filtered = filtered.filter(artist => {
        const artistStyles = typeof artist.styles === 'string' 
          ? artist.styles.split(',').map(s => s.trim()) 
          : Array.isArray(artist.styles) 
            ? artist.styles 
            : []
        return artistStyles.some(style => 
          style.toLowerCase().includes(selectedStyle.toLowerCase())
        )
      })
    }

    // Rating filter
    if (selectedRating !== null) {
      filtered = filtered.filter(artist => 
        typeof artist.rating === 'number' && artist.rating >= selectedRating
      )
    }

    // Near me filter (sort by distance)
    if (showNearMe && userLocation) {
      filtered = filtered
        .map(artist => {
          const lat = artist.latitude ?? artist.lat ?? 0
          const lon = artist.longitude ?? artist.lng ?? 0
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            lat,
            lon
          )
          return { ...artist, distance }
        })
        .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
        .slice(0, 20) // Show closest 20 artists
    }

    setFilteredArtists(filtered)
  }, [search, artists, selectedCity, selectedStyle, selectedRating, showNearMe, userLocation])

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const filterChips = useMemo(() => ([
    { 
      label: selectedCity || 'All cities', 
      icon: <MapLabelIcon key="city" />,
      onClick: () => setShowFiltersModal(true),
      active: !!selectedCity,
    },
    { 
      label: selectedStyle || 'All styles', 
      icon: <PenNibIcon key="style" />,
      onClick: () => setShowFiltersModal(true),
      active: !!selectedStyle,
    },
    { 
      label: selectedRating ? `${selectedRating}+ stars` : 'Any rating', 
      icon: <StarIcon key="rating" className="h-4 w-4" />,
      onClick: () => setShowFiltersModal(true),
      active: selectedRating !== null,
    },
  ]), [selectedCity, selectedStyle, selectedRating])

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
              <button 
                onClick={() => setShowFiltersModal(true)}
                className="btn btn-secondary group border-white/10 bg-white/[0.05] shadow-md transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg"
              >
                <FunnelIcon className="h-5 w-5 transition group-hover:scale-110" />
                Filters
                {(selectedCity || selectedStyle || selectedRating !== null) && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-accent text-xs font-bold text-white">
                    {[selectedCity, selectedStyle, selectedRating].filter(Boolean).length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setShowSortModal(true)}
                className="btn btn-secondary group border-white/10 bg-white/[0.05] shadow-md transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg"
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5 transition group-hover:scale-110" />
                Sort
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {filterChips.map((chip, idx) => (
                <button
                  key={chip.label}
                  onClick={chip.onClick}
                  className={`chip border-white/10 shadow-md backdrop-blur-sm transition-all hover:border-ink-accent/30 hover:bg-white/[0.08] hover:shadow-lg ${
                    chip.active ? 'border-ink-accent/40 bg-ink-accent/10 text-white' : 'bg-white/[0.05]'
                  }`}
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {chip.icon}
                  {chip.label}
                  {chip.active && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation()
                        if (chip.label.includes('cities')) setSelectedCity(null)
                        else if (chip.label.includes('styles')) setSelectedStyle(null)
                        else if (chip.label.includes('stars')) setSelectedRating(null)
                      }}
                      className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs hover:bg-white/30"
                    >
                      ×
                    </span>
                  )}
                </button>
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

      {/* Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowFiltersModal(false)}>
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-ink-panel p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Filters</h2>
              <button onClick={() => setShowFiltersModal(false)} className="btn-icon-secondary">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* City Filter */}
              <div>
                <label className="label">City</label>
                <select 
                  value={selectedCity || ''} 
                  onChange={(e) => setSelectedCity(e.target.value || null)}
                  className="input w-full"
                >
                  <option value="">All cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Style Filter */}
              <div>
                <label className="label">Style</label>
                <select 
                  value={selectedStyle || ''} 
                  onChange={(e) => setSelectedStyle(e.target.value || null)}
                  className="input w-full"
                >
                  <option value="">All styles</option>
                  {styles.map(style => (
                    <option key={style} value={style}>{style}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="label">Minimum Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      onClick={() => setSelectedRating(selectedRating === rating ? null : rating)}
                      className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        selectedRating === rating
                          ? 'border-ink-accent bg-ink-accent/20 text-white'
                          : 'border-white/10 bg-white/5 text-ink-text-muted hover:border-ink-accent/40 hover:text-white'
                      }`}
                    >
                      {rating}+
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => {
                    setSelectedCity(null)
                    setSelectedStyle(null)
                    setSelectedRating(null)
                  }}
                  className="btn btn-secondary flex-1"
                >
                  Clear all
                </button>
                <button 
                  onClick={() => setShowFiltersModal(false)}
                  className="btn btn-primary flex-1"
                >
                  Apply filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CloseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
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
