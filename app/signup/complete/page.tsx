'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebaseClient'
import { ref, set } from 'firebase/database'
import { saveMyPublicProfile } from '@/lib/publicProfiles'
import type { UserRole } from '@/types'

function SignupCompleteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') as UserRole | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
   const [selectedPlan, setSelectedPlan] = useState<'free' | 'pro' | 'premium'>('free')

  useEffect(() => {
    if (!role || (role !== 'client' && role !== 'artist')) {
      router.push('/signup/role')
      return
    }

    // Get selected plan from sessionStorage for artists
    if (role === 'artist' && typeof window !== 'undefined') {
       const plan = (sessionStorage.getItem('selectedPlan') as 'free' | 'pro' | 'premium') || 'free'
      setSelectedPlan(plan)
    }
  }, [role, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!role) {
      setError('Invalid role selection')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      // Create Firebase Auth user
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      
      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() })
      }

      // Save to private users path
      await set(ref(db, `users/${credential.user.uid}`), {
        uid: credential.user.uid,
        email,
        displayName: displayName.trim() || email,
        role,
        subscriptionTier: role === 'artist' ? selectedPlan : undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })

      // Create public profile
      await saveMyPublicProfile(credential.user.uid, {
        uid: credential.user.uid,
        role,
        displayName: displayName.trim() || email,
        city: '',
        styles: '',
        isPublic: false, // Always start as hidden, artist will set up profile
        subscriptionTier: role === 'artist' ? selectedPlan : undefined,
        subscriptionStatus: 'active',
      })

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('selectedPlan')
        sessionStorage.removeItem('selectedBilling')
      }

      // Small delay for auth propagation
      await new Promise(resolve => setTimeout(resolve, 400))

      // Redirect based on role
      if (role === 'artist') {
        // Redirect to artist profile setup
        router.push('/artist/setup')
      } else {
        // Redirect to discover page for clients
        router.push('/')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err?.message ?? 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  if (!role) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.04] p-8 text-sm shadow-glow-soft backdrop-blur-md">
          <div className="absolute inset-0 bg-ink-panel opacity-70" aria-hidden />
          
          <div className="relative z-10 space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-white">
                Create Your Account
              </h1>
              <p className="text-sm text-ink-text-muted">
                {role === 'artist' 
                  ? `You&apos;re signing up as an Artist with the ${selectedPlan === 'free' ? 'Free' : selectedPlan === 'pro' ? 'Pro' : 'Premium'} plan`
                  : "You&apos;re signing up as a Client"}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Display name</label>
                <input
                  className="input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or studio name"
                  required
                />
              </div>

              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="label">Confirm password</label>
                <input
                  type="password"
                  className="input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full py-3 text-base"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            {/* Back button */}
            <button
              onClick={() => router.back()}
              className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-ink-text-muted transition hover:text-white"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SignupCompleteContent />
    </Suspense>
  )
}
