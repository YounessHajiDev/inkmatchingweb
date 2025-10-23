import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

async function getPriceIdFor(tier: string, billing: string) {
  const priceEnvKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()}`
  // @ts-ignore
  return process.env[priceEnvKey]
}

export async function POST(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  // Verify Firebase ID token in Authorization header
  const bearer = request.headers.get('authorization')
  if (!bearer?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  let decodedUid: string
  try {
    const token = bearer.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    decodedUid = decoded.uid
  } catch (err) {
    console.error('Invalid auth token', err)
    return NextResponse.json({ error: 'Invalid authorization token' }, { status: 401 })
  }

  const body = await request.json()
  const tier = body?.tier || 'pro'
  const billing = body?.billing === 'yearly' ? 'yearly' : 'monthly'

  const priceId = await getPriceIdFor(tier, billing)
  if (!priceId) return NextResponse.json({ error: `Missing price id for ${tier} ${billing}` }, { status: 500 })

  try {
    // Try to reuse existing stripe customer saved in publicProfiles
    const profileSnap = await adminDb.ref(`publicProfiles/${decodedUid}`).get()
    const profile = profileSnap.exists() ? profileSnap.val() as any : {}
    let customerId = profile?.stripeCustomerId

    if (!customerId) {
      // Create a new Stripe customer and store it
      const customer = await stripe.customers.create({
        metadata: { uid: decodedUid, tier },
        email: profile?.email || undefined,
      })
      customerId = customer.id
      await adminDb.ref(`publicProfiles/${decodedUid}`).update({ stripeCustomerId: customerId })
    }

    const successUrl = new URL(`/signup/complete?checkout_success=1&tier=${tier}&session_id={CHECKOUT_SESSION_ID}`, request.url).toString()
    const cancelUrl = new URL(`/signup/complete?checkout_cancel=1`, request.url).toString()

    const params = {
      mode: 'subscription',
      customer: customerId,
      payment_method_types: ['card'],
      automatic_payment_methods: { enabled: true },
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { uid: decodedUid, tier },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    }
    const session = await stripe.checkout.sessions.create(params as any)

    return NextResponse.json({ url: session.url, id: session.id })
  } catch (e) {
    console.error('Failed creating checkout session', e)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'Use POST to create a checkout session' })
}
