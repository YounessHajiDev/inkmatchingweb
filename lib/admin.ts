import { get, ref } from 'firebase/database'
import { db } from '@/lib/firebaseClient'
import type { Booking, Lead, PublicProfile } from '@/types'

export async function fetchAllProfiles(): Promise<PublicProfile[]> {
  const snap = await get(ref(db, 'publicProfiles'))
  if (!snap.exists()) return []
  return Object.entries(snap.val() as Record<string, PublicProfile>).map(([uid, profile]) => ({ ...profile, uid }))
}

export async function fetchLeadsOverview(): Promise<{ total: number; open: number }> {
  const snap = await get(ref(db, 'leadsByArtist'))
  if (!snap.exists()) return { total: 0, open: 0 }
  let total = 0
  let open = 0
  Object.values(snap.val() as Record<string, Record<string, Lead>>).forEach((artistLeads) => {
    Object.values(artistLeads).forEach((lead) => {
      total += 1
      if (lead.status === 'new' || lead.status === 'accepted') open += 1
    })
  })
  return { total, open }
}

export async function fetchBookingsOverview(): Promise<{ total: number; pending: number; awaitingDeposit: number }> {
  const snap = await get(ref(db, 'bookingsByArtist'))
  if (!snap.exists()) return { total: 0, pending: 0, awaitingDeposit: 0 }
  let total = 0
  let pending = 0
  let awaitingDeposit = 0
  Object.values(snap.val() as Record<string, Record<string, Booking>>).forEach((artistBookings) => {
    Object.values(artistBookings).forEach((booking) => {
      total += 1
      if (booking.status === 'pending') pending += 1
      if (booking.depositAmount && booking.paymentStatus !== 'succeeded') awaitingDeposit += 1
    })
  })
  return { total, pending, awaitingDeposit }
}
