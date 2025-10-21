'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { listStencils, uploadStencil, generateStencilWithAI } from '@/lib/stencils'
import Image from 'next/image'
import { XMarkIcon, SparklesIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function StencilsPage() {
  const { user, loading } = useAuth()
  const [urls, setUrls] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedStencil, setSelectedStencil] = useState<string | null>(null)

  useEffect(() => { if (user) listStencils(user.uid).then(setUrls) }, [user])

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
    } catch (error) {
      console.error('AI generation failed:', error)
      alert('Failed to generate stencil. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

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
              className="card overflow-hidden relative aspect-square cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => setSelectedStencil(u)}
            >
              <Image src={u} alt={`stencil-${i}`} fill className="object-cover" />
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
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button 
              onClick={() => setSelectedStencil(null)}
              className="absolute -top-12 right-0 p-2 bg-white dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
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
    </div>
  )
}
