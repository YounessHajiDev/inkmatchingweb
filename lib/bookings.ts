import { ref, push, get, update } from 'firebase/database'
import { db } from '@/lib/firebaseClient'
import type { Booking, BookingStatus, PaymentStatus } from '@/types'

type BookingRequestInput = {
  scheduledFor?: string
  scheduledTime?: string
  note?: string
  style?: string
  budget?: number
  depositAmount?: number
}

function decorateBooking(
  booking: Booking,
): Booking {
  return {
    ...booking,
    paymentStatus: booking.paymentStatus ?? 'not_required',
  }
}

export async function requestBooking(
  artistUid: string,
  clientUid: string,
  input: BookingRequestInput,
): Promise<Booking> {
  const bookingRef = push(ref(db, `bookingsByArtist/${artistUid}`))
  if (!bookingRef.key) throw new Error('Unable to create booking request.')
  const bookingId = bookingRef.key
  const now = Date.now()
  const paymentStatus: PaymentStatus = input.depositAmount && input.depositAmount > 0 ? 'pending' : 'not_required'
  const booking: Booking = {
    id: bookingId,
    artistUid,
    clientUid,
    requestedAt: now,
    updatedAt: now,
    status: 'pending',
    scheduledFor: input.scheduledFor,
    scheduledTime: input.scheduledTime,
    note: input.note,
    style: input.style,
    budget: input.budget,
    depositAmount: input.depositAmount,
    paymentStatus,
  }

  const updates: Record<string, Booking> = {
    [`bookingsByArtist/${artistUid}/${bookingId}`]: booking,
    [`bookingsByClient/${clientUid}/${bookingId}`]: booking,
  }
  await update(ref(db), updates)
  return booking
}

export async function listBookingsForArtist(artistUid: string): Promise<Booking[]> {
  const snapshot = await get(ref(db, `bookingsByArtist/${artistUid}`))
  if (!snapshot.exists()) return []
  const data = snapshot.val() as Record<string, Booking>
  return Object.values(data)
    .map((booking) => decorateBooking(booking))
    .sort((a, b) => b.requestedAt - a.requestedAt)
}

export async function listBookingsForClient(clientUid: string): Promise<Booking[]> {
  const snapshot = await get(ref(db, `bookingsByClient/${clientUid}`))
  if (!snapshot.exists()) return []
  const data = snapshot.val() as Record<string, Booking>
  return Object.values(data)
    .map((booking) => decorateBooking(booking))
    .sort((a, b) => b.requestedAt - a.requestedAt)
}

export async function updateBooking(
  booking: Booking,
  changes: Partial<Booking> & { status?: BookingStatus }
): Promise<Booking> {
  const updatedAt = Date.now()
  const next: Booking = decorateBooking({
    ...booking,
    ...changes,
    updatedAt,
  })

  const updates: Record<string, Booking> = {
    [`bookingsByArtist/${booking.artistUid}/${booking.id}`]: next,
    [`bookingsByClient/${booking.clientUid}/${booking.id}`]: next,
  }
  await update(ref(db), updates)
  return next
}

export async function recordPaymentIntent(
  booking: Booking,
  payload: { paymentIntentId: string; clientSecret: string; paymentStatus: PaymentStatus }
): Promise<Booking> {
  return updateBooking(booking, {
    paymentIntentId: payload.paymentIntentId,
    paymentClientSecret: payload.clientSecret,
    paymentStatus: payload.paymentStatus,
  })
}
