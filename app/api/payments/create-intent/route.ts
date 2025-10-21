"use server"

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import type { Booking } from '@/types'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

type BodyPayload = {
  bookingId: string
  artistUid: string
  currency?: string
}

function toCents(amount: number): number {
  return Math.round(amount * 100)
}

function mapStripeStatus(status: Stripe.PaymentIntent.Status): Booking['paymentStatus'] {
  switch (status) {
    case 'succeeded':
      return 'succeeded'
    case 'requires_action':
    case 'requires_payment_method':
    case 'processing':
      return 'requires_action'
    case 'canceled':
      return 'cancelled'
    default:
      return 'pending'
  }
}

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })

  let decodedUid: string | null = null
  const bearer = req.headers.get('authorization')
  if (!bearer?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }
  try {
    const token = bearer.slice(7)
    const decoded = await adminAuth.verifyIdToken(token)
    decodedUid = decoded.uid
  } catch (error) {
    console.error('Payment intent token verification failed', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = (await req.json()) as BodyPayload
  if (!body.bookingId || !body.artistUid) {
    return NextResponse.json({ error: 'Missing booking details' }, { status: 400 })
  }

  const bookingSnap = await adminDb.ref(`bookingsByClient/${decodedUid}/${body.bookingId}`).get()
  if (!bookingSnap.exists()) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }
  const booking = bookingSnap.val() as Booking
  if (booking.artistUid !== body.artistUid) {
    return NextResponse.json({ error: 'Booking validation failed' }, { status: 403 })
  }
  if (!booking.depositAmount || booking.depositAmount <= 0) {
    return NextResponse.json({ error: 'No deposit required for this booking' }, { status: 400 })
  }
  if (booking.paymentStatus === 'succeeded') {
    return NextResponse.json({ error: 'This deposit is already paid' }, { status: 409 })
  }

  const currency = body.currency || 'usd'
  const amountInCents = toCents(booking.depositAmount)

  const intent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    metadata: {
      bookingId: booking.id,
      artistUid: booking.artistUid,
      clientUid: booking.clientUid,
    },
    automatic_payment_methods: { enabled: true },
  })

  const paymentStatus = mapStripeStatus(intent.status)
  const updates: Record<string, Partial<Booking>> = {
    [`bookingsByClient/${booking.clientUid}/${booking.id}`]: {
      paymentIntentId: intent.id,
      paymentClientSecret: intent.client_secret ?? undefined,
      paymentStatus,
      updatedAt: Date.now(),
    },
    [`bookingsByArtist/${booking.artistUid}/${booking.id}`]: {
      paymentIntentId: intent.id,
      paymentClientSecret: intent.client_secret ?? undefined,
      paymentStatus,
      updatedAt: Date.now(),
    },
  }
  await adminDb.ref().update(updates)

  return NextResponse.json({
    clientSecret: intent.client_secret,
    status: paymentStatus,
  })
}
