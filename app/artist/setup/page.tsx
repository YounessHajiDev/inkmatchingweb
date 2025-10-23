'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile, saveMyPublicProfile } from '@/lib/publicProfiles'
import { uploadStencil } from '@/lib/stencils'
import { getUserSubscription } from '@/lib/subscriptions'
 import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/subscriptionConfig'
import { XMarkIcon, StarIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import Image from 'next/image'
import type { PublicProfile } from '@/types'

export default function ArtistSetupPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [styles, setStyles] = useState('')
  const [portfolioImages, setPortfolioImages] = useState<string[]>([])
  const [coverURL, setCoverURL] = useState('')
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const [p, sub] = await Promise.all([
          getPublicProfile(user.uid),
          getUserSubscription(user.uid)
        ])

        if (cancelled) return

        // Check if user is artist
        if (p && p.role !== 'artist') {
          router.push('/')
          return
        }

        if (p) {
          setProfile(p)
          setDisplayName(p.displayName ?? user.email ?? '')
          setCity(p.city ?? '')
          setAddress(p.address ?? '')
          const stylesStr = Array.isArray(p.styles) ? p.styles.join(', ') : (p.styles ?? '')
          setStyles(stylesStr)
          setPortfolioImages(p.portfolioImages ?? [])
          setCoverURL(p.coverURL ?? '')
        } else {
          setDisplayName(user.email ?? '')
        }

        setSubscription(sub)
      } catch (e) {
        console.error(e)
        setStatusMessage('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [user, router])

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) {
      setStatusMessage('Please select a file')
      return
    }

     const currentTier: SubscriptionTier = subscription?.tier || 'free'
    const maxImages = SUBSCRIPTION_TIERS[currentTier].features.maxPortfolioImages
    if (maxImages !== -1 && portfolioImages.length >= maxImages) {
      setStatusMessage(`You've reached the limit of ${maxImages} images. Upgrade to add more!`)
      e.target.value = ''
      return
    }

    if (!file.type.startsWith('image/')) {
      setStatusMessage('Please select an image file')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('Image size must be less than 5MB')
      e.target.value = ''
      return
    }

    setUploadingPortfolio(true)
    setStatusMessage('Uploading image...')

    try {
      const url = await uploadStencil(user.uid, file)
      setPortfolioImages([...portfolioImages, url])
      if (portfolioImages.length === 0) {
        setCoverURL(url)
      }
      setStatusMessage('✅ Image uploaded successfully!')
    } catch (err: any) {
      console.error('Upload failed:', err)
      setStatusMessage(`❌ ${err?.message || 'Upload failed'}`)
    } finally {
      setUploadingPortfolio(false)
      e.target.value = ''
    }
  }

  const removePortfolioImage = (index: number) => {
    const imageToRemove = portfolioImages[index]
    const newImages = portfolioImages.filter((_, i) => i !== index)
    setPortfolioImages(newImages)
    if (imageToRemove === coverURL) {
      setCoverURL(newImages[0] ?? '')
    }
  }

  const setAsFeaturedCover = (url: string) => {
    setCoverURL(url)
    setStatusMessage('Featured cover image updated')
  }

  const handleSaveProfile = async (makePublic: boolean = false) => {
    if (!user) return

    if (!displayName.trim()) {
      setStatusMessage('❌ Display name is required')
      return
    }

    if (!city.trim()) {
      setStatusMessage('❌ City is required')
      return
    }

    if (!styles.trim()) {
      setStatusMessage('❌ Please add at least one style')
      return
    }

    if (portfolioImages.length === 0) {
      setStatusMessage('❌ Please add at least one portfolio image')
      return
    }

    setSaving(true)
    setStatusMessage('Saving profile...')

    try {
      const input: Partial<PublicProfile> = {
        uid: user.uid,
        role: 'artist',
        displayName: displayName.trim(),
        city: city.trim(),
        styles: styles.split(',').map((s) => s.trim()).filter(Boolean),
        address: address.trim() || undefined,
        portfolioImages,
        coverURL,
        isPublic: makePublic,
      }

      // Geocode address or city
      if (input.address || input.city) {
        try {
          const query = input.address ? `${input.address}${input.city ? ', ' + input.city : ''}` : input.city!
          const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
          const response = await fetch(geocodeUrl, {
            headers: { 'User-Agent': 'InkMatching/1.0' }
          })
          const results = await response.json()
          if (results && results.length > 0) {
            input.latitude = parseFloat(results[0].lat)
            input.longitude = parseFloat(results[0].lon)
          }
        } catch (geoError) {
          console.warn('Geocoding failed:', geoError)
        }
      }

      await saveMyPublicProfile(user.uid, input)
      setStatusMessage('✅ Profile saved successfully!')
      setProfile({ ...(profile ?? (input as any)), ...(input as any) } as PublicProfile)

      // Small delay then redirect
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (makePublic) {
        router.push('/leads')
      } else {
        // Just saved as draft
        setCurrentStep(3)
      }
    } catch (e: any) {
      console.error('Save profile error:', e)
      setStatusMessage(`❌ ${e?.message ?? 'Unable to save profile'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Set Up Your Artist Profile
          </h1>
          <p className="text-xl text-ink-text-muted max-w-2xl mx-auto">
            Create your professional portfolio to start receiving booking requests
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentStep >= step
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow'
                  : 'bg-white/5 text-ink-text-muted border border-white/10'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 rounded-full transition-all ${
                  currentStep > step ? 'bg-purple-500' : 'bg-white/10'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-4xl border border-white/10 bg-white/[0.03] p-8 shadow-glow-soft backdrop-blur-md space-y-6">
          {statusMessage && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm text-ink-text-muted">
              {statusMessage}
            </div>
          )}

          {/* Step 1: Basic Info */}
          <section className={`space-y-4 ${currentStep !== 1 && 'opacity-50 pointer-events-none'}`}>
            <h2 className="text-2xl font-bold text-white">Basic Information</h2>
            
            <div>
              <label className="label">Display name *</label>
              <input
                className="input"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Artist or studio name"
                required
              />
            </div>

            <div>
              <label className="label">Address (optional)</label>
              <input
                className="input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, Suite 2"
              />
            </div>

            <div>
              <label className="label">City *</label>
              <input
                className="input"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Montreal"
                required
              />
            </div>

            <div>
              <label className="label">Tattoo Styles *</label>
              <input
                className="input"
                value={styles}
                onChange={(e) => setStyles(e.target.value)}
                placeholder="Blackwork, Realism, Fine line (comma separated)"
                required
              />
              <p className="text-xs text-ink-text-muted mt-1">
                Separate multiple styles with commas
              </p>
            </div>

            {currentStep === 1 && (
              <button
                onClick={() => {
                  if (!displayName.trim() || !city.trim() || !styles.trim()) {
                    setStatusMessage('Please fill in all required fields')
                    return
                  }
                  setCurrentStep(2)
                  setStatusMessage(null)
                }}
                className="btn btn-primary w-full"
              >
                Continue to Portfolio →
              </button>
            )}
          </section>

          {/* Step 2: Portfolio */}
          {currentStep >= 2 && (
            <section className={`space-y-4 ${currentStep !== 2 && 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-2xl font-bold text-white">Portfolio & Cover Image</h2>

              {/* Featured Cover */}
              <div>
                <label className="label mb-3">Featured Cover Image</label>
                <p className="text-xs text-ink-text-muted mb-3">
                  This large image will be displayed at the top of your profile
                </p>
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-ink-accent/30 bg-gradient-to-br from-ink-accent/10 via-purple-500/10 to-ink-accent/5 shadow-glow group">
                  {coverURL ? (
                    <>
                      <Image src={coverURL} alt="Featured cover" fill className="object-cover" />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-ink-accent/90 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-glow">
                        <StarIconSolid className="w-4 h-4" />
                        Featured
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <div className="text-center space-y-2">
                        <StarIcon className="w-12 h-12 text-ink-text-muted mx-auto opacity-40" />
                        <p className="text-sm text-ink-text-muted">No featured cover image</p>
                        <p className="text-xs text-ink-text-muted">Upload portfolio images below and tap the star to set as featured</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio Images */}
              <div>
                <label className="label mb-3">Portfolio Images *</label>
                <p className="text-xs text-ink-text-muted mb-3">
                  Showcase your best work. Tap the star icon to set one as your featured cover.
                </p>

                {portfolioImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {portfolioImages.map((url, i) => (
                      <div
                        key={i}
                        className={`relative aspect-square rounded-xl overflow-hidden border-2 group transition-all ${
                          url === coverURL
                            ? 'border-ink-accent shadow-glow ring-2 ring-ink-accent/30'
                            : 'border-white/10 hover:border-ink-accent/50'
                        }`}
                      >
                        <Image src={url} alt={`Portfolio ${i + 1}`} fill className="object-cover" />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        {url === coverURL && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-ink-accent text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-glow">
                            <StarIconSolid className="w-3 h-3" />
                            FEATURED
                          </div>
                        )}

                        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setAsFeaturedCover(url)}
                            disabled={url === coverURL}
                            className={`p-2 rounded-full backdrop-blur-xl transition-all ${
                              url === coverURL
                                ? 'bg-ink-accent/90 text-white cursor-default'
                                : 'bg-white/20 hover:bg-ink-accent/90 text-white hover:scale-110'
                            }`}
                            title={url === coverURL ? 'Currently featured' : 'Set as featured cover'}
                          >
                            {url === coverURL ? (
                              <StarIconSolid className="w-4 h-4" />
                            ) : (
                              <StarIcon className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => removePortfolioImage(i)}
                            className="p-2 rounded-full bg-red-500/80 hover:bg-red-500 text-white transition-all hover:scale-110 backdrop-blur-xl"
                            title="Remove image"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(() => {
                   const currentTier: SubscriptionTier = subscription?.tier || 'free'
                  const maxImages = SUBSCRIPTION_TIERS[currentTier].features.maxPortfolioImages
                  const canUpload = maxImages === -1 || portfolioImages.length < maxImages

                  return canUpload ? (
                    <label className="btn btn-secondary cursor-pointer w-full flex items-center justify-center gap-2 group">
                      <span className="text-2xl group-hover:scale-110 transition-transform">+</span>
                      {uploadingPortfolio ? 'Uploading...' : `Add Portfolio Image (${portfolioImages.length}/${maxImages === -1 ? '∞' : maxImages})`}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortfolioUpload}
                        className="hidden"
                        disabled={uploadingPortfolio}
                      />
                    </label>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center">
                      <p className="text-sm text-ink-text-muted">Maximum of {maxImages} portfolio images reached</p>
                      <p className="text-xs text-ink-text-muted mt-1">
                        {currentTier === 'free' ? 'Upgrade to Pro for 20 images or Premium for unlimited' : 'Remove an image to upload a new one'}
                      </p>
                      {currentTier !== 'premium' && (
                        <button
                          onClick={() => router.push('/pricing')}
                          className="mt-3 btn btn-primary text-sm"
                        >
                          <SparklesIcon className="w-4 h-4 inline mr-1" />
                          Upgrade Plan
                        </button>
                      )}
                    </div>
                  )
                })()}
              </div>

              {currentStep === 2 && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="btn btn-secondary"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => {
                      if (portfolioImages.length === 0) {
                        setStatusMessage('Please add at least one portfolio image')
                        return
                      }
                      setCurrentStep(3)
                      setStatusMessage(null)
                    }}
                    className="btn btn-primary flex-1"
                  >
                    Review & Publish →
                  </button>
                </div>
              )}
            </section>
          )}

          {/* Step 3: Review & Publish */}
          {currentStep >= 3 && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-white">Review & Publish</h2>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
                <div>
                  <p className="text-xs text-ink-text-muted">Display Name</p>
                  <p className="text-white font-semibold">{displayName}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-text-muted">Location</p>
                  <p className="text-white font-semibold">{address ? `${address}, ${city}` : city}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-text-muted">Styles</p>
                  <p className="text-white font-semibold">{styles}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-text-muted">Portfolio Images</p>
                  <p className="text-white font-semibold">{portfolioImages.length} image(s)</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  ← Back
                </button>
                <button
                  onClick={() => handleSaveProfile(false)}
                  className="btn btn-secondary flex-1"
                  disabled={saving}
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSaveProfile(true)}
                  className="btn btn-primary flex-1"
                  disabled={saving}
                >
                  {saving ? 'Publishing...' : 'Publish Profile →'}
                </button>
              </div>

              <p className="text-xs text-ink-text-muted text-center">
                Publishing your profile makes it visible on the Discover page
              </p>
            </section>
          )}
        </div>

        {/* Skip button */}
        <div className="text-center">
          <button
            onClick={() => router.push('/leads')}
            className="text-sm text-ink-text-muted hover:text-white transition-colors"
          >
            Skip for now, set up later
          </button>
        </div>
      </div>
    </div>
  )
}
