'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { User } from 'firebase/auth'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile } from '@/lib/publicProfiles'
import {
  listBookingsForArtist,
  listBookingsForClient,
  updateBooking,
} from '@/lib/bookings'
import type { Booking, UserRole } from '@/types'

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

type PaymentState = {
  booking: Booking | null
  clientSecret: string | null
  loading: boolean
  error: string | null
}

function formatDate(date?: string, time?: string) {
  if (!date) return 'To be scheduled'
  const d = new Date(`${date}${time ? `T${time}` : ''}`)
  if (Number.isNaN(d.getTime())) return `${date}${time ? ` • ${time}` : ''}`
  return d.toLocaleString([], { dateStyle: 'medium', timeStyle: time ? 'short' : undefined })
}

function BookingCard({
  booking,
  role,
  onStatusChange,
  onCollectDeposit,
  busy,
}: {
  booking: Booking
  role: UserRole
  onStatusChange: (booking: Booking, status: Booking['status']) => Promise<void>
  onCollectDeposit: (booking: Booking) => Promise<void>
  busy: boolean
}) {
  const statusLabel: Record<Booking['status'], string> = {
    pending: 'Pending response',
    accepted: 'Accepted',
    declined: 'Declined',
    cancelled: 'Cancelled',
    completed: 'Completed',
  }
  const paymentLabel: Record<Booking['paymentStatus'], string> = {
    not_required: 'No deposit required',
    pending: 'Deposit pending',
    requires_action: 'Deposit needs action',
    succeeded: 'Deposit paid',
    cancelled: 'Deposit cancelled',
  }

  const canAccept = role === 'artist' && booking.status === 'pending'
  const canDecline = role === 'artist' && (booking.status === 'pending' || booking.status === 'accepted')
  const canComplete = role === 'artist' && booking.status === 'accepted'
  const canCancel = role === 'client' && (booking.status === 'pending' || booking.status === 'accepted')
  const canPayDeposit = role === 'client' && !!booking.depositAmount && booking.paymentStatus !== 'succeeded'

  return (
    <div className="card border border-ink-muted/60 bg-ink-surface/70 p-6 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {role === 'artist' ? `Client: ${booking.clientUid}` : `Artist: ${booking.artistUid}`}
          </h3>
          <p className="text-sm text-gray-400">
            Requested {new Date(booking.requestedAt).toLocaleString()}
          </p>
          <p className="text-sm text-gray-300">
            {formatDate(booking.scheduledFor, booking.scheduledTime)}
          </p>
          {booking.style && (
            <p className="text-sm text-gray-300">
              Style / Placement: {booking.style}
            </p>
          )}
          {booking.note && (
            <p className="text-sm text-gray-400">
              Notes: {booking.note}
            </p>
          )}
          {typeof booking.budget === 'number' && (
            <p className="text-sm text-gray-300">
              Budget: ${booking.budget.toFixed(2)}
            </p>
          )}
        </div>
        <div className="text-right space-y-2">
          <span className="inline-flex rounded-full border border-ink-muted/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
            {statusLabel[booking.status]}
          </span>
          {booking.depositAmount && (
            <p className="text-sm text-gray-400">Deposit: ${booking.depositAmount.toFixed(2)}</p>
          )}
          <p className="text-xs text-gray-500">{paymentLabel[booking.paymentStatus]}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {canAccept && <button disabled={busy} onClick={() => onStatusChange(booking, 'accepted')} className="btn btn-primary">Accept</button>}
        {canDecline && <button disabled={busy} onClick={() => onStatusChange(booking, 'declined')} className="btn bg-red-600 hover:bg-red-700 text-white">Decline</button>}
        {canComplete && <button disabled={busy} onClick={() => onStatusChange(booking, 'completed')} className="btn bg-green-600 hover:bg-green-700 text-white">Mark Completed</button>}
        {canCancel && <button disabled={busy} onClick={() => onStatusChange(booking, 'cancelled')} className="btn bg-ink-muted hover:bg-gray-700 text-white">Cancel Request</button>}
        {canPayDeposit && (
          <button disabled={busy} onClick={() => onCollectDeposit(booking)} className="btn btn-primary">
            {booking.paymentStatus === 'requires_action' ? 'Continue Deposit' : 'Pay Deposit'}
          </button>
        )}
      </div>
    </div>
  )
}

