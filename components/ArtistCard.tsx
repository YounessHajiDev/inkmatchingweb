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
    <article className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-5 shadow-xl backdrop-blur-md transition-all duration-300 hover:border-ink-accent/40 hover:shadow-2xl hover:shadow-ink-accent/10">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-accent/5 via-transparent to-purple-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-ink-accent/5 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
      <div className="relative z-10 space-y-4">
        <div className="relative h-48 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg">
          {artist.coverURL ? (
            <Image src={artist.coverURL} alt={artist.displayName} fill className="object-cover transition duration-700 group-hover:scale-110" />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-text-muted/50">
              <CameraIcon className="h-10 w-10" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          {typeof artist.rating === 'number' && (
            <div className="absolute right-3 top-3">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-bold text-white shadow-xl backdrop-blur-md">
                <StarSolidIcon className="h-3.5 w-3.5 text-amber-400" />
                {artist.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Portfolio Images */}
        {artist.portfolioImages && artist.portfolioImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {artist.portfolioImages.slice(0, 4).map((url, i) => (
              <div key={i} className="group/img relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-md">
                <Image src={url} alt={`Work ${i + 1}`} fill className="object-cover transition duration-500 group-hover/img:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover/img:opacity-100" />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-lg font-bold text-white transition-colors group-hover:text-ink-accent">{artist.displayName}</h3>
              <p className="flex items-center gap-1.5 text-sm text-ink-text-muted">
                <MapPinIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">{artist.city}</span>
              </p>
            </div>
          </div>

          {artist.normalizedStyles && (
            <p className="line-clamp-2 text-sm leading-relaxed text-ink-text-muted/80">
              {artist.normalizedStyles}
            </p>
          )}
        </div>

        <button 
          onClick={handleMessage} 
          disabled={loading} 
          className="btn btn-primary group/btn relative w-full overflow-hidden shadow-lg shadow-ink-accent/20 transition-all hover:shadow-xl hover:shadow-ink-accent/30"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Opening chat…
              </>
            ) : (
              <>
                <ChatIcon className="h-4 w-4 transition-transform group-hover/btn:scale-110" />
                Start a conversation
              </>
            )}
          </span>
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover/btn:translate-x-full" />
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

function ChatIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
    </svg>
  )
}
