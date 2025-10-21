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
    <div className="relative h-[calc(100vh-6rem)] overflow-hidden rounded-4xl border border-white/10 bg-white/[0.03]">
      <div className="absolute inset-x-6 top-6 z-10 hidden max-w-sm rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm text-ink-text-muted shadow-glow-soft backdrop-blur-lg sm:block">
        <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Explore</p>
        <p className="mt-2 text-white">Tap markers to preview studios and start a chat—keep every conversation inside InkMatching.</p>
      </div>
      <MapArtists artists={artists} onSelect={setSelectedArtist} />
      {selectedArtist && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-6 pt-12">
          <div className="pointer-events-auto mx-auto flex w-[min(90%,880px)] flex-col gap-4 rounded-4xl border border-white/10 bg-white/[0.08] p-4 text-sm shadow-glow-soft backdrop-blur-lg sm:flex-row sm:items-center sm:gap-6 sm:p-6">
            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06]">
              {selectedArtist.coverURL ? (
                <Image src={selectedArtist.coverURL} alt={selectedArtist.displayName} fill className="object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-text-muted text-xs">No image</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h3 className="truncate text-xl font-semibold text-white">{selectedArtist.displayName}</h3>
              <p className="flex items-center gap-2 text-sm text-ink-text-muted">
                <MapPinIcon className="h-4 w-4" />
                {selectedArtist.city}
              </p>
              {selectedArtist.normalizedStyles && (
                <p className="truncate text-sm text-ink-text-muted">{selectedArtist.normalizedStyles}</p>
              )}
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <button onClick={handleDirections} className="btn btn-secondary">
                Directions
              </button>
              <button onClick={handleMessage} disabled={messaging} className="btn btn-primary">
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
