'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { CheckIcon, SparklesIcon, StarIcon, RocketLaunchIcon, ArrowLeftIcon } from '@heroicons/react/24/solid'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/subscriptionConfig'
import { useLocale } from '@/hooks/useLocale'

export default function PlanSelectionPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free')
  const [isProcessing, setIsProcessing] = useState(false)

  const { t } = useLocale()
  const tiers = Object.values(SUBSCRIPTION_TIERS)

  const handleContinue = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('selectedPlan', selectedTier)
      sessionStorage.setItem('selectedBilling', billingCycle)
    }

    if (user && selectedTier !== 'free') {
      setIsProcessing(true)
      try {
        const idToken = await user.getIdToken()
        const res = await fetch('/api/subscriptions/create-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ tier: selectedTier, billing: billingCycle }),
        })

        const data = await res.json()
        if (data?.url) {
          window.location.href = data.url
          return
        }
      } catch (err) {
        console.error('Error creating checkout session', err)
      } finally {
        setIsProcessing(false)
      }
    }

    router.push('/signup/complete?role=artist')
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-text-muted transition hover:text-white mb-8"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          {t('back')}
        </button>

        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{t('pricing')}</h1>
          <p className="text-xl text-ink-text-muted mb-8">{t('discover_description')}</p>

          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all relative ${billingCycle === 'yearly' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
            >
              {t('yearly')}
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">{t('save_17')}</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {tiers.map((tier) => {
            const price = billingCycle === 'monthly' ? tier.price : tier.yearlyPrice / 12
            const isSelected = selectedTier === tier.id
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative text-left rounded-3xl border-2 transition-all duration-300 ${isSelected ? (tier.popular ? 'border-purple-500 shadow-glow-lg scale-[1.02]' : 'border-ink-accent shadow-glow scale-[1.02]') : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'}`}
              >
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className={`px-4 py-1 rounded-full text-xs font-bold text-white shadow-lg ${tier.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}>{tier.badge}</div>
                  </div>
                )}

                <div className={`absolute inset-0 rounded-3xl ${tier.popular ? 'bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent' : tier.id === 'premium' ? 'bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent' : 'bg-white/[0.02]'} opacity-60`} />

                <div className="relative p-8 space-y-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${tier.id === 'free' ? 'bg-gradient-to-br from-gray-500 to-gray-600' : tier.id === 'pro' ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-cyan-500 to-blue-500'} shadow-glow`}>
                    {tier.id === 'free' && <SparklesIcon className="w-8 h-8 text-white" />}
                    {tier.id === 'pro' && <StarIcon className="w-8 h-8 text-white" />}
                    {tier.id === 'premium' && <RocketLaunchIcon className="w-8 h-8 text-white" />}
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                    <p className="text-sm text-ink-text-muted">{tier.description}</p>
                  </div>

                  <div className="py-4 border-y border-white/10">
                    {tier.price === 0 ? (
                      <div className="text-4xl font-bold text-white">{t('free')}</div>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-white">${Math.round(price)}</span>
                          <span className="text-ink-text-muted">/month</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <div className="text-sm text-green-400 mt-1">${tier.yearlyPrice}/year • Save ${(tier.price * 12 - tier.yearlyPrice).toFixed(0)}</div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {tier.displayFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckIcon className={`w-5 h-5 shrink-0 mt-0.5 ${tier.popular ? 'text-purple-400' : 'text-cyan-400'}`} />
                        <span className="text-ink-text-muted">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && (
                    <div className="pt-4">
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold text-center ${tier.popular ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'}`}>
                        ✓ Selected
                      </div>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="text-center space-y-4">
          <button onClick={handleContinue} className="btn btn-primary px-12 py-4 text-lg" disabled={isProcessing}>
            Continue with {SUBSCRIPTION_TIERS[selectedTier].name} Plan →
          </button>
          <p className="text-sm text-ink-text-muted">You can change your plan anytime after signup</p>
        </div>

        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-ink-text-muted">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-green-400" />
              <span>{t('no_credit_card_required')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-green-400" />
              <span>{t('cancel_anytime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-green-400" />
              <span>{t('free_trial_available')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
