import { ref, get, set, update } from 'firebase/database'
import { db } from './firebaseClient'
import type { SubscriptionTier, SubscriptionStatus } from '@/types'
import { getSubscriptionFeatures, SUBSCRIPTION_TIERS } from './subscriptionConfig'

export interface SubscriptionData {
  tier: SubscriptionTier
  status: SubscriptionStatus
  startDate: number
  endDate?: number
  stripeCustomerId?: string
  stripeSubscriptionId?: string
}

/**
 * Get user's current subscription
 */
export async function getUserSubscription(uid: string): Promise<SubscriptionData> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const snapshot = await get(profileRef)
  
  if (!snapshot.exists()) {
    return {
      tier: 'free',
      status: 'active',
      startDate: Date.now(),
    }
  }
  
  const profile = snapshot.val()
  return {
    tier: profile.subscriptionTier || 'free',
    status: profile.subscriptionStatus || 'active',
    startDate: profile.subscriptionStartDate || Date.now(),
    endDate: profile.subscriptionEndDate,
    stripeCustomerId: profile.stripeCustomerId,
    stripeSubscriptionId: profile.stripeSubscriptionId,
  }
}

/**
 * Update user's subscription
 */
export async function updateSubscription(
  uid: string,
  data: Partial<SubscriptionData>
): Promise<void> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const updates: any = {}
  
  if (data.tier !== undefined) updates.subscriptionTier = data.tier
  if (data.status !== undefined) updates.subscriptionStatus = data.status
  if (data.startDate !== undefined) updates.subscriptionStartDate = data.startDate
  if (data.endDate !== undefined) updates.subscriptionEndDate = data.endDate
  if (data.stripeCustomerId !== undefined) updates.stripeCustomerId = data.stripeCustomerId
  if (data.stripeSubscriptionId !== undefined) updates.stripeSubscriptionId = data.stripeSubscriptionId
  
  await update(profileRef, updates)
}

/**
 * Check if user can perform an action based on subscription tier
 */
export async function canUserPerformAction(
  uid: string,
  action: 'uploadPortfolio' | 'createLead' | 'useAIDesign' | 'viewAnalytics' | 'acceptDeposit'
): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: SubscriptionTier }> {
  const subscription = await getUserSubscription(uid)
  const features = getSubscriptionFeatures(subscription.tier)
  
  // Get current counts from profile
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const snapshot = await get(profileRef)
  const profile = snapshot.val() || {}
  
  switch (action) {
    case 'uploadPortfolio': {
      const currentCount = (profile.portfolioImages || []).length
      if (features.maxPortfolioImages === -1) return { allowed: true }
      if (currentCount >= features.maxPortfolioImages) {
        return {
          allowed: false,
          reason: `You've reached the limit of ${features.maxPortfolioImages} portfolio images`,
          upgradeRequired: subscription.tier === 'free' ? 'pro' : 'premium',
        }
      }
      return { allowed: true }
    }
    
    case 'useAIDesign': {
      const creditsUsed = profile.aiCreditsUsed || 0
      const resetDate = profile.aiCreditsResetDate || 0
      
      // Reset credits if it's a new month
      const now = Date.now()
      const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
      if (resetDate < oneMonthAgo) {
        // Credits should be reset - allow action
        return { allowed: true }
      }
      
      if (features.aiDesignCredits === -1) return { allowed: true }
      if (creditsUsed >= features.aiDesignCredits) {
        return {
          allowed: false,
          reason: `You've used all ${features.aiDesignCredits} AI credits this month`,
          upgradeRequired: subscription.tier === 'free' ? 'pro' : 'premium',
        }
      }
      return { allowed: true }
    }
    
    case 'viewAnalytics':
      if (!features.analytics) {
        return {
          allowed: false,
          reason: 'Analytics are only available on Pro and Premium plans',
          upgradeRequired: 'pro',
        }
      }
      return { allowed: true }
    
    case 'acceptDeposit':
      if (!features.canAcceptDeposits) {
        return {
          allowed: false,
          reason: 'Accepting deposits is only available on Pro and Premium plans',
          upgradeRequired: 'pro',
        }
      }
      return { allowed: true }
    
    default:
      return { allowed: true }
  }
}

/**
 * Increment AI credits used
 */
export async function incrementAICreditsUsed(uid: string): Promise<void> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const snapshot = await get(profileRef)
  const profile = snapshot.val() || {}
  
  const now = Date.now()
  const resetDate = profile.aiCreditsResetDate || 0
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000
  
  // Reset credits if it's a new month
  if (resetDate < oneMonthAgo) {
    await update(profileRef, {
      aiCreditsUsed: 1,
      aiCreditsResetDate: now,
    })
  } else {
    await update(profileRef, {
      aiCreditsUsed: (profile.aiCreditsUsed || 0) + 1,
    })
  }
}

/**
 * Get subscription config for display
 */
export function getSubscriptionConfig() {
  return SUBSCRIPTION_TIERS
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(subscription: SubscriptionData): boolean {
  if (subscription.tier === 'free') return true
  if (subscription.status === 'cancelled' || subscription.status === 'past_due') return false
  if (subscription.endDate && subscription.endDate < Date.now()) return false
  return true
}
