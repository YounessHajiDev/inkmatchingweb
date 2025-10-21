'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPublicProfile } from '@/lib/publicProfiles'
import { ensureOneToOneThread, sendText } from '@/lib/realtime'
import { requestBooking } from '@/lib/bookings'
import { useAuth } from '@/components/AuthProvider'
import type { PublicProfile } from '@/types'
import Image from 'next/image'

export default function ArtistProfilePage() {
  const params = useParams()
  const uid = params.uid as string
  const { user } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [messaging, setMessaging] = useState(false)
  const [myProfile, setMyProfile] = useState<PublicProfile | null>(null)
  const [bookingBusy, setBookingBusy] = useState(false)
  const [bookingFeedback, setBookingFeedback] = useState<string | null>(null)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    scheduledFor: '',
    scheduledTime: '',
    style: '',
    note: '',
    budget: '',
    depositAmount: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      try { setProfile(await getPublicProfile(uid)) }
      catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    loadProfile()
  }, [uid])

  useEffect(() => {
    if (!user) { setMyProfile(null); return }
    let cancelled = false
    const load = async () => {
      try {
        const mine = await getPublicProfile(user.uid)
        if (!cancelled) setMyProfile(mine)
      } catch (e) {
        console.error(e)
        if (!cancelled) setMyProfile(null)
      }
    }
    load()
    return () => { cancelled = true }
  }, [user])

  const handleMessage = async () => {
    if (!user) { router.push('/login'); return }
    if (user.uid === uid) return
    if (myProfile && myProfile.role !== 'client' && myProfile.role !== 'admin') {
      alert('Only clients can start conversations with artists.')
      return
    }
    setMessaging(true)
    try {
      const threadId = await ensureOneToOneThread(user.uid, uid)
      await sendText(threadId, 'Hello!', user.uid)
      router.push(`/chat/${threadId}`)
    } catch (e) {
      console.error(e); alert('Failed to start conversation')
    } finally { setMessaging(false) }
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">Loading profile...</div></div>
  if (!profile) return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
      <p className="text-gray-400">This artist profile does not exist</p>
    </div>
  )

  const stylesText = typeof profile.styles === 'string' ? profile.styles : Array.isArray(profile.styles) ? profile.styles.join(', ') : ''
  const isClient = myProfile?.role === 'client'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card overflow-hidden">
        <div className="relative h-64 bg-ink-muted">
          {profile.coverURL ? (
            <Image src={profile.coverURL} alt={profile.displayName} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">No Cover Image</div>
          )}
        </div>
        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{profile.displayName}</h1>
            <p className="text-lg text-gray-400">{profile.city}</p>
          </div>
          {stylesText && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Styles</h2>
              <p className="text-white">{stylesText}</p>
            </div>
          )}
          {typeof profile.rating === 'number' && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase mb-2">Rating</h2>
              <div className="flex items-center space-x-2">
                <span className="text-yellow-400 text-2xl">★</span>
                <span className="text-xl text-white">{profile.rating.toFixed(1)}</span>
              </div>
            </div>
          )}
          <button onClick={handleMessage} disabled={messaging} className="btn-primary w-full py-3 text-lg">
            {messaging ? 'Loading...' : 'Send Message'}
          </button>
          {isClient && user?.uid !== uid && (
            <div className="mt-8 space-y-4 border-t border-ink-muted/60 pt-6">
              <h2 className="text-xl font-semibold text-white">Request an Appointment</h2>
              <p className="text-sm text-gray-400">Share a few details so the artist can confirm availability. All scheduling stays inside InkMatching.</p>
              {bookingFeedback && <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">{bookingFeedback}</div>}
              {bookingError && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{bookingError}</div>}
              <form
                className="grid gap-3 sm:grid-cols-2"
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!user) { router.push('/login'); return }
                  setBookingBusy(true)
                  setBookingFeedback(null)
                  setBookingError(null)
                  try {
                    await requestBooking(uid, user.uid, {
                      scheduledFor: bookingForm.scheduledFor || undefined,
                      scheduledTime: bookingForm.scheduledTime || undefined,
                      style: bookingForm.style || undefined,
                      note: bookingForm.note || undefined,
                      budget: bookingForm.budget ? Number(bookingForm.budget) : undefined,
                      depositAmount: bookingForm.depositAmount ? Number(bookingForm.depositAmount) : undefined,
                    })
                    setBookingFeedback('Request sent! The artist will reply inside InkMatching.')
                    setBookingForm({ scheduledFor: '', scheduledTime: '', style: '', note: '', budget: '', depositAmount: '' })
                  } catch (error: any) {
                    console.error(error)
                    setBookingError(error?.message ?? 'Unable to submit booking request right now.')
                  } finally {
                    setBookingBusy(false)
                  }
                }}
              >
                <div>
                  <label className="label">Preferred Date</label>
                  <input
                    type="date"
                    className="input"
                    value={bookingForm.scheduledFor}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Preferred Time</label>
                  <input
                    type="time"
                    className="input"
                    value={bookingForm.scheduledTime}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Style or Placement</label>
                  <input
                    className="input"
                    placeholder="Blackwork, forearm, etc."
                    value={bookingForm.style}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, style: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Budget (USD)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={bookingForm.budget}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, budget: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={bookingForm.note}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, note: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Deposit Amount (optional)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={bookingForm.depositAmount}
                    onChange={(e) => setBookingForm((prev) => ({ ...prev, depositAmount: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button disabled={bookingBusy} className="btn-primary w-full py-2.5">
                    {bookingBusy ? 'Sending request…' : 'Submit booking request'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
