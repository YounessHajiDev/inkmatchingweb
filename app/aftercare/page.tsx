'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'
import { 
  fetchClientAftercares, 
  fetchArtistAftercares, 
  createAftercare,
  markDayCompleted,
  updateAftercareStatus,
  subscribeToClientAftercares
} from '@/lib/aftercare'
import type { Aftercare } from '@/types'
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  SparklesIcon,
  XMarkIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid'

export default function AftercarePage() {
  const { user } = useAuth()
  const { role } = useUserRole()
  const [aftercares, setAftercares] = useState<Aftercare[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAftercare, setSelectedAftercare] = useState<Aftercare | null>(null)

  useEffect(() => {
    if (!user || !role) return
    let unsubscribe: (() => void) | undefined

    const loadAftercares = async () => {
      try {
        if (role === 'client') {
          // Client: subscribe to real-time updates
          unsubscribe = subscribeToClientAftercares(user.uid, (data) => {
            setAftercares(data)
            setLoading(false)
          })
        } else if (role === 'artist') {
          // Artist: fetch once
          const data = await fetchArtistAftercares(user.uid)
          setAftercares(data)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading aftercares:', error)
        setLoading(false)
      }
    }

    loadAftercares()
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [user, role])

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-ink-text-muted">Please sign in to view aftercare instructions.</p>
      </div>
    )
  }

  if (role === 'artist') {
    return <ArtistAftercareView 
      aftercares={aftercares} 
      loading={loading}
      onCreateNew={() => setShowCreateModal(true)}
      showCreateModal={showCreateModal}
      onCloseModal={() => setShowCreateModal(false)}
      user={user}
    />
  }

  if (role === 'client') {
    return <ClientAftercareView 
      aftercares={aftercares} 
      loading={loading}
      selectedAftercare={selectedAftercare}
      onSelectAftercare={setSelectedAftercare}
      user={user}
    />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <p className="text-ink-text-muted">Loading...</p>
    </div>
  )
}

