export type SubscriptionTier = 'free' | 'pro' | 'premium'
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'

export interface SubscriptionFeatures {
  // Lead Management
  maxActiveLeads: number // -1 = unlimited
  priorityLeads: boolean
  
  // Portfolio & Profile
  maxPortfolioImages: number
  featuredBadge: boolean
  priorityInSearch: boolean
  customBookingURL: boolean
  removeBranding: boolean
  
  // Booking & Fees
  bookingFeeRate: number // 0.03 = 3%
  canAcceptDeposits: boolean
  
  // Tools & Analytics
  analytics: boolean
  aiDesignCredits: number // per month, -1 = unlimited
  clientCRM: boolean
  automatedReminders: boolean
  
  // Support
  supportLevel: 'community' | 'email' | 'priority'
}

export interface SubscriptionTierConfig {
  id: SubscriptionTier
  name: string
  price: number // monthly price in dollars
  yearlyPrice: number // yearly price (discounted)
  description: string
  badge?: string
  popular?: boolean
  features: SubscriptionFeatures
  displayFeatures: string[]
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionTierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    yearlyPrice: 0,
    description: 'Perfect for getting started',
    features: {
      maxActiveLeads: 10,
      priorityLeads: false,
      maxPortfolioImages: 5,
      featuredBadge: false,
      priorityInSearch: false,
      customBookingURL: false,
      removeBranding: false,
      bookingFeeRate: 0.03, // 3% fee
      canAcceptDeposits: false,
      analytics: false,
      aiDesignCredits: 0,
      clientCRM: false,
      automatedReminders: false,
      supportLevel: 'community',
    },
    displayFeatures: [
      'Basic profile',
      'Up to 5 portfolio images',
      'Receive up to 10 leads/month',
      '3% booking fee',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    yearlyPrice: 390, // ~$32.50/mo - 2 months free
    description: 'Best for growing artists',
    badge: 'MOST POPULAR',
    popular: true,
    features: {
      maxActiveLeads: -1, // unlimited
      priorityLeads: true,
      maxPortfolioImages: 20,
      featuredBadge: true,
      priorityInSearch: true,
      customBookingURL: true,
      removeBranding: true,
      bookingFeeRate: 0.00, // 0% fee (subscription covers it)
      canAcceptDeposits: true,
      analytics: true,
      aiDesignCredits: 10,
      clientCRM: false,
      automatedReminders: true,
      supportLevel: 'email',
    },
    displayFeatures: [
      '✨ Featured Artist badge',
      'Priority in search results',
      'Up to 20 portfolio images',
      'Unlimited leads',
      '0% booking fee',
      'Accept deposits',
      'Advanced analytics',
      '10 AI design credits/month',
      'Automated reminders',
      'Custom booking URL',
      'Remove InkMatching branding',
      'Email support',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    price: 79,
    yearlyPrice: 790, // ~$65.83/mo - 2 months free
    description: 'For established studios',
    badge: 'BEST VALUE',
    features: {
      maxActiveLeads: -1,
      priorityLeads: true,
      maxPortfolioImages: -1, // unlimited
      featuredBadge: true,
      priorityInSearch: true,
      customBookingURL: true,
      removeBranding: true,
      bookingFeeRate: 0.00, // 0% fee
      canAcceptDeposits: true,
      analytics: true,
      aiDesignCredits: -1, // unlimited
      clientCRM: true,
      automatedReminders: true,
      supportLevel: 'priority',
    },
    displayFeatures: [
      '🌟 Everything in Pro, plus:',
      'Unlimited portfolio images',
      'Unlimited AI design credits',
      'Homepage featured spotlight',
      'Client CRM & management tools',
      'Multi-artist studio support',
      'API access',
      'Priority support (24h response)',
      'White-label options',
    ],
  },
}

export function getSubscriptionFeatures(tier: SubscriptionTier): SubscriptionFeatures {
  return SUBSCRIPTION_TIERS[tier].features
}

export function canPerformAction(
  tier: SubscriptionTier,
  action: keyof SubscriptionFeatures
): boolean {
  const features = getSubscriptionFeatures(tier)
  const value = features[action]
  
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  
  return false
}

export function getBookingFeeRate(tier: SubscriptionTier): number {
  return getSubscriptionFeatures(tier).bookingFeeRate
}

export function calculateBookingFee(tier: SubscriptionTier, bookingAmount: number): number {
  const rate = getBookingFeeRate(tier)
  return Math.round(bookingAmount * rate * 100) / 100 // round to 2 decimals
}

export function hasReachedLimit(
  tier: SubscriptionTier,
  limitKey: 'maxActiveLeads' | 'maxPortfolioImages' | 'aiDesignCredits',
  currentCount: number
): boolean {
  const features = getSubscriptionFeatures(tier)
  const limit = features[limitKey] as number
  
  if (limit === -1) return false // unlimited
  return currentCount >= limit
}
