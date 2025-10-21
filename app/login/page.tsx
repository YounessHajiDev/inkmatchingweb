'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useAuth } from '@/components/AuthProvider'
import { saveMyPublicProfile } from '@/lib/publicProfiles'
import type { UserRole } from '@/types'

type Mode = 'signin' | 'signup'

const accountTypes: UserRole[] = ['client', 'artist']

export default function LoginPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accountType, setAccountType] = useState<UserRole>('client')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem('inkmatching-email')
    if (stored) setEmail(stored)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (rememberEmail) {
      window.localStorage.setItem('inkmatching-email', email)
    } else {
      window.localStorage.removeItem('inkmatching-email')
    }
  }, [rememberEmail, email])

  useEffect(() => {
    if (user) router.push('/')
  }, [user, router])

  const title = useMemo(() => mode === 'signin' ? 'InkMatching' : 'Create your account', [mode])
  const description = useMemo(() => mode === 'signin'
    ? 'Match with artists, share stencils & aftercare.'
    : 'Match with artists, share stencils & aftercare.', [mode])

  const switchMode = () => {
    setMode((prev) => prev === 'signin' ? 'signup' : 'signin')
    setError(null)
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Enter your email to receive a reset link.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setError('Password reset email sent.')
    } catch (err: any) {
      setError(err?.message ?? 'Unable to send reset email.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password)
        router.push('/')
        return
      }

      if (password !== confirmPassword) throw new Error('Passwords do not match.')
      const credential = await createUserWithEmailAndPassword(auth, email, password)
      if (displayName.trim()) {
        await updateProfile(credential.user, { displayName: displayName.trim() })
      }
      await saveMyPublicProfile(credential.user.uid, {
        uid: credential.user.uid,
        role: accountType,
        displayName: displayName.trim() || email,
        city: '',
        styles: '',
        isPublic: accountType === 'artist' ? false : true,
      })
      router.push(accountType === 'artist' ? '/settings' : '/')
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="relative overflow-hidden rounded-4xl border border-white/10 bg-white/[0.04] p-8 text-sm shadow-glow-soft backdrop-blur-md">
        <div className="absolute inset-0 bg-ink-panel opacity-70" aria-hidden />
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-ink-text-muted">{description}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-3">
                  <p className="label">Account type</p>
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                    {accountTypes.map((type) => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setAccountType(type)}
                        className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                          accountType === type ? 'bg-ink-button text-white shadow-glow' : 'text-ink-text-muted hover:text-white'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

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
                placeholder="Password (min 6)"
                minLength={6}
                required
              />
            </div>

            {mode === 'signup' && (
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
            )}

            {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  data-state={rememberEmail ? 'on' : 'off'}
                  className="toggle"
                  role="switch"
                  aria-checked={rememberEmail}
                  onClick={() => setRememberEmail((prev) => !prev)}
                >
                  <span className="toggle-thumb" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Remember email</span>
              </div>
              {mode === 'signin' && (
                <button type="button" onClick={handleForgotPassword} className="text-sm font-semibold text-ink-accent hover:text-white">
                  Forgot password?
                </button>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-base">
              {loading ? 'Processing…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <button onClick={switchMode} className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-semibold text-ink-text-muted transition hover:text-white">
            {mode === 'signin' ? 'Create account →' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