// Artist view component
function ArtistAftercareView({ 
  aftercares, 
  loading,
  onCreateNew,
  showCreateModal,
  onCloseModal,
  user
}: { 
  aftercares: Aftercare[]
  loading: boolean
  onCreateNew: () => void
  showCreateModal: boolean
  onCloseModal: () => void
  user: any
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Artist Dashboard</p>
          <h1 className="text-3xl font-semibold text-white">Aftercare Plans</h1>
          <p className="mt-2 text-sm text-ink-text-muted">
            Create customized aftercare instructions for your clients
          </p>
        </div>
        <button onClick={onCreateNew} className="btn btn-primary">
          <PlusIcon className="h-5 w-5" />
          Create New
        </button>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <p className="text-ink-text-muted">Loading aftercare plans...</p>
        </div>
      ) : aftercares.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <HeartIcon className="mx-auto h-16 w-16 text-ink-text-muted opacity-40" />
          <p className="mt-4 text-lg font-semibold text-white">No aftercare plans yet</p>
          <p className="mt-2 text-sm text-ink-text-muted">
            Create a customized aftercare plan when you accept a client lead
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {aftercares.map((aftercare) => (
            <div 
              key={aftercare.id}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft transition hover:border-ink-accent/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{aftercare.clientName}</h3>
                  <p className="mt-1 text-xs text-ink-text-muted">
                    {aftercare.tattooStyle && `${aftercare.tattooStyle} • `}
                    {aftercare.tattooLocation}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  aftercare.status === 'active' ? 'bg-green-500/20 text-green-200' :
                  aftercare.status === 'completed' ? 'bg-blue-500/20 text-blue-200' :
                  'bg-gray-500/20 text-gray-200'
                }`}>
                  {aftercare.status}
                </span>
              </div>
              <div className="mt-4 text-sm text-ink-text-muted">
                <p>{aftercare.instructions.length} instructions</p>
                <p className="mt-1">
                  Created {new Date(aftercare.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAftercareModal user={user} onClose={onCloseModal} />
      )}
    </div>
  )
}

// Client view component
function ClientAftercareView({ 
  aftercares, 
  loading,
  selectedAftercare,
  onSelectAftercare,
  user
}: { 
  aftercares: Aftercare[]
  loading: boolean
  selectedAftercare: Aftercare | null
  onSelectAftercare: (aftercare: Aftercare | null) => void
  user: any
}) {
  const handleMarkDay = async (aftercare: Aftercare, day: number) => {
    try {
      const newCompleted = Math.max((aftercare.completedDays || 0), day)
      await markDayCompleted(user.uid, aftercare.id, newCompleted)
    } catch (error) {
      console.error('Error marking day:', error)
    }
  }

  if (selectedAftercare) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <button 
          onClick={() => onSelectAftercare(null)}
          className="text-sm font-semibold text-ink-text-muted transition hover:text-white"
        >
          ← Back to all aftercare
        </button>

        <div className="rounded-4xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                Your Aftercare Plan
              </h1>
              <p className="mt-2 text-sm text-ink-text-muted">
                From {selectedAftercare.artistName}
              </p>
              {selectedAftercare.tattooStyle && (
                <p className="mt-1 text-sm text-ink-text-muted">
                  {selectedAftercare.tattooStyle} {selectedAftercare.tattooLocation && `• ${selectedAftercare.tattooLocation}`}
                </p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              selectedAftercare.status === 'active' ? 'bg-green-500/20 text-green-200' :
              selectedAftercare.status === 'completed' ? 'bg-blue-500/20 text-blue-200' :
              'bg-gray-500/20 text-gray-200'
            }`}>
              {selectedAftercare.status}
            </span>
          </div>

          {selectedAftercare.generalNotes && (
            <div className="mt-6 rounded-2xl border border-ink-accent/30 bg-ink-accent/10 p-4">
              <p className="text-sm font-semibold text-white">Artist&apos;s Notes</p>
              <p className="mt-2 text-sm text-ink-text-muted whitespace-pre-wrap">
                {selectedAftercare.generalNotes}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-4">
            {selectedAftercare.instructions.map((instruction, index) => {
              const dayNum = instruction.day || index + 1
              const isCompleted = (selectedAftercare.completedDays || 0) >= dayNum
              
              return (
                <div 
                  key={index}
                  className={`rounded-2xl border p-4 transition ${
                    isCompleted 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-white/10 bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleMarkDay(selectedAftercare, dayNum)}
                      className="mt-1 flex-shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircleSolid className="h-6 w-6 text-green-400" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-white/30 transition hover:border-ink-accent" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {instruction.day && (
                          <span className="text-xs font-semibold uppercase tracking-wider text-ink-accent">
                            Day {instruction.day}
                          </span>
                        )}
                        <h3 className="font-semibold text-white">{instruction.title}</h3>
                      </div>
                      <p className="mt-2 text-sm text-ink-text-muted whitespace-pre-wrap">
                        {instruction.content}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Progress</span>
              <span className="text-sm text-ink-text-muted">
                {selectedAftercare.completedDays || 0} / {selectedAftercare.scheduledDays || selectedAftercare.instructions.length} days
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div 
                className="h-full bg-gradient-to-r from-ink-accent to-purple-500 transition-all duration-500"
                style={{ 
                  width: `${((selectedAftercare.completedDays || 0) / (selectedAftercare.scheduledDays || selectedAftercare.instructions.length)) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Your Aftercare</p>
        <h1 className="text-3xl font-semibold text-white">Heal Beautifully</h1>
        <p className="mt-2 text-sm text-ink-text-muted">
          Follow your artist&apos;s personalized aftercare instructions
        </p>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <p className="text-ink-text-muted">Loading your aftercare plans...</p>
        </div>
      ) : aftercares.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-12 text-center">
          <HeartIcon className="mx-auto h-16 w-16 text-ink-text-muted opacity-40" />
          <p className="mt-4 text-lg font-semibold text-white">No aftercare plans yet</p>
          <p className="mt-2 text-sm text-ink-text-muted">
            Your artist will create a personalized aftercare plan for you
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {aftercares.map((aftercare) => {
            const progress = ((aftercare.completedDays || 0) / (aftercare.scheduledDays || aftercare.instructions.length)) * 100
            
            return (
              <button
                key={aftercare.id}
                onClick={() => onSelectAftercare(aftercare)}
                className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left shadow-glow-soft transition hover:border-ink-accent/30"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">
                      Aftercare from {aftercare.artistName}
                    </h3>
                    <p className="mt-1 text-sm text-ink-text-muted">
                      {aftercare.tattooStyle && `${aftercare.tattooStyle} • `}
                      {aftercare.tattooLocation}
                    </p>
                    <p className="mt-2 text-xs text-ink-text-muted">
                      Created {new Date(aftercare.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    aftercare.status === 'active' ? 'bg-green-500/20 text-green-200' :
                    aftercare.status === 'completed' ? 'bg-blue-500/20 text-blue-200' :
                    'bg-gray-500/20 text-gray-200'
                  }`}>
                    {aftercare.status}
                  </span>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-ink-text-muted">
                    <span>Progress</span>
                    <span>
                      {aftercare.completedDays || 0} / {aftercare.scheduledDays || aftercare.instructions.length} days
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div 
                      className="h-full bg-gradient-to-r from-ink-accent to-purple-500 transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* General tips */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft">
        <h2 className="text-lg font-semibold text-white">General Aftercare Tips</h2>
        <ul className="mt-4 space-y-2 text-sm text-ink-text-muted">
          <li className="flex gap-2">
            <span className="text-ink-accent">•</span>
            <span>Keep the area clean and moisturized</span>
          </li>
          <li className="flex gap-2">
            <span className="text-ink-accent">•</span>
            <span>Avoid direct sunlight and swimming</span>
          </li>
          <li className="flex gap-2">
            <span className="text-ink-accent">•</span>
            <span>Don&apos;t scratch or pick at your tattoo</span>
          </li>
          <li className="flex gap-2">
            <span className="text-ink-accent">•</span>
            <span>Contact your artist if you notice unusual redness or swelling</span>
          </li>
        </ul>
      </div>
    </div>
  )
}

// Create aftercare modal for artists
function CreateAftercareModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [clientUid, setClientUid] = useState('')
  const [clientName, setClientName] = useState('')
  const [tattooStyle, setTattooStyle] = useState('')
  const [tattooLocation, setTattooLocation] = useState('')
  const [generalNotes, setGeneralNotes] = useState('')
  const [instructions, setInstructions] = useState([
    { title: 'Day 1: Initial Care', content: 'Keep bandage on for 2-4 hours. Wash gently with lukewarm water and mild soap.', day: 1 },
    { title: 'Day 2-7: Daily Routine', content: 'Apply thin layer of aftercare balm 2-3 times daily. Keep area clean and dry.', day: 2 },
    { title: 'Day 7-14: Healing Phase', content: 'Continue moisturizing. Avoid sun exposure, swimming, and scratching.', day: 7 },
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
    if (!clientUid.trim() || !clientName.trim() || instructions.length === 0) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      await createAftercare(
        user.uid,
        user.displayName || user.email || 'Artist',
        clientUid.trim(),
        clientName.trim(),
        {
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
          <h2 className="text-2xl font-semibold text-white">Create Aftercare Plan</h2>
          <button onClick={onClose} className="text-ink-text-muted transition hover:text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Client UID (from lead)</label>
              <input
                type="text"
                className="input"
                value={clientUid}
                onChange={(e) => setClientUid(e.target.value)}
                placeholder="Client's user ID"
                required
              />
            </div>
            <div>
              <label className="label">Client Name</label>
              <input
                type="text"
                className="input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Tattoo Style (optional)</label>
              <input
                type="text"
                className="input"
                value={tattooStyle}
                onChange={(e) => setTattooStyle(e.target.value)}
                placeholder="Blackwork, Realism..."
              />
            </div>
            <div>
              <label className="label">Tattoo Location (optional)</label>
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
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Aftercare Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
