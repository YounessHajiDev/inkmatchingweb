import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

export async function GET(request: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

  const searchParams = request.nextUrl.searchParams
  const tier = searchParams.get('tier') || 'pro'
  const billing = searchParams.get('billing') === 'yearly' ? 'yearly' : 'monthly'
  const successUrl = new URL(`/signup/complete?checkout_success=1&tier=${tier}`, request.url).toString()
  const cancelUrl = new URL(`/signup/complete?checkout_cancel=1`, request.url).toString()

  // Map tier -> price id from env
  const priceEnvKey = `STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()}`
  // @ts-ignore
  const priceId = process.env[priceEnvKey]
  if (!priceId) {
    return NextResponse.json({ error: `Missing price id for ${tier} ${billing}. Set ${priceEnvKey} in env.` }, { status: 500 })
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    payment_method_options: undefined,
    automatic_tax: { enabled: false },
  })

  return NextResponse.json({ url: session.url, id: session.id })
}

export async function POST(request: NextRequest) {
  // For future webhook handling
  return NextResponse.json({ received: true })
}
