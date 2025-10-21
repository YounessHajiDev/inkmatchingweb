'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthProvider'
import { ensureOneToOneThread, sendText } from '@/lib/realtime'
import type { ArtistWithProfile } from '@/types'
import { useState } from 'react'

export default function ArtistCard({ artist }: { artist: ArtistWithProfile }) {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleMessage = async () => {
    if (!user) { router.push('/login'); return }
    setLoading(true)
    try {
      const threadId = await ensureOneToOneThread(user.uid, artist.uid)
      await sendText(threadId, 'Hello!', user.uid)
      router.push(`/chat/${threadId}`)
    } catch (e) {
      console.error(e); alert('Failed to start conversation')
    } finally { setLoading(false) }
  }

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-ink-accent/40 hover:shadow-glow-soft">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] via-transparent to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden />
      <div className="relative z-10 space-y-5">
        <div className="relative h-44 overflow-hidden rounded-3xl border border-white/5 bg-white/[0.04]">
          {artist.coverURL ? (
            <Image src={artist.coverURL} alt={artist.displayName} fill className="object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-text-muted">
              <CameraIcon className="h-8 w-8" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        </div>

        {/* Portfolio Images */}
        {artist.portfolioImages && artist.portfolioImages.length > 0 && (
          <div className="grid grid-cols-4 gap-1">
            {artist.portfolioImages.slice(0, 4).map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/10">
                <Image src={url} alt={`Work ${i + 1}`} fill className="object-cover transition duration-300 group-hover:scale-105" />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{artist.displayName}</h3>
              <p className="flex items-center gap-1 text-sm text-ink-text-muted">
                <MapPinIcon className="h-4 w-4" />
                {artist.city}
              </p>
            </div>
            {typeof artist.rating === 'number' && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-white">
                <StarSolidIcon className="h-4 w-4 text-amber-300" />
                {artist.rating.toFixed(1)}
              </span>
            )}
          </div>

          {artist.normalizedStyles && (
            <p className="text-sm leading-relaxed text-ink-text-muted">
              {artist.normalizedStyles}
            </p>
          )}
        </div>

        <button onClick={handleMessage} disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Opening chat…' : 'Start a conversation'}
        </button>
      </div>
    </article>
  )
}

function CameraIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m3 7.5 1.72-2.153A2.25 2.25 0 0 1 6.461 4.5h2.578a2.25 2.25 0 0 1 1.74.835l.51.63h4.078a2.25 2.25 0 0 1 1.8.9l2.167 2.9a2.25 2.25 0 0 1 .44 1.32v6.565a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18.75V7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
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

function StarSolidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M11.48 3.499c.265-.64 1.176-.64 1.441 0l2.062 4.992 5.39.421c.704.055.99.95.455 1.428l-4.09 3.594 1.236 5.214c.162.687-.566 1.24-1.17.871L12 16.684l-4.804 3.335c-.605.369-1.333-.184-1.171-.87l1.237-5.215-4.09-3.595c-.535-.477-.249-1.372.455-1.427l5.39-.422 2.062-4.991z" />
    </svg>
  )
}
