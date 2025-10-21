'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { listStencils, uploadStencil, generateStencilWithAI } from '@/lib/stencils'
import { fetchArtistsOnce, getPublicProfile } from '@/lib/publicProfiles'
import { ensureOneToOneThread, sendImageAttachment, subscribeToReceivedStencils } from '@/lib/realtime'
import Image from 'next/image'
import { XMarkIcon, SparklesIcon, ArrowUpTrayIcon, PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ArtistWithProfile } from '@/types'

interface ReceivedStencil {
  url: string
  senderId: string
  senderName: string
  threadId: string
  timestamp: number
}

export default function StencilsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [urls, setUrls] = useState<string[]>([])
  const [receivedStencils, setReceivedStencils] = useState<ReceivedStencil[]>([])
  const [busy, setBusy] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedStencil, setSelectedStencil] = useState<string | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [stencilToSend, setStencilToSend] = useState<string | null>(null)
  const [artists, setArtists] = useState<ArtistWithProfile[]>([])
  const [artistSearch, setArtistSearch] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingArtists, setLoadingArtists] = useState(false)

  // Fetch user role
  useEffect(() => {
    if (!user) return
    getPublicProfile(user.uid).then((profile) => {
      setUserRole(profile?.role ?? 'client')
    })
  }, [user])

  // For clients: load their uploaded stencils
  useEffect(() => { 
    if (user && userRole === 'client') {
      listStencils(user.uid).then(setUrls) 
    }
  }, [user, userRole])

  // For artists: subscribe to received stencils from chats
  useEffect(() => {
    if (!user || userRole !== 'artist') return
    const unsubscribe = subscribeToReceivedStencils(user.uid, setReceivedStencils)
    return unsubscribe
  }, [user, userRole])

  useEffect(() => {
    if (showSendModal && artists.length === 0) {
      setLoadingArtists(true)
      fetchArtistsOnce(100)
        .then(setArtists)
        .finally(() => setLoadingArtists(false))
    }
  }, [showSendModal, artists.length])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return <div className="p-8 text-gray-400">Please login to view stencils.</div>

  // Artists see received stencils from clients
  if (userRole === 'artist') {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Received Stencils</h1>
          <p className="text-sm text-ink-text-muted">Stencils sent to you by clients in conversations</p>
        </div>

        {receivedStencils.length === 0 ? (
          <div className="card p-12 text-center space-y-6">
            <div className="text-gray-400 text-lg font-medium">No stencils received yet</div>
            <p className="text-gray-500 text-sm max-w-md mx-auto">When clients send you stencils in chat, they will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {receivedStencils.map((stencil, i) => (
              <div 
                key={i} 
                className="card overflow-hidden relative aspect-square group cursor-pointer"
                onClick={() => router.push(`/chat/${stencil.threadId}`)}
              >
                <Image 
                  src={stencil.url} 
                  alt={`Stencil from ${stencil.senderName}`} 
                  fill 
                  className="object-cover"
                />
                {/* Overlay with sender info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-4 gap-2">
                  <p className="text-white text-sm font-semibold">{stencil.senderName}</p>
                  <p className="text-ink-text-muted text-xs">
                    {new Date(stencil.timestamp * 1000).toLocaleDateString()}
                  </p>
                  <button className="btn-primary btn-sm mt-2">
                    Open Chat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Clients see upload/AI generation UI
  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadStencil(user.uid, file)
      setUrls(await listStencils(user.uid))
    } catch (err: any) {
      console.error('Upload failed:', err)
      const msg: string = err?.message || 'Upload failed. Please try again.'
      alert(msg)
    } finally { setBusy(false); e.target.value = '' }
  }

  const onGenerateAI = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      await generateStencilWithAI(user.uid, aiPrompt)
      setUrls(await listStencils(user.uid))
      setShowAIModal(false)
      setAiPrompt('')
    } catch (error: any) {
      console.error('AI generation failed:', error)
      const errorMessage = error?.message || 'Failed to generate stencil. Please try again.'
      
      // Show more helpful error message
      if (errorMessage.includes('API key not configured')) {
        alert('AI generation is not configured. Please contact the administrator.')
      } else if (errorMessage.includes('quota')) {
        alert('AI generation quota exceeded. Please try again later.')
      } else {
        alert(errorMessage)
      }
    } finally {
      setGenerating(false)
    }
  }

  const handleSendToArtist = (stencilUrl: string) => {
    setStencilToSend(stencilUrl)
    setShowSendModal(true)
    setSelectedStencil(null)
  }

  const sendStencilToArtist = async (artistUid: string) => {
    if (!stencilToSend || !user) return
    setSending(true)
    try {
      // Create or get existing thread with artist
      const threadId = await ensureOneToOneThread(user.uid, artistUid)
      
      // Send the stencil as an image attachment
      await sendImageAttachment(threadId, user.uid, stencilToSend)
      
      // Navigate to the chat
      router.push(`/chat/${threadId}`)
    } catch (error: any) {
      console.error('Failed to send stencil:', error)
      alert(error.message || 'Failed to send stencil. Please try again.')
      setSending(false)
    }
  }

  const filteredArtists = artists.filter(artist => {
    const searchLower = artistSearch.toLowerCase()
    return (
      artist.displayName?.toLowerCase().includes(searchLower) ||
      artist.city?.toLowerCase().includes(searchLower) ||
      artist.normalizedStyles?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stencils</h1>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAIModal(true)}
            className="btn-primary"
          >
            <SparklesIcon className="w-5 h-5" />
            Generate with AI
          </button>
          <label className="btn-secondary cursor-pointer">
            <ArrowUpTrayIcon className="w-5 h-5" />
            {busy ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" disabled={busy} />
          </label>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="card p-12 text-center space-y-6">
          <div className="text-gray-400 text-lg font-medium">No stencils yet</div>
          <p className="text-gray-500 text-sm max-w-md mx-auto">Upload an image or generate one using AI to get started with your tattoo designs</p>
          <div className="flex justify-center gap-4 pt-4">
            <button 
              onClick={() => setShowAIModal(true)}
              className="btn-primary"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate with AI
            </button>
            <label className="btn-secondary cursor-pointer">
              <ArrowUpTrayIcon className="w-5 h-5" />
              Upload Image
              <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {urls.map((u, i) => (
            <div 
              key={i} 
              className="card overflow-hidden relative aspect-square group"
            >
              <Image 
                src={u} 
                alt={`stencil-${i}`} 
                fill 
                className="object-cover cursor-pointer"
                onClick={() => setSelectedStencil(u)}
              />
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4 gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStencil(u)
                  }}
                  className="btn-secondary btn-sm"
                >
                  View Full
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSendToArtist(u)
                  }}
                  className="btn-primary btn-sm"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-ink-surface border border-white/10 rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-glow-soft animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <SparklesIcon className="w-7 h-7 text-ink-accent" />
                Generate Stencil with AI
              </h2>
              <button 
                onClick={() => setShowAIModal(false)}
                className="btn-icon-secondary"
                disabled={generating}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <label className="label">
                Describe your tattoo stencil
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., A minimalist dragon wrapped around a sword, black and white line art suitable for a tattoo stencil"
                className="textarea min-h-[140px]"
                disabled={generating}
              />
              <p className="text-xs text-ink-text-muted">
                💡 Be specific about style, elements, and composition for best results
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 btn-secondary"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={onGenerateAI}
                disabled={!aiPrompt.trim() || generating}
                className="flex-1 btn-primary"
              >
                {generating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stencil Preview Modal */}
      {selectedStencil && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedStencil(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-14 right-0 flex gap-3">
              <button 
                onClick={() => handleSendToArtist(selectedStencil)}
                className="btn-primary"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Send to Artist
              </button>
              <button 
                onClick={() => setSelectedStencil(null)}
                className="btn-icon-secondary"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full h-[80vh] rounded-2xl overflow-hidden border border-white/10 shadow-glow">
              <Image 
                src={selectedStencil} 
                alt="Stencil preview" 
                fill 
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Send to Artist Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-ink-surface border border-white/10 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-glow-soft">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <PaperAirplaneIcon className="w-7 h-7 text-ink-accent" />
                Send to Artist
              </h2>
              <button 
                onClick={() => {
                  setShowSendModal(false)
                  setStencilToSend(null)
                  setArtistSearch('')
                }}
                className="btn-icon-secondary"
                disabled={sending}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-text-muted" />
                <input
                  type="text"
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="Search artists by name, city, or style..."
                  className="input pl-12"
                  disabled={sending}
                />
              </div>

              {/* Preview */}
              {stencilToSend && (
                <div className="relative w-full h-40 rounded-2xl overflow-hidden border border-white/10 shadow-inner-glow">
                  <Image 
                    src={stencilToSend} 
                    alt="Stencil to send" 
                    fill 
                    className="object-cover"
                  />
                </div>
              )}

              {/* Artists List */}
              {loadingArtists ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-ink-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-ink-text-muted text-sm">Loading artists...</p>
                </div>
              ) : filteredArtists.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-ink-text-muted">
                    {artistSearch ? 'No artists found matching your search' : 'No artists available'}
                  </p>
                  {artistSearch && (
                    <button onClick={() => setArtistSearch('')} className="btn-ghost btn-sm">
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-ink-text-muted font-medium">
                    {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {filteredArtists.map((artist) => (
                      <button
                        key={artist.uid}
                        onClick={() => sendStencilToArtist(artist.uid)}
                        disabled={sending}
                        className="w-full p-4 border border-white/10 rounded-2xl bg-white/5 hover:bg-white/10 hover:border-ink-accent/40 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                      >
                        <div className="flex items-center gap-4">
                          {artist.coverURL && (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10">
                              <Image 
                                src={artist.coverURL} 
                                alt={artist.displayName} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate group-hover:text-ink-accent transition-colors">
                              {artist.displayName}
                            </h3>
                            <p className="text-sm text-ink-text-muted">
                              📍 {artist.city}
                            </p>
                            {artist.normalizedStyles && (
                              <p className="text-xs text-ink-text-muted truncate mt-1">
                                {artist.normalizedStyles}
                              </p>
                            )}
                          </div>
                          <PaperAirplaneIcon className="w-5 h-5 text-ink-accent flex-shrink-0 group-hover:scale-110 transition-transform" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sending && (
                <div className="flex items-center justify-center gap-3 py-6 bg-ink-surface/50 rounded-2xl">
                  <div className="w-6 h-6 border-2 border-ink-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-ink-text font-medium">Sending stencil...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
