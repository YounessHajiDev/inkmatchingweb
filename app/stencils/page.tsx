'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { listStencils, uploadStencil, generateStencilWithAI } from '@/lib/stencils'
import { fetchArtistsOnce } from '@/lib/publicProfiles'
import { ensureOneToOneThread, sendImageAttachment } from '@/lib/realtime'
import Image from 'next/image'
import { XMarkIcon, SparklesIcon, ArrowUpTrayIcon, PaperAirplaneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import type { ArtistWithProfile } from '@/types'

export default function StencilsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [urls, setUrls] = useState<string[]>([])
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

  useEffect(() => { if (user) listStencils(user.uid).then(setUrls) }, [user])

  useEffect(() => {
    if (showSendModal && artists.length === 0) {
      setLoadingArtists(true)
      fetchArtistsOnce(100)
        .then(setArtists)
        .finally(() => setLoadingArtists(false))
    }
  }, [showSendModal, artists.length])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return <div className="p-8 text-gray-400">Please login to manage your stencils.</div>

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      await uploadStencil(user.uid, file)
      setUrls(await listStencils(user.uid))
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
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAIModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <SparklesIcon className="w-5 h-5" />
            Generate with AI
          </button>
          <label className="btn-primary cursor-pointer flex items-center gap-2">
            <ArrowUpTrayIcon className="w-5 h-5" />
            {busy ? 'Uploading…' : 'Upload'}
            <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
          </label>
        </div>
      </div>

      {urls.length === 0 ? (
        <div className="card p-12 text-center space-y-4">
          <div className="text-gray-400 text-lg">No stencils yet</div>
          <p className="text-gray-500 text-sm">Upload an image or generate one using AI to get started</p>
          <div className="flex justify-center gap-4 pt-4">
            <button 
              onClick={() => setShowAIModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <SparklesIcon className="w-5 h-5" />
              Generate with AI
            </button>
            <label className="btn-primary cursor-pointer flex items-center gap-2">
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedStencil(u)
                  }}
                  className="px-3 py-2 bg-white/90 hover:bg-white text-black rounded-lg text-sm font-medium transition-colors"
                >
                  View
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSendToArtist(u)
                  }}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-blue-500" />
                Generate Stencil with AI
              </h2>
              <button 
                onClick={() => setShowAIModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Describe your tattoo stencil
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., A minimalist dragon wrapped around a sword, black and white line art suitable for a tattoo stencil"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[120px] resize-none"
                disabled={generating}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Be specific about style, elements, and composition for best results
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowAIModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={onGenerateAI}
                disabled={!aiPrompt.trim() || generating}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStencil(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-12 right-0 flex gap-2">
              <button 
                onClick={() => handleSendToArtist(selectedStencil)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
                Send to Artist
              </button>
              <button 
                onClick={() => setSelectedStencil(null)}
                className="p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="relative w-full h-[80vh]">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <PaperAirplaneIcon className="w-6 h-6 text-blue-500" />
                Send to Artist
              </h2>
              <button 
                onClick={() => {
                  setShowSendModal(false)
                  setStencilToSend(null)
                  setArtistSearch('')
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                disabled={sending}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              {/* Search Bar */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="Search artists by name, city, or style..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled={sending}
                />
              </div>

              {/* Preview */}
              {stencilToSend && (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
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
                <div className="text-center py-8 text-gray-500">Loading artists...</div>
              ) : filteredArtists.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {artistSearch ? 'No artists found matching your search' : 'No artists available'}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredArtists.map((artist) => (
                      <button
                        key={artist.uid}
                        onClick={() => sendStencilToArtist(artist.uid)}
                        disabled={sending}
                        className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-4">
                          {artist.coverURL && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                              <Image 
                                src={artist.coverURL} 
                                alt={artist.displayName} 
                                fill 
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg truncate">
                              {artist.displayName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {artist.city}
                            </p>
                            {artist.normalizedStyles && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                                {artist.normalizedStyles}
                              </p>
                            )}
                          </div>
                          <PaperAirplaneIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sending && (
                <div className="flex items-center justify-center gap-3 py-4">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-600 dark:text-gray-400">Sending stencil...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
