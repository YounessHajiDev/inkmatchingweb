'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { CheckIcon, SparklesIcon, StarIcon, RocketLaunchIcon } from '@heroicons/react/24/solid'
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '@/lib/subscriptionConfig'
import { getUserSubscription, type SubscriptionData } from '@/lib/subscriptions'

export default function PricingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    
    getUserSubscription(user.uid).then((sub) => {
      setCurrentSubscription(sub)
      setLoading(false)
    })
  }, [user])

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    if (!user) {
      router.push('/login?redirect=/pricing')
      return
    }

    if (tier === 'free') {
      // Downgrade or stay on free
      router.push('/settings')
      return
    }

    // For paid tiers, redirect to Stripe checkout
    router.push(`/api/subscriptions/create-checkout?tier=${tier}&billing=${billingCycle}`)
  }

  const tiers = Object.values(SUBSCRIPTION_TIERS)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-16 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Start free, upgrade when you&#39;re ready to grow
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full p-2">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all relative ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                SAVE 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const price = billingCycle === 'monthly' ? tier.price : Math.round(tier.yearlyPrice / 12)
            const isCurrentPlan = currentSubscription?.tier === tier.id
            const isPaidPlan = tier.price > 0

            return (
              <div
                key={tier.id}
                className={`relative rounded-3xl p-8 backdrop-blur-xl transition-all hover:scale-105 ${
                  tier.popular
                    ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500 shadow-2xl shadow-purple-500/30'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    {tier.badge}
                  </div>
                )}

                {/* Icon */}
                <div className="mb-6 inline-block p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  {tier.id === 'free' && <SparklesIcon className="w-8 h-8 text-purple-400" />}
                  {tier.id === 'pro' && <StarIcon className="w-8 h-8 text-yellow-400" />}
                  {tier.id === 'premium' && <RocketLaunchIcon className="w-8 h-8 text-pink-400" />}
                </div>

                {/* Tier Name */}
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                {/* Price */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white">${price}</span>
                    {isPaidPlan && (
                      <span className="text-gray-400 text-sm">/month</span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && isPaidPlan && (
                    <p className="text-sm text-green-400 mt-1">
                      Billed ${tier.yearlyPrice}/year
                    </p>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(tier.id)}
                  disabled={isCurrentPlan}
                  className={`w-full py-3 px-6 rounded-xl font-semibold transition-all mb-8 ${
                    isCurrentPlan
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : tier.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/50'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : tier.id === 'free' ? 'Get Started' : 'Upgrade Now'}
                </button>

                {/* Features List */}
                <ul className="space-y-3">
                  {tier.displayFeatures.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm">
                      <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-20 text-center max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6 text-left">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What&#39;s the booking fee?
              </h3>
              <p className="text-gray-400">
                Free tier has a 3% booking fee. Pro and Premium plans have 0% booking fees - your subscription covers it!
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-400">
                Yes! Cancel anytime from your settings. You&#39;ll retain access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                What happens if I downgrade?
              </h3>
              <p className="text-gray-400">
                You&#39;ll keep your content, but some features will be limited. For example, extra portfolio images will be hidden (not deleted).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