function DepositPaymentForm({
  booking,
  currentUser,
  onClose,
  onSuccess,
}: {
  booking: Booking
  currentUser: User
  onClose: () => void
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return
    setSubmitting(true)
    setError(null)
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
      redirect: 'if_required',
    })

    if (stripeError) {
      console.error(stripeError)
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
      return
    }

    if (!paymentIntent) {
      setError('Payment could not be processed. Try again.')
      setSubmitting(false)
      return
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        const token = await currentUser.getIdToken()
        const res = await fetch('/api/payments/record-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId: booking.id,
            artistUid: booking.artistUid,
            paymentIntentId: paymentIntent.id,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.error ?? 'Unable to confirm deposit status.')
        }
        onSuccess()
        onClose()
      } catch (apiError: any) {
        console.error(apiError)
        setError(apiError?.message ?? 'Unable to confirm payment right now.')
      } finally {
        setSubmitting(false)
      }
      return
    }

    if (paymentIntent.status === 'requires_action') {
      setError('Additional verification required. Please follow the prompts in the modal.')
    }
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Secure Deposit</h2>
      <p className="text-sm text-gray-400">A deposit of ${booking.depositAmount?.toFixed(2)} keeps your artist slot reserved.</p>
      <PaymentElement />
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className="btn bg-ink-muted hover:bg-gray-700 text-white" disabled={submitting}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Processing…' : 'Confirm Payment'}
        </button>
      </div>
      <p className="text-xs text-gray-500">All communication and payments remain inside InkMatching. Keep the experience safe for artists and clients.</p>
    </form>
  )
}

