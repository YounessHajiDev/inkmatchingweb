'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { addEvent, deleteEvent, listEvents, type LegacyCalendarEvent } from '@/lib/calendar'
import { getPublicProfile } from '@/lib/publicProfiles'
import { listBookingsForArtist } from '@/lib/bookings'
import type { Booking, UserRole } from '@/types'

export default function CalendarPage() {
  const { user, loading } = useAuth()
  const [events, setEvents] = useState<LegacyCalendarEvent[]>([])
  const [form, setForm] = useState({ title: '', dateISO: '', time: '', note: '' })
  const [busy, setBusy] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const monthLabel = useMemo(() => new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' }), [])

  useEffect(() => {
    if (!user) { setEvents([]); setRole(null); setBookings([]); return }
    listEvents(user.uid).then(setEvents).catch(console.error)
    let cancelled = false
    const loadProfile = async () => {
      try {
        const profile = await getPublicProfile(user.uid)
        if (!cancelled) setRole(profile?.role ?? null)
      } catch (error) {
        console.error(error)
        if (!cancelled) setRole(null)
      }
    }
    loadProfile()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || role !== 'artist') { setBookings([]); return }
    listBookingsForArtist(user.uid).then(setBookings).catch(console.error)
  }, [role, user])

  if (loading) return <div className="p-8 text-ink-text-muted">Loading…</div>
  if (!user) return <div className="p-8 text-ink-text-muted">Please login to see your calendar.</div>
  if (role && role !== 'artist') return <div className="p-8 text-ink-text-muted">Calendars are available for artist accounts. Switch to an artist profile to manage availability.</div>

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.dateISO) return
    setBusy(true)
    try {
      await addEvent(user.uid, { ...form })
      setForm({ title: '', dateISO: '', time: '', note: '' })
      setEvents(await listEvents(user.uid))
    } finally { setBusy(false) }
  }

  const del = async (id: string) => {
    setBusy(true)
    try {
      await deleteEvent(user.uid, id)
      setEvents(await listEvents(user.uid))
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <section className="space-y-3 rounded-4xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur-md sm:p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-ink-text-muted">Calendar</p>
        <h1 className="text-3xl font-semibold text-white">{monthLabel}</h1>
        <p className="text-sm text-ink-text-muted">Keep your confirmed bookings and personal holds aligned. Everything stays inside InkMatching.</p>
      </section>

      {bookings.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Upcoming bookings</h2>
          <div className="space-y-3">
            {bookings.filter((b) => b.status === 'accepted').length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm text-ink-text-muted shadow-glow-soft">No accepted bookings yet. Confirm requests from the bookings dashboard.</div>
            ) : (
              bookings.filter((b) => b.status === 'accepted').map((booking) => (
                <div key={booking.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-glow-soft">
                  <div className="flex items-center justify-between text-sm text-white">
                    <span>Client: {booking.clientUid}</span>
                    <span>{booking.scheduledFor ? new Date(`${booking.scheduledFor}${booking.scheduledTime ? `T${booking.scheduledTime}` : ''}`).toLocaleString([], { dateStyle: 'medium', timeStyle: booking.scheduledTime ? 'short' : undefined }) : 'Schedule pending'}</span>
                  </div>
                  {booking.note && <p className="mt-2 text-sm text-ink-text-muted">Notes: {booking.note}</p>}
                  {typeof booking.depositAmount === 'number' && (
                    <p className="mt-1 text-xs text-ink-text-muted">
                      Deposit {booking.paymentStatus === 'succeeded' ? 'paid' : 'awaiting'} (${booking.depositAmount.toFixed(2)})
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      )}

      <form onSubmit={submit} className="grid gap-3 rounded-4xl border border-white/10 bg-white/[0.04] p-6 shadow-glow-soft backdrop-blur-md sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        </div>
        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.dateISO} onChange={e=>setForm({...form, dateISO:e.target.value})} required />
        </div>
        <div>
          <label className="label">Time</label>
          <input className="input" type="time" value={form.time} onChange={e=>setForm({...form, time:e.target.value})} />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Note</label>
          <textarea className="input" rows={3} value={form.note} onChange={e=>setForm({...form, note:e.target.value})}/>
        </div>
        <div className="sm:col-span-2">
          <button className="btn btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Add event'}</button>
        </div>
      </form>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center text-ink-text-muted shadow-glow-soft">No events yet.</div>
        ) : events.map(ev => (
          <div key={ev.id} className="flex items-start justify-between rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-glow-soft">
            <div>
              <div className="font-semibold text-white">{ev.title}</div>
              <div className="text-sm text-ink-text-muted">{ev.dateISO}{ev.time ? ` • ${ev.time}` : ''}</div>
              {ev.note && <div className="mt-1 text-sm text-ink-text-muted">{ev.note}</div>}
            </div>
            <button onClick={()=>del(ev.id)} className="btn btn-secondary">Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
