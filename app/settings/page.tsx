'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, deleteUser } from 'firebase/auth'
import { ArrowLeftIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { auth } from '@/lib/firebaseClient'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile, saveMyPublicProfile } from '@/lib/publicProfiles'
import { uploadStencil } from '@/lib/stencils'
import type { PublicProfile } from '@/types'
import Image from 'next/image'

const appearanceOptions = ['system', 'dark', 'light'] as const

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [appearance, setAppearance] = useState<typeof appearanceOptions[number]>('dark')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [publicProfile, setPublicProfile] = useState<'hidden' | 'public' | 'draft'>('hidden')
  const [editingProfile, setEditingProfile] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [styles, setStyles] = useState('')
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
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

  // Load current public profile
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (!user) return
      try {
        const p = await getPublicProfile(user.uid)
        if (cancelled) return
        if (p) {
          setProfile(p)
          setPublicProfile(p.isPublic ? 'public' : 'hidden')
          setDisplayName(p.displayName ?? user.email ?? '')
          setCity(p.city ?? '')
          const stylesStr = Array.isArray(p.styles) ? p.styles.join(', ') : (p.styles ?? '')
          setStyles(stylesStr)
          setPortfolioImages(p.portfolioImages ?? [])
        }
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingPortfolio(true)
    try {
      const url = await uploadStencil(user.uid, file)
      setPortfolioImages([...portfolioImages, url])
      setStatusMessage('Portfolio image uploaded')
    } catch (err: any) {
      console.error('Upload failed:', err)
      setStatusMessage(err?.message || 'Upload failed')
    } finally {
      setUploadingPortfolio(false)
      e.target.value = ''
    }
  }

  const removePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index))
  }

  const saveProfile = async (makePublic?: boolean) => {
    if (!user) return
    try {
      const input: Partial<PublicProfile> = {
        uid: user.uid,
        role: profile?.role ?? 'artist',
        displayName: displayName.trim() || user.email || 'Artist',
        city: city.trim(),
        styles: styles.split(',').map((s) => s.trim()).filter(Boolean),
        portfolioImages: portfolioImages,
        isPublic: makePublic ?? (publicProfile === 'public'),
      }

      // Geocode the city to get coordinates
      if (input.city && input.role === 'artist') {
        try {
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input.city)}&format=json&limit=1`
          const response = await fetch(geocodeUrl, {
            headers: { 'User-Agent': 'InkMatching/1.0' }
          })
          const results = await response.json()
          if (results && results.length > 0) {
            input.latitude = parseFloat(results[0].lat)
            input.longitude = parseFloat(results[0].lon)
          }
        } catch (geoError) {
          console.warn('Geocoding failed, profile saved without coordinates:', geoError)
        }
      }

      await saveMyPublicProfile(user.uid, input)
      setStatusMessage('Profile saved')
      setEditingProfile(false)
      setProfile({ ...(profile ?? (input as any)), ...(input as any) } as PublicProfile)
      setPublicProfile((makePublic ?? input.isPublic) ? 'public' : 'hidden')
    } catch (e: any) {
      console.error(e)
      setStatusMessage(e?.message ?? 'Unable to save profile')
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

        {/* Only show public profile section for artists */}
        {profile?.role === 'artist' && (
          <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">Public profile</h2>
                <p className="text-sm text-ink-text-muted">Control your Discover visibility.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${publicProfile === 'public' ? 'border-ink-accent/60 text-white' : 'border-white/15 text-ink-text-muted'}`}>
                {publicProfile === 'public' ? 'Public' : 'Hidden'}
              </span>
            </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setEditingProfile(true)}
              className={`btn ${editingProfile ? 'btn-primary' : 'btn-secondary'}`}
            >
              Create / publish
            </button>
            <button
              onClick={() => saveProfile(true)}
              className={`btn ${publicProfile === 'public' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Make public
            </button>
            <button
              onClick={() => saveProfile(false)}
              className={`btn ${publicProfile === 'hidden' ? 'btn-secondary border-white/30' : 'btn-secondary'}`}
            >
              Hide profile
            </button>
          </div>
          {editingProfile && (
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div>
                <label className="label">Display name</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Artist or studio name" />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Montreal" />
              </div>
              <div>
                <label className="label">Styles (comma separated)</label>
                <input className="input" value={styles} onChange={(e) => setStyles(e.target.value)} placeholder="Blackwork, Realism, Fine line" />
              </div>
              
              {/* Portfolio Images */}
              {profile?.role === 'artist' && (
                <div>
                  <label className="label">Portfolio Images</label>
                  <div className="space-y-3">
                    {portfolioImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {portfolioImages.map((url, i) => (
                          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                            <Image src={url} alt={`Portfolio ${i + 1}`} fill className="object-cover" />
                            <button
                              onClick={() => removePortfolioImage(i)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XMarkIcon className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label className="btn btn-secondary cursor-pointer w-full">
                      {uploadingPortfolio ? 'Uploading...' : '+ Add Portfolio Image'}
                      <input type="file" accept="image/*" onChange={handlePortfolioUpload} className="hidden" disabled={uploadingPortfolio} />
                    </label>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-1">
                <button className="btn btn-secondary" onClick={() => setEditingProfile(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={() => saveProfile()}>Save</button>
              </div>
            </div>
          )}
        </section>
        )}

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
