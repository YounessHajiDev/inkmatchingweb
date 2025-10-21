'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { subscribeToLeads, updateLeadStatus } from '@/lib/realtime'
import { getPublicProfile } from '@/lib/publicProfiles'
import Image from 'next/image'
import type { Lead } from '@/types'

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    const checkRole = async () => {
      if (!user) { setLoading(false); return }
      try {
        const profile = await getPublicProfile(user.uid)
        setUserRole(profile?.role || null)
      } catch (e) {
        console.error(e)
      } finally { setLoading(false) }
    }
    checkRole()
  }, [user, authLoading])

  useEffect(() => {
    if (!user || userRole !== 'artist') return
    const unsubscribe = subscribeToLeads(user.uid, setLeads)
    return unsubscribe
  }, [user, userRole])

  const handleStatusChange = async (leadId: string, status: Lead['status']) => {
    if (!user) return
    try { await updateLeadStatus(user.uid, leadId, status) }
    catch (e) { console.error(e); alert('Failed to update lead status') }
  }

  if (authLoading || loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="text-ink-text-muted">Loading…</div></div>

  if (!user) return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="space-y-3 rounded-4xl border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
        <h1 className="text-2xl font-semibold text-white">Sign in required</h1>
        <p className="text-sm text-ink-text-muted">Please sign in as an artist to view your leads.</p>
      </div>
    </div>
  )

  if (userRole !== 'artist') return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <div className="space-y-3 rounded-4xl border border-white/10 bg-white/[0.04] p-8 shadow-glow-soft">
        <h1 className="text-2xl font-semibold text-white">Artist account required</h1>
        <p className="text-sm text-ink-text-muted">Only artist accounts can view leads.</p>
      </div>
    </div>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <section className="space-y-4 rounded-4xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Leads</p>
            <h1 className="text-3xl font-semibold text-white">Incoming briefs</h1>
            <p className="mt-2 max-w-xl text-sm text-ink-text-muted">Review new client requests, respond inside chat, and keep your pipeline centralized. Mark leads accepted, declined, or archived when you’re done.</p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-ink-text-muted">
            {leads.length} total
          </span>
        </div>
      </section>

      {leads.length === 0 ? (
        <div className="rounded-4xl border border-white/10 bg-white/[0.04] p-10 text-center text-ink-text-muted shadow-glow-soft">
          No leads yet. When clients message you, leads will appear here.
        </div>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <div key={lead.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur-md">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{lead.clientName}</h3>
                  <p className="text-sm text-ink-text-muted">{new Date(lead.createdAt * 1000).toLocaleDateString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  lead.status === 'new'
                    ? 'border border-ink-accent/50 bg-ink-accent/10 text-ink-accent'
                    : lead.status === 'accepted'
                      ? 'border border-green-400/50 bg-green-400/10 text-green-200'
                      : lead.status === 'declined'
                        ? 'border border-red-400/50 bg-red-400/10 text-red-200'
                        : 'border border-white/10 bg-white/[0.05] text-ink-text-muted'
                }`}>
                  {lead.status}
                </span>
              </div>
              {lead.message && <p className="mb-4 text-sm text-ink-text-muted">{lead.message}</p>}
              
              {/* Show stencil attachments if present */}
              {lead.attachments && lead.attachments.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {lead.attachments.map((url, i) => (
                    <div key={i} className="relative w-32 h-32 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-ink-accent/40 transition-colors" onClick={() => lead.threadId && router.push(`/chat/${lead.threadId}`)}>
                      <Image src={url} alt={`Stencil ${i + 1}`} fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-semibold">View in Chat</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mb-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-ink-text-muted">
                {lead.style && <span>Style: {lead.style}</span>}
                {lead.city && <span>City: {lead.city}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {lead.threadId && (
                  <button onClick={() => router.push(`/chat/${lead.threadId}`)} className="btn btn-secondary">
                    Open Chat
                  </button>
                )}
                {lead.status === 'new' && (
                  <>
                    <button onClick={() => handleStatusChange(lead.id, 'accepted')} className="btn btn-primary">Accept</button>
                    <button onClick={() => handleStatusChange(lead.id, 'declined')} className="btn border border-red-400/60 bg-red-500/10 text-red-200 hover:border-red-300">Decline</button>
                  </>
                )}
                {lead.status !== 'archived' && (
                  <button onClick={() => handleStatusChange(lead.id, 'archived')} className="btn btn-secondary">Archive</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
