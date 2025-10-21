'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'
import { subscribeToUserThreads, deleteChatForUser } from '@/lib/realtime'
import { getPublicProfile } from '@/lib/publicProfiles'
import type { PublicProfile, UserThread } from '@/types'
import { MagnifyingGlassIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function ChatLandingPage() {
  const { user, loading } = useAuth()
  const { role } = useUserRole()
  const router = useRouter()
  const [threads, setThreads] = useState<UserThread[]>([])
  const [profiles, setProfiles] = useState<Record<string, PublicProfile>>({})
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!user) return
    const unsubscribe = subscribeToUserThreads(user.uid, setThreads)
    return unsubscribe
  }, [user])

  useEffect(() => {
    if (!user || threads.length === 0) return
    const memberIds = new Set<string>()
    threads.forEach((thread) => {
      Object.keys(thread.members || {}).forEach((uid) => { if (uid !== user.uid && !profiles[uid]) memberIds.add(uid) })
    })
    if (memberIds.size === 0) return
    let cancelled = false
    const load = async () => {
      try {
        const results = await Promise.all(Array.from(memberIds).map(async (uid) => {
          const profile = await getPublicProfile(uid)
          return { uid, profile }
        }))
        if (!cancelled) {
          setProfiles((prev) => {
            const next: Record<string, PublicProfile> = { ...prev }
            results.forEach(({ uid, profile }) => {
              if (profile) next[uid] = profile
            })
            return next
          })
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load participant details right now.')
      }
    }
    load()
    return () => { cancelled = true }
  }, [threads, user, profiles])

  const sortedThreads = useMemo(() => [...threads].sort((a, b) => b.updatedAt - a.updatedAt), [threads])

  const filteredThreads = useMemo(() => {
    if (!query.trim()) return sortedThreads
    const q = query.toLowerCase()
    return sortedThreads.filter((thread) => {
      const otherId = Object.keys(thread.members || {}).find((uid) => uid !== user?.uid)
      const otherProfile = otherId ? profiles[otherId] : undefined
      const haystack = [
        otherProfile?.displayName ?? '',
        thread.lastMessage ?? '',
      ].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [sortedThreads, profiles, query, user?.uid])

  if (loading) return <div className="p-8 text-ink-text-muted">Loading…</div>
  if (!user) {
    router.replace('/login')
    return null
  }

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 py-10">
      <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.03] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <div className="absolute inset-0 bg-ink-panel opacity-70" aria-hidden />
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Chat</p>
              <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                {role === 'artist' ? 'Client Messages' : 'Stay in sync with your artists'}
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-ink-text-muted">
                {role === 'artist' 
                  ? 'View messages from your clients. Reply to inquiries and keep conversations organized.'
                  : 'Every conversation and update lives here. No DMs, no lost context—InkMatching keeps both sides aligned.'
                }
              </p>
            </div>
            {role === 'artist' && (
              <Link href="/leads" className="btn btn-secondary">
                Leads inbox
              </Link>
            )}
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input w-full rounded-full bg-white/[0.03] pl-12"
              placeholder="Search chats…"
            />
          </div>
        </div>
      </section>

      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      {filteredThreads.length === 0 ? (
        <div className="relative mt-10 overflow-hidden rounded-4xl border border-white/10 bg-gradient-to-br from-ink-accent/20 via-transparent to-ink-accent/10 p-10 text-center shadow-glow-soft backdrop-blur-lg">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-sm text-ink-text-muted">
            <ChatBubbleIcon className="h-12 w-12 text-white/70" />
            <div>
              <h2 className="text-2xl font-semibold text-white">No conversations yet</h2>
              <p className="mt-2 text-sm text-ink-text-muted">
                {role === 'artist' 
                  ? 'When clients message you through the platform, their conversations will appear here.'
                  : 'Start a chat from an artist profile or booking request to keep everything in one place.'
                }
              </p>
            </div>
            {role !== 'artist' && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Link href="/" className="btn btn-secondary">
                  Discover artists
                </Link>
                <Link href="/map" className="btn btn-primary">
                  Explore map
                </Link>
              </div>
            )}
          </div>
          {role !== 'artist' && (
            <Link
              href="/chat/new"
              className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-ink-button text-white shadow-glow transition hover:scale-[1.02]"
            >
              <PlusIcon className="h-6 w-6" />
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-10 divide-y divide-white/5 overflow-hidden rounded-4xl border border-white/10 bg-white/[0.03] shadow-glow-soft backdrop-blur-md">
          {filteredThreads.map((thread) => {
            const otherId = Object.keys(thread.members || {}).find((uid) => uid !== user.uid)
            const otherProfile = otherId ? profiles[otherId] : undefined
            return (
              <div
                key={thread.threadId}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-white/[0.06]"
              >
                <button
                  onClick={() => router.push(`/chat/${thread.threadId}`)}
                  className="flex flex-1 items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {otherProfile?.displayName || 'Conversation'}
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-ink-text-muted">
                      {thread.lastMessage || 'No messages yet'}
                    </div>
                  </div>
                  <div className="text-xs text-ink-text-muted">
                    {new Date(thread.updatedAt).toLocaleDateString()} · {new Date(thread.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation()
                    if (!user) return
                    const ok = window.confirm('Delete this chat from your inbox? This will not affect the other participant.')
                    if (!ok) return
                    try {
                      await deleteChatForUser(thread.threadId!, user.uid)
                    } catch (err) {
                      console.error(err)
                      alert('Failed to delete chat. Please try again.')
                    }
                  }}
                  className="ml-2 inline-flex items-center justify-center rounded-full border border-red-500/30 bg-red-500/10 p-2 text-red-200 hover:border-red-400 hover:bg-red-500/20"
                  title="Delete chat"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ChatBubbleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h6m-9 3h3.75l2.25 2.25 2.25-2.25H18a2.25 2.25 0 0 0 2.25-2.25v-6A2.25 2.25 0 0 0 18 4.5H6A2.25 2.25 0 0 0 3.75 6.75v6A2.25 2.25 0 0 0 6 15h.75" />
    </svg>
  )
}
