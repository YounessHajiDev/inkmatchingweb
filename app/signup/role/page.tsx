'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { UserIcon, PaintBrushIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

export default function RoleSelectionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<'client' | 'artist' | null>(null)

  const handleContinue = () => {
    if (!selectedRole) return
    
    if (selectedRole === 'client') {
      // Client signup - create account directly
      router.push(`/signup/complete?role=client`)
    } else {
      // Artist signup - choose plan first
      router.push('/signup/plan')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Join InkMatching
          </h1>
          <p className="text-lg text-ink-text-muted max-w-2xl mx-auto">
            Choose how you want to use InkMatching
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Client Card */}
          <button
            onClick={() => setSelectedRole('client')}
            className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
              selectedRole === 'client'
                ? 'border-ink-accent shadow-glow-lg scale-[1.02]'
                : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent opacity-60" />
            <div className="relative p-8 space-y-6">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto transition-all ${
                selectedRole === 'client'
                  ? 'bg-gradient-to-br from-blue-500 to-cyan-500 shadow-glow'
                  : 'bg-white/5 border border-white/10'
              }`}>
                <UserIcon className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">I&#39;m a Client</h2>
                <p className="text-sm text-ink-text-muted">
                  Find talented tattoo artists, browse portfolios, and book appointments
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Discover artists near you</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Browse portfolios and styles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Book appointments directly</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Track aftercare progress</span>
                </li>
              </ul>

              {/* Free badge */}
              <div className="pt-2">
                <span className="inline-block px-4 py-2 bg-green-500/20 text-green-400 text-sm font-semibold rounded-full border border-green-500/30">
                  Always Free
                </span>
              </div>
            </div>
          </button>

          {/* Artist Card */}
          <button
            onClick={() => setSelectedRole('artist')}
            className={`relative overflow-hidden rounded-3xl border-2 transition-all duration-300 ${
              selectedRole === 'artist'
                ? 'border-purple-500 shadow-glow-lg scale-[1.02]'
                : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent opacity-60" />
            <div className="relative p-8 space-y-6">
              {/* Icon */}
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto transition-all ${
                selectedRole === 'artist'
                  ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-glow'
                  : 'bg-white/5 border border-white/10'
              }`}>
                <PaintBrushIcon className="w-10 h-10 text-white" />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-white">I&#39;m an Artist</h2>
                <p className="text-sm text-ink-text-muted">
                  Showcase your portfolio, manage bookings, and grow your business
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 text-left">
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Beautiful portfolio showcase</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Lead & booking management</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Client aftercare tracking</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-ink-text-muted">
                  <SparklesIcon className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <span>Analytics & insights</span>
                </li>
              </ul>

              {/* Plan badge */}
              <div className="pt-2">
                <span className="inline-block px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-semibold rounded-full border border-purple-500/30">
                  Free & Premium Plans
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Continue Button */}
        <div className="text-center space-y-4">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`btn btn-primary px-12 py-4 text-lg ${
              !selectedRole ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Continue {selectedRole === 'artist' ? '→ Choose Plan' : '→'}
          </button>
          
          <p className="text-sm text-ink-text-muted">
            Already have an account?{' '}
            <button
              onClick={() => router.push('/login')}
              className="text-ink-accent hover:text-white font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
