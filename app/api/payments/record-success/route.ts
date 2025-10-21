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
  paymentIntentId: string
}

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })

  const bearer = req.headers.get('authorization')
  if (!bearer?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
  }

  let decodedUid: string
  try {
    const decoded = await adminAuth.verifyIdToken(bearer.slice(7))
    decodedUid = decoded.uid
  } catch (error) {
    console.error('Payment success token verification failed', error)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const body = (await req.json()) as BodyPayload
  if (!body.bookingId || !body.artistUid || !body.paymentIntentId) {
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
  if (booking.paymentIntentId !== body.paymentIntentId) {
    return NextResponse.json({ error: 'Payment intent does not match this booking' }, { status: 409 })
  }

  const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId)
  if (intent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Payment has not succeeded yet' }, { status: 409 })
  }

  const updates: Record<string, Partial<Booking>> = {
    [`bookingsByClient/${booking.clientUid}/${booking.id}`]: {
      paymentStatus: 'succeeded',
      updatedAt: Date.now(),
    },
    [`bookingsByArtist/${booking.artistUid}/${booking.id}`]: {
      paymentStatus: 'succeeded',
      updatedAt: Date.now(),
    },
  }
  await adminDb.ref().update(updates)

  return NextResponse.json({ status: 'succeeded' })
}
