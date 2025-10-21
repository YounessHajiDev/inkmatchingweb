'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { fetchArtistsOnce } from '@/lib/publicProfiles'
import { ensureOneToOneThread, sendText } from '@/lib/realtime'
import { useAuth } from '@/components/AuthProvider'
import MapArtists from '@/components/MapArtists'
import type { ArtistWithProfile } from '@/types'
import Image from 'next/image'

export default function MapPage() {
  const [artists, setArtists] = useState<ArtistWithProfile[]>([])
  const [selectedArtist, setSelectedArtist] = useState<ArtistWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const loadArtists = async () => {
      try {
        const data = await fetchArtistsOnce(100)
        const withCoordinates = data.filter((a) => a.lat && a.lon)
        setArtists(withCoordinates)
      } catch (error) {
        console.error('Error loading artists:', error)
      } finally {
        setLoading(false)
      }
    }
    loadArtists()
  }, [])

  const handleMessage = async () => {
    if (!selectedArtist) return
    if (!user) { router.push('/login'); return }
    setMessaging(true)
    try {
      const threadId = await ensureOneToOneThread(user.uid, selectedArtist.uid)
      await sendText(threadId, 'Hello!', user.uid)
      router.push(`/chat/${threadId}`)
    } catch (error) {
      console.error('Error creating thread:', error)
      alert('Failed to start conversation')
    } finally {
      setMessaging(false)
    }
  }

  const handleDirections = () => {
    if (!selectedArtist) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedArtist.lat},${selectedArtist.lon}`
    window.open(url, '_blank')
  }

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-ink-text-muted">Loading map…</div></div>
  }

  return (
    <div className="relative h-[calc(100vh-6rem)] overflow-hidden rounded-4xl border border-white/10 bg-ink-bg/80 shadow-glow-soft">
      {/* Animated ink accent background */}
      <div className="pointer-events-none absolute inset-0 z-0 animate-pulse-slow" style={{background: 'radial-gradient(ellipse 60% 40% at 60% 20%, rgba(36,209,247,0.13) 0%, transparent 100%), radial-gradient(ellipse 40% 30% at 20% 80%, rgba(124,92,255,0.10) 0%, transparent 100%)'}} />

      {/* Glassy floating header */}
      <div className="absolute inset-x-0 top-6 z-20 flex justify-center">
        <div className="max-w-lg w-full rounded-3xl border border-white/10 bg-white/10 px-7 py-5 text-center shadow-glow backdrop-blur-2xl">
          <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Explore Artists</h1>
          <p className="text-sm text-ink-text-muted">Tap a marker to preview a studio and start a chat—keep every conversation inside InkMatching.</p>
        </div>
      </div>

      {/* Map container with extra border and shadow */}
      <div className="relative z-10 h-full w-full rounded-4xl overflow-hidden border-2 border-ink-accent/10 shadow-glow-xl">
        <MapArtists artists={artists} onSelect={setSelectedArtist} />
      </div>

      {/* Artist info card, always above BottomNav */}
      {selectedArtist && (
        <div className="pointer-events-none fixed left-1/2 bottom-0 z-50 w-full max-w-2xl -translate-x-1/2 pb-[110px] px-2 sm:px-0">
          <div className="pointer-events-auto mx-auto flex w-full flex-col gap-4 rounded-4xl border border-ink-accent/30 bg-white/20 p-5 text-sm shadow-glow-xl backdrop-blur-2xl sm:flex-row sm:items-center sm:gap-6 sm:p-7">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border-2 border-ink-accent/40 bg-white/10 shadow-glow">
              {selectedArtist.coverURL ? (
                <Image src={selectedArtist.coverURL} alt={selectedArtist.displayName} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-text-muted text-xs">No image</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="truncate text-2xl font-bold text-white drop-shadow-glow">{selectedArtist.displayName}</h3>
              <p className="flex items-center gap-2 text-base text-ink-accent font-medium">
                <MapPinIcon className="h-5 w-5" />
                {selectedArtist.city}
              </p>
              {selectedArtist.normalizedStyles && (
                <p className="truncate text-sm text-ink-text-muted">{selectedArtist.normalizedStyles}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-3 mt-2 sm:mt-0">
              <button onClick={handleDirections} className="btn-secondary btn-lg">
                Directions
              </button>
              <button onClick={handleMessage} disabled={messaging} className="btn-primary btn-lg shadow-glow">
                {messaging ? 'Connecting…' : 'Start chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75a2.25 2.25 0 1 1 0-4.5 2.25 2.25 0 0 1 0 4.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.5-7.5 11.25-7.5 11.25S4.5 18 4.5 10.5a7.5 7.5 0 1 1 15 0z" />
    </svg>
  )
}
