'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, deleteUser } from 'firebase/auth'
import { ArrowLeftIcon, XMarkIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid, RocketLaunchIcon } from '@heroicons/react/24/solid'
import { auth } from '@/lib/firebaseClient'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile, saveMyPublicProfile } from '@/lib/publicProfiles'
import { uploadStencil } from '@/lib/stencils'
import { getUserSubscription, type SubscriptionData } from '@/lib/subscriptions'
import { SUBSCRIPTION_TIERS } from '@/lib/subscriptionConfig'
import type { PublicProfile } from '@/types'
import Image from 'next/image'
import { useLocale } from '@/hooks/useLocale'

const appearanceOptions = ['system', 'dark', 'light'] as const

export default function SettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { t, locale, setLocale } = useLocale()
  const [appearance, setAppearance] = useState<typeof appearanceOptions[number]>('dark')
  const [rememberEmail, setRememberEmail] = useState(true)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [publicProfile, setPublicProfile] = useState<'hidden' | 'public' | 'draft'>('hidden')
  const [notifications, setNotifications] = useState(true)
  const [schedule, setSchedule] = useState(3)
  const [locationPrecise, setLocationPrecise] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)

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
        const sub = await getUserSubscription(user.uid)
        if (cancelled) return
        if (p) {
          setProfile(p)
          setPublicProfile(p.isPublic ? 'public' : 'hidden')
        }
        setSubscription(sub)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

   const togglePublicProfile = async (makePublic: boolean) => {
    if (!user) {
       setStatusMessage('❌ You must be logged in')
      return
    }
    
     if (!profile) {
       setStatusMessage('❌ Please set up your profile first')
       router.push('/artist/setup')
      return
    }
    
     setStatusMessage(makePublic ? 'Publishing profile...' : 'Hiding profile...')
    
    try {
       await saveMyPublicProfile(user.uid, { isPublic: makePublic })
       setStatusMessage(makePublic ? '✅ Profile is now public!' : '✅ Profile is now hidden')
       setPublicProfile(makePublic ? 'public' : 'hidden')
       setProfile({ ...profile, isPublic: makePublic })
    } catch (e: any) {
       console.error('Toggle profile error:', e)
       setStatusMessage(`❌ ${e?.message ?? 'Unable to update profile'}`)
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
          <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">{t('preferences')}</p>
          <h1 className="text-3xl font-semibold text-white">{t('preferences')}</h1>
          <p className="text-sm text-ink-text-muted">Customize your experience, manage your account, and keep your public profile under control.</p>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-ink-text-muted">
            {statusMessage}
          </div>
        )}

        {/* Subscription Section */}
        {profile?.role === 'artist' && subscription && (
          <section className="space-y-4 rounded-3xl border border-white/5 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted mb-2">Subscription</h2>
                <div className="flex items-center gap-3">
                  {subscription.tier === 'free' && <SparklesIcon className="w-6 h-6 text-purple-400" />}
                  {subscription.tier === 'pro' && <StarIconSolid className="w-6 h-6 text-yellow-400" />}
                  {subscription.tier === 'premium' && <RocketLaunchIcon className="w-6 h-6 text-pink-400" />}
                  <span className="text-2xl font-bold text-white capitalize">{subscription.tier} Plan</span>
                  {subscription.tier !== 'free' && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full border border-green-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
              {subscription.tier !== 'premium' && (
                <button
                  onClick={() => router.push('/pricing')}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <SparklesIcon className="w-5 h-5" />
                  Upgrade
                </button>
              )}
            </div>

            {/* Current Plan Features */}
            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="text-xs text-ink-text-muted mb-1">Booking Fee</div>
                <div className="text-2xl font-bold text-white">
                  {SUBSCRIPTION_TIERS[subscription.tier].features.bookingFeeRate === 0 ? '0%' : '3%'}
                </div>
                {SUBSCRIPTION_TIERS[subscription.tier].features.bookingFeeRate > 0 && (
                  <div className="text-xs text-yellow-400 mt-1">Upgrade for 0% fees</div>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="text-xs text-ink-text-muted mb-1">Portfolio Images</div>
                <div className="text-2xl font-bold text-white">
                   {profile?.portfolioImages?.length || 0}
                  {SUBSCRIPTION_TIERS[subscription.tier].features.maxPortfolioImages === -1 
                    ? ' / ∞' 
                    : ` / ${SUBSCRIPTION_TIERS[subscription.tier].features.maxPortfolioImages}`}
                </div>
                 {(profile?.portfolioImages?.length || 0) >= SUBSCRIPTION_TIERS[subscription.tier].features.maxPortfolioImages && 
                 SUBSCRIPTION_TIERS[subscription.tier].features.maxPortfolioImages !== -1 && (
                  <div className="text-xs text-yellow-400 mt-1">Limit reached - upgrade for more</div>
                )}
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="text-xs text-ink-text-muted mb-1">AI Design Credits</div>
                <div className="text-2xl font-bold text-white">
                  {profile.aiCreditsUsed || 0}
                  {SUBSCRIPTION_TIERS[subscription.tier].features.aiDesignCredits === -1 
                    ? ' / ∞' 
                    : ` / ${SUBSCRIPTION_TIERS[subscription.tier].features.aiDesignCredits}`}
                </div>
                <div className="text-xs text-ink-text-muted mt-1">Resets monthly</div>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10">
                <div className="text-xs text-ink-text-muted mb-1">Active Leads</div>
                <div className="text-2xl font-bold text-white">
                  0
                  {SUBSCRIPTION_TIERS[subscription.tier].features.maxActiveLeads === -1 
                    ? ' / ∞' 
                    : ` / ${SUBSCRIPTION_TIERS[subscription.tier].features.maxActiveLeads}`}
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/pricing')}
              className="w-full text-center text-sm text-purple-400 hover:text-purple-300 transition-colors pt-2"
            >
              View all plans and features →
            </button>
          </section>
        )}

        <section className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.04] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-ink-text-muted">{t('appearance')}</h2>
              <p className="text-sm text-ink-text-muted">Choose dark, light, or follow system. Tattoo studio dark theme recommended.</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-ink-text-muted">{t('language')}</label>
              <select value={locale} onChange={(e) => setLocale(e.target.value as any)} className="bg-transparent border border-white/5 rounded px-2 py-1 text-sm">
                <option value="en">EN</option>
                <option value="fr">FR</option>
              </select>
            </div>
          </div>
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
                 <p className="text-sm text-ink-text-muted">Manage your artist profile and visibility on Discover page.</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${publicProfile === 'public' ? 'border-ink-accent/60 text-white' : 'border-white/15 text-ink-text-muted'}`}>
                {publicProfile === 'public' ? 'Public' : 'Hidden'}
              </span>
            </div>
           
             {profile ? (
               <div className="space-y-4">
                 {/* Profile summary */}
                 <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                   <p className="text-sm text-ink-text-muted mb-2">Your artist profile:</p>
                   <p className="text-white font-semibold">{profile.displayName}</p>
                   <p className="text-sm text-ink-text-muted">{profile.city}</p>
                   <p className="text-sm text-ink-text-muted">{(profile.portfolioImages?.length || 0)} portfolio images</p>
                 </div>
               
                 <div className="flex flex-wrap gap-3">
                   <button
                     onClick={() => router.push('/artist/setup')}
                     className="btn btn-secondary"
                   >
                     Edit Profile
                   </button>
                   <button
                     onClick={() => togglePublicProfile(true)}
                     disabled={publicProfile === 'public'}
                     className={`btn ${publicProfile === 'public' ? 'btn-primary opacity-50 cursor-not-allowed' : 'btn-primary'}`}
                   >
                     {publicProfile === 'public' ? '✓ Public' : 'Make Public'}
                   </button>
                   <button
                     onClick={() => togglePublicProfile(false)}
                     disabled={publicProfile === 'hidden'}
                     className={`btn ${publicProfile === 'hidden' ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-secondary'}`}
                   >
                     {publicProfile === 'hidden' ? '✓ Hidden' : 'Hide Profile'}
                   </button>
                 </div>
               </div>
             ) : (
               <div className="space-y-4">
                 <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
                   <p className="text-sm text-yellow-200">You haven&apos;t set up your artist profile yet.</p>
                 </div>
                 <button
                   onClick={() => router.push('/artist/setup')}
                   className="btn btn-primary"
                 >
                   Set Up Profile
                 </button>
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
