'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { subscribeToLeads, updateLeadStatus } from '@/lib/realtime'
import { getPublicProfile } from '@/lib/publicProfiles'
import { createAftercare } from '@/lib/aftercare'
import Image from 'next/image'
import type { Lead } from '@/types'
import { XMarkIcon } from '@heroicons/react/24/outline'

export default function LeadsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAftercareModal, setShowAftercareModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

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
    try { 
      await updateLeadStatus(user.uid, leadId, status)
      
      // If accepting a lead, prompt to create aftercare
      if (status === 'accepted') {
        const lead = leads.find(l => l.id === leadId)
        if (lead) {
          setSelectedLead(lead)
          setShowAftercareModal(true)
        }
      }
    }
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
                {lead.status === 'accepted' && !lead.aftercareId && (
                  <button 
                    onClick={() => {
                      setSelectedLead(lead)
                      setShowAftercareModal(true)
                    }} 
                    className="btn btn-primary"
                  >
                    Create Aftercare
                  </button>
                )}
                {lead.status !== 'archived' && (
                  <button onClick={() => handleStatusChange(lead.id, 'archived')} className="btn btn-secondary">Archive</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAftercareModal && selectedLead && user && (
        <AftercareModal 
          lead={selectedLead}
          artist={user}
          onClose={() => {
            setShowAftercareModal(false)
            setSelectedLead(null)
          }}
        />
      )}
    </div>
  )
}

// Aftercare creation modal
function AftercareModal({ lead, artist, onClose }: { lead: Lead; artist: any; onClose: () => void }) {
  const [tattooStyle, setTattooStyle] = useState(lead.style || '')
  const [tattooLocation, setTattooLocation] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [instructions, setInstructions] = useState([
    { title: 'Day 1: Initial Care', content: 'Keep bandage on for 2-4 hours. Wash gently with lukewarm water and mild soap.', day: 1 },
    { title: 'Days 2-7: Daily Routine', content: 'Apply thin layer of aftercare balm 2-3 times daily. Keep area clean and dry.', day: 2 },
    { title: 'Days 7-14: Healing Phase', content: 'Continue moisturizing. Avoid sun exposure, swimming, and scratching.', day: 7 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addInstruction = () => {
    setInstructions([...instructions, { title: '', content: '', day: instructions.length + 1 }])
  }

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index))
  }

  const updateInstruction = (index: number, field: 'title' | 'content' | 'day', value: string | number) => {
    const updated = [...instructions]
    updated[index] = { ...updated[index], [field]: value }
    setInstructions(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (instructions.length === 0) {
      setError('Please add at least one instruction')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await createAftercare(
        artist.uid,
        artist.displayName || artist.email || 'Artist',
        lead.clientId,
        lead.clientName,
        {
          leadId: lead.id,
          tattooStyle: tattooStyle.trim(),
          tattooLocation: tattooLocation.trim(),
          instructions: instructions.filter(i => i.title && i.content),
          generalNotes: generalNotes.trim(),
          scheduledDays: instructions.length,
        }
      )
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Failed to create aftercare plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-4xl border border-white/10 bg-ink-panel p-6 shadow-glow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Create Aftercare Plan</h2>
            <p className="mt-1 text-sm text-ink-text-muted">For {lead.clientName}</p>
          </div>
          <button onClick={onClose} className="text-ink-text-muted transition hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tattoo Style</label>
              <input
                type="text"
                className="input"
                value={tattooStyle}
                onChange={(e) => setTattooStyle(e.target.value)}
                placeholder="Blackwork, Realism..."
              />
            </div>
            <div>
              <label className="label">Tattoo Location</label>
              <input
                type="text"
                className="input"
                value={tattooLocation}
                onChange={(e) => setTattooLocation(e.target.value)}
                placeholder="Forearm, Back..."
              />
            </div>
          </div>

          <div>
            <label className="label">General Notes (optional)</label>
            <textarea
              className="input min-h-[80px]"
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Any special instructions or notes for this client..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="label">Instructions</label>
              <button
                type="button"
                onClick={addInstruction}
                className="text-sm font-semibold text-ink-accent transition hover:text-white"
              >
                + Add Step
              </button>
            </div>
            
            <div className="mt-3 space-y-3">
              {instructions.map((instruction, index) => (
                <div key={index} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="number"
                          className="input w-20"
                          value={instruction.day || ''}
                          onChange={(e) => updateInstruction(index, 'day', parseInt(e.target.value) || 1)}
                          placeholder="Day"
                          min="1"
                        />
                        <input
                          type="text"
                          className="input flex-1"
                          value={instruction.title}
                          onChange={(e) => updateInstruction(index, 'title', e.target.value)}
                          placeholder="Step title"
                          required
                        />
                      </div>
                      <textarea
                        className="input min-h-[60px]"
                        value={instruction.content}
                        onChange={(e) => updateInstruction(index, 'content', e.target.value)}
                        placeholder="Detailed instructions for this step..."
                        required
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="mt-2 text-red-400 transition hover:text-red-300"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
              Skip for Now
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Creating...' : 'Create & Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
