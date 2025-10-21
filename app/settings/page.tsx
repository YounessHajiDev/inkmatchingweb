'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, deleteUser } from 'firebase/auth'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { auth } from '@/lib/firebaseClient'
import { useAuth } from '@/components/AuthProvider'

const appearanceOptions = ['system', 'dark', 'light'] as const

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [appearance, setAppearance] = useState<typeof appearanceOptions[number]>('dark')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [publicProfile, setPublicProfile] = useState<'hidden' | 'public' | 'draft'>('hidden')
  const [notifications, setNotifications] = useState(true)
  const [schedule, setSchedule] = useState(3)
  const [locationPrecise, setLocationPrecise] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/login')
    } catch (error) {
      console.error(error)
      setStatusMessage('Unable to sign out right now.')
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    const confirmed = window.confirm('Deleting your account is permanent. Do you want to continue?')
    if (!confirmed) return
    try {
      await deleteUser(user)
      router.push('/login')
    } catch (error: any) {
      console.error(error)
      setStatusMessage(error?.message ?? 'Unable to delete account. Reauthenticate and try again.')
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 space-y-8">
      <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-text-muted transition hover:text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.05]">
          <ArrowLeftIcon className="h-5 w-5" />
        </span>
        Back
      </button>

      <div className="space-y-6 rounded-4xl border border-white/10 bg-white/[0.03] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Preferences</p>
          <h1 className="text-3xl font-semibold text-white">Settings</h1>
          <p className="text-sm text-ink-text-muted">Customize your experience, manage your account, and keep your public profile under control.</p>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-ink-text-muted">
            {statusMessage}
          </div>
        )}

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Appearance</h2>
          <p className="text-sm text-ink-text-muted">Choose dark, light, or follow system. Tattoo studio dark theme recommended.</p>
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
            {appearanceOptions.map((option) => (
              <button
                key={option}
                onClick={() => setAppearance(option)}
                className={`rounded-full px-5 py-2 text-sm font-semibold capitalize transition ${
                  appearance === option
                    ? 'bg-ink-button text-white shadow-glow'
                    : 'text-ink-text-muted hover:text-white'
                }`}
              >
                {option === 'system' ? 'Follow system' : option}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Account</h2>
          <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{user?.email ?? 'Guest'}</p>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-text-muted mt-1">Signed in</p>
            </div>
            <div className="flex items-center gap-3">
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
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={handleSignOut} className="btn btn-secondary">Sign out</button>
            <button onClick={handleDeleteAccount} className="btn border border-red-500/40 bg-red-500/10 text-red-200 hover:border-red-400">Delete account</button>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Public profile</h2>
          <p className="text-sm text-ink-text-muted">Control your Discover visibility.</p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setPublicProfile('draft')}
              className={`btn ${publicProfile === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Create / publish
            </button>
            <button
              onClick={() => setPublicProfile('public')}
              className={`btn ${publicProfile === 'public' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Make public
            </button>
            <button
              onClick={() => setPublicProfile('hidden')}
              className={`btn ${publicProfile === 'hidden' ? 'btn-secondary border-white/30' : 'btn-secondary'}`}
            >
              Hide profile
            </button>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Notifications</h2>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-text-muted">Reminders and chat banners.</p>
            <div className="flex items-center gap-3">
              <span
                data-state={notifications ? 'on' : 'off'}
                className="toggle"
                role="switch"
                aria-checked={notifications}
                onClick={() => setNotifications((prev) => !prev)}
              >
                <span className="toggle-thumb" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-ink-text-muted">
                {notifications ? 'Authorized' : 'Muted'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 3, 5].map((day) => (
              <button
                key={day}
                onClick={() => setSchedule(day)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  schedule === day
                    ? 'border-ink-accent/60 bg-ink-button text-white'
                    : 'border-white/10 bg-white/[0.04] text-ink-text-muted hover:text-white'
                }`}
              >
                Schedule aftercare ({day} days)
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Location</h2>
          <p className="text-sm text-ink-text-muted">Control precision & permissions.</p>
          <div className="flex flex-wrap gap-3">
            <button className="btn btn-secondary">Request when-in-use</button>
            <button
              onClick={() => setLocationPrecise((prev) => !prev)}
              className={`btn ${locationPrecise ? 'btn-primary' : 'btn-secondary'}`}
            >
              Request precise (temporary)
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
