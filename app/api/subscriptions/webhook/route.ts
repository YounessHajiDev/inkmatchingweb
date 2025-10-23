import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminDb } from '@/lib/firebaseAdmin'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
  if (!webhookSecret) return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 500 })

  const buf = await req.arrayBuffer()
  const sig = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as any
        // We expect that metadata contains the user uid (set by server when creating customer)
        const uid = subscription?.metadata?.uid
        if (uid) {
          const start = subscription.current_period_start ? Number(subscription.current_period_start) * 1000 : Date.now()
          const end = subscription.current_period_end ? Number(subscription.current_period_end) * 1000 : undefined
          await adminDb.ref(`publicProfiles/${uid}`).update({
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionStartDate: start,
            subscriptionEndDate: end,
            subscriptionTier: subscription?.metadata?.tier || undefined,
          })
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription || undefined
        const customerId = invoice.customer || undefined
        // Try to find profile by stripeCustomerId or by subscription metadata
        if (subscriptionId) {
          // Nothing deterministic here - webhook for subscription payments mostly indicates success; we can update status
          // Attempt to find publicProfile with this subscriptionId
          const snap = await adminDb.ref('publicProfiles').orderByChild('stripeSubscriptionId').equalTo(subscriptionId).limitToFirst(1).once('value')
          if (snap.exists()) {
            const entries = snap.val()
            const uid = Object.keys(entries)[0]
            await adminDb.ref(`publicProfiles/${uid}`).update({ subscriptionStatus: 'active' })
          }
        }
        // Optionally update by customerId
        if (customerId) {
          const snapC = await adminDb.ref('publicProfiles').orderByChild('stripeCustomerId').equalTo(customerId).limitToFirst(1).once('value')
          if (snapC.exists()) {
            const entries = snapC.val()
            const uid = Object.keys(entries)[0]
            await adminDb.ref(`publicProfiles/${uid}`).update({ subscriptionStatus: 'active' })
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any
        const subscriptionId = invoice.subscription || undefined
        if (subscriptionId) {
          const snap = await adminDb.ref('publicProfiles').orderByChild('stripeSubscriptionId').equalTo(subscriptionId).limitToFirst(1).once('value')
          if (snap.exists()) {
            const uid = Object.keys(snap.val())[0]
            await adminDb.ref(`publicProfiles/${uid}`).update({ subscriptionStatus: 'past_due' })
          }
        }
        break
      }

      default:
        // ignore other events
        break
    }
  } catch (e) {
    console.error('Failed to process webhook event', e)
    return NextResponse.json({ error: 'Webhook handler error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
