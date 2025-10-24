'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword, signOut, getAuth, getIdTokenResult } from 'firebase/auth'
import { auth } from '@/lib/firebaseClient'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile } from '@/lib/publicProfiles'

export default function AdminLoginPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already signed in, check admin and redirect
    if (!user) return
    ;(async () => {
      try {
        const profile = await getPublicProfile(user.uid)
        const tokenRes = await (await import('firebase/auth')).getIdTokenResult(user)
        const isAdminClaim = Boolean(tokenRes?.claims?.admin === true)
        if (isAdminClaim || profile?.role === 'admin') {
          router.push('/admin')
        } else {
          setError('This account does not have admin access.')
          await signOut(auth)
        }
      } catch (e) {
        console.error(e)
      }
    })()
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      // Validate admin claim or profile role
      const tokenRes = await getIdTokenResult(cred.user)
      const isAdminClaim = Boolean(tokenRes?.claims?.admin === true)
      const profile = await getPublicProfile(cred.user.uid)
      if (isAdminClaim || profile?.role === 'admin') {
        router.push('/admin')
        return
      }
      // Not admin: sign out and show message
      await signOut(auth)
      setError('Account signed in but does not have admin access.')
    } catch (err: any) {
      setError(err?.message ?? 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24">
      <div className="rounded-2xl bg-ink-surface/80 p-8">
        <h1 className="text-2xl font-semibold text-white mb-2">Admin sign in</h1>
        <p className="text-sm text-gray-400 mb-4">Sign in with an admin account to access the dashboard.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="label">Email</div>
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block">
            <div className="label">Password</div>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error && <div className="rounded-md bg-red-600/10 border border-red-500/20 px-3 py-2 text-sm text-red-200">{error}</div>}
          <div className="flex justify-end">
            <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Signing in…' : 'Sign in'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
