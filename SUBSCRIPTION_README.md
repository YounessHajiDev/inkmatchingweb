# InkMatching Subscription System

## Overview
Intelligent Hybrid Monetization Model combining Freemium + Transaction Fees + Subscriptions.

## Tiers

### 🆓 Free Tier
- **Price**: $0/month
- **Booking Fee**: 3%
- **Features**:
  - Basic profile
  - Up to 5 portfolio images
  - Receive up to 10 leads/month
  - Community support

### ⭐ Pro Tier (MOST POPULAR)
- **Price**: $39/month or $390/year (save $78)
- **Booking Fee**: 0%
- **Features**:
  - ✨ Featured Artist badge
  - Priority in search results
  - Up to 20 portfolio images
  - Unlimited leads
  - Accept deposits
  - Advanced analytics
  - 10 AI design credits/month
  - Automated reminders
  - Custom booking URL
  - Remove branding
  - Email support

### 🚀 Premium Tier
- **Price**: $79/month or $790/year (save $158)
- **Booking Fee**: 0%
- **Features**:
  - Everything in Pro
  - Unlimited portfolio images
  - Unlimited AI design credits
  - Homepage featured spotlight
  - Client CRM tools
  - Multi-artist studio support
  - API access
  - Priority support (24h response)

## Implementation Status

### ✅ Completed
- [x] Subscription configuration (`lib/subscriptionConfig.ts`)
- [x] Subscription types in TypeScript (`types/index.ts`)
- [x] Subscription management library (`lib/subscriptions.ts`)
- [x] Pricing page UI (`app/pricing/page.tsx`)
- [x] Settings page subscription section
- [x] Portfolio upload limits based on tier
- [x] Dynamic limit messaging

### 🚧 To Do (Stripe Integration)
- [ ] Set up Stripe account
- [ ] Add Stripe SDK (`npm install stripe @stripe/stripe-js`)
- [ ] Create Stripe products and prices
- [ ] Implement checkout session creation
- [ ] Set up webhook handlers
- [ ] Handle subscription lifecycle events
- [ ] Test payment flow

## Files Created/Modified

### New Files
- `lib/subscriptionConfig.ts` - Tier definitions and feature configs
- `lib/subscriptions.ts` - Subscription management functions
- `app/pricing/page.tsx` - Public pricing page
- `app/api/subscriptions/create-checkout/route.ts` - Checkout API (placeholder)
- `SUBSCRIPTION_README.md` - This file

### Modified Files
- `types/index.ts` - Added subscription types
- `app/settings/page.tsx` - Added subscription UI and limits

## Usage Examples

### Check if user can upload portfolio image
\`\`\`typescript
import { canUserPerformAction } from '@/lib/subscriptions'

const result = await canUserPerformAction(userId, 'uploadPortfolio')
if (!result.allowed) {
  console.log(result.reason) // "You've reached the limit of 5 portfolio images"
  console.log(result.upgradeRequired) // "pro"
}
\`\`\`

### Get user's subscription
\`\`\`typescript
import { getUserSubscription } from '@/lib/subscriptions'

const subscription = await getUserSubscription(userId)
console.log(subscription.tier) // 'free', 'pro', or 'premium'
console.log(subscription.status) // 'active', 'cancelled', etc.
\`\`\`

### Calculate booking fee
\`\`\`typescript
import { calculateBookingFee } from '@/lib/subscriptionConfig'

const fee = calculateBookingFee('free', 300) // $9.00 (3%)
const fee2 = calculateBookingFee('pro', 300) // $0.00 (0%)
\`\`\`

## Stripe Integration Guide

### 1. Install Stripe
\`\`\`bash
npm install stripe @stripe/stripe-js
\`\`\`

### 2. Add Environment Variables
\`\`\`
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
\`\`\`

### 3. Create Products in Stripe Dashboard
- Create "Pro Monthly" product
- Create "Pro Yearly" product
- Create "Premium Monthly" product
- Create "Premium Yearly" product

### 4. Implement Checkout
See `app/api/subscriptions/create-checkout/route.ts` for placeholder.

### 5. Handle Webhooks
Implement webhook handler to update Firebase when:
- Subscription created
- Subscription updated
- Payment succeeded
- Payment failed
- Subscription cancelled

## Revenue Projections

### Year 1 (100 active artists, 1000 clients)
- Booking fees (3% avg): ~$5,000/mo
- Pro subscriptions (20% convert): $780/mo
- **Total: ~$5,780 MRR** (~$69K ARR)

### Year 2 (500 artists, 10K clients)
- Booking fees: ~$37,500/mo
- Subscriptions (25% Pro, 5% Premium): $8,825/mo
- **Total: ~$46K MRR** (~$552K ARR)

## Testing

Test the pricing page:
\`\`\`
http://localhost:3000/pricing
\`\`\`

Test settings subscription section:
\`\`\`
http://localhost:3000/settings
\`\`\`

## Next Steps

1. **Set up Stripe account** and get API keys
2. **Create products** in Stripe dashboard
3. **Implement checkout** flow with real Stripe integration
4. **Test payment** flow in Stripe test mode
5. **Set up webhooks** to handle subscription events
6. **Add billing portal** link in settings for users to manage subscriptions
7. **Implement analytics** dashboard for Pro/Premium users
8. **Add lead credit** system ($3 per priority lead)
9. **Build AI design studio** with credit tracking
10. **Launch** and monitor conversion rates

## Support

For questions or issues, contact the development team.
