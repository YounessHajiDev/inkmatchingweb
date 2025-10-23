import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminDb } from '@/lib/firebaseAdmin'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

export async function GET(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('session_id') || url.searchParams.get('checkout_session_id') || null
  if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 })

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] })
    // The session may include subscription and customer
    const subscription = (session.subscription as any) || null
    const customer = session.customer as string | null

    // We expect the subscription to contain metadata.uid (if you set it when creating customer)
    const metadataUid = subscription?.metadata?.uid || session?.metadata?.uid || null

    if (metadataUid) {
      const updates: any = {}
      if (customer) updates.stripeCustomerId = customer
      if (subscription) {
        updates.stripeSubscriptionId = subscription.id
        updates.subscriptionStatus = subscription.status || 'active'
        updates.subscriptionStartDate = subscription.current_period_start ? Number(subscription.current_period_start) * 1000 : undefined
        updates.subscriptionEndDate = subscription.current_period_end ? Number(subscription.current_period_end) * 1000 : undefined
        updates.subscriptionTier = subscription?.metadata?.tier || undefined
      }
      await adminDb.ref(`publicProfiles/${metadataUid}`).update(updates)
    }

    return NextResponse.json({ ok: true, session })
  } catch (e) {
    console.error('Failed to retrieve stripe session', e)
    return NextResponse.json({ error: 'Failed to retrieve session' }, { status: 500 })
  }
}