export default function BookingsPage() {
  const { user, loading } = useAuth()
  const [role, setRole] = useState<UserRole | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [paymentState, setPaymentState] = useState<PaymentState>({ booking: null, clientSecret: null, loading: false, error: null })

  useEffect(() => {
    if (!user) { setRole(null); return }
    let cancelled = false
    const load = async () => {
      try {
        const profile = await getPublicProfile(user.uid)
        if (!cancelled) setRole(profile?.role ?? null)
      } catch (error) {
        console.error(error)
        if (!cancelled) setRole(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const refreshBookings = useCallback(async () => {
    if (!user) return
    if (!role) return
    setLoadingBookings(true)
    try {
      if (role === 'artist') {
        setBookings(await listBookingsForArtist(user.uid))
      } else if (role === 'client') {
        setBookings(await listBookingsForClient(user.uid))
      } else {
        setBookings([])
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingBookings(false)
    }
  }, [role, user])

  useEffect(() => { refreshBookings() }, [refreshBookings])

  const handleStatusChange = useCallback(async (booking: Booking, status: Booking['status']) => {
    setActionBusy(booking.id)
    try {
      await updateBooking(booking, { status })
      await refreshBookings()
    } catch (error) {
      console.error(error)
      alert('Unable to update booking status right now.')
    } finally {
      setActionBusy(null)
    }
  }, [refreshBookings])

  const handleCollectDeposit = useCallback(async (booking: Booking) => {
    if (!user) return
    if (!stripePromise) {
      alert('Stripe is not configured.')
      return
    }
    setPaymentState({ booking, clientSecret: null, loading: true, error: null })
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId: booking.id, artistUid: booking.artistUid }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error ?? 'Unable to initiate payment.')
      }
      const data = await res.json()
      setPaymentState({ booking, clientSecret: data.clientSecret, loading: false, error: null })
    } catch (error: any) {
      console.error(error)
      setPaymentState({ booking, clientSecret: null, loading: false, error: error?.message ?? 'Payment unavailable.' })
    }
  }, [user])

  const groupedBookings = useMemo(() => {
    return {
      pending: bookings.filter((b) => b.status === 'pending'),
      active: bookings.filter((b) => b.status === 'accepted'),
      history: bookings.filter((b) => ['declined', 'cancelled', 'completed'].includes(b.status)),
    }
  }, [bookings])

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return <div className="p-8 text-gray-400">Please login to manage bookings.</div>
  if (!role) return <div className="p-8 text-gray-400">Set up your profile to start booking.</div>
  if (role === 'admin') return <div className="p-8 text-gray-400">Admins can review bookings via the Admin dashboard.</div>

  const headline = role === 'artist' ? 'Booking Requests' : 'My Bookings'
  const helperText = role === 'artist'
    ? 'Review incoming requests, confirm your calendar, and keep clients updated inside InkMatching.'
    : 'Track every appointment and deposit in one place—no need to swap contact details.'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">{headline}</h1>
        <p className="text-sm text-gray-400">{helperText}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Awaiting Response</h2>
        {loadingBookings ? (
          <div className="rounded-lg border border-ink-muted/60 bg-ink-surface/70 px-4 py-6 text-center text-gray-400">Loading bookings…</div>
        ) : groupedBookings.pending.length === 0 ? (
          <div className="rounded-lg border border-ink-muted/60 bg-ink-surface/60 px-4 py-6 text-center text-gray-500">No pending requests.</div>
        ) : (
          <div className="space-y-4">
            {groupedBookings.pending.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role={role}
                onStatusChange={handleStatusChange}
                onCollectDeposit={handleCollectDeposit}
                busy={actionBusy === booking.id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Scheduled</h2>
        {groupedBookings.active.length === 0 ? (
          <div className="rounded-lg border border-ink-muted/60 bg-ink-surface/60 px-4 py-6 text-center text-gray-500">No confirmed bookings yet.</div>
        ) : (
          <div className="space-y-4">
            {groupedBookings.active.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role={role}
                onStatusChange={handleStatusChange}
                onCollectDeposit={handleCollectDeposit}
                busy={actionBusy === booking.id}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">History</h2>
        {groupedBookings.history.length === 0 ? (
          <div className="rounded-lg border border-ink-muted/60 bg-ink-surface/60 px-4 py-6 text-center text-gray-500">No past bookings.</div>
        ) : (
          <div className="space-y-4">
            {groupedBookings.history.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                role={role}
                onStatusChange={handleStatusChange}
                onCollectDeposit={handleCollectDeposit}
                busy={actionBusy === booking.id}
              />
            ))}
          </div>
        )}
      </section>

      {paymentState.loading && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="rounded-xl border border-ink-muted/60 bg-ink-surface px-6 py-8 text-gray-200">Preparing secure payment…</div>
        </div>
      )}

      {paymentState.error && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="max-w-md space-y-4 rounded-xl border border-red-500/40 bg-ink-surface px-6 py-6 text-red-200">
            <h3 className="text-lg font-semibold">Deposit unavailable</h3>
            <p className="text-sm">{paymentState.error}</p>
            <button onClick={() => setPaymentState({ booking: null, clientSecret: null, loading: false, error: null })} className="btn btn-primary">Got it</button>
          </div>
        </div>
      )}

      {paymentState.booking && paymentState.clientSecret && stripePromise && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-ink-muted/70 bg-ink-surface/90 p-6 shadow-2xl shadow-black/40">
            <Elements stripe={stripePromise} options={{ clientSecret: paymentState.clientSecret }}>
              <DepositPaymentForm
                booking={paymentState.booking}
                currentUser={user}
                onClose={() => setPaymentState({ booking: null, clientSecret: null, loading: false, error: null })}
                onSuccess={() => {
                  refreshBookings()
                  setPaymentState({ booking: null, clientSecret: null, loading: false, error: null })
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  )
}
