'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { getPublicProfile } from '@/lib/publicProfiles'
import { fetchAllProfiles, fetchBookingsOverview, fetchLeadsOverview } from '@/lib/admin'
import type { PublicProfile } from '@/types'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const [role, setRole] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<PublicProfile[]>([])
  const [leadSummary, setLeadSummary] = useState<{ total: number; open: number } | null>(null)
  const [bookingSummary, setBookingSummary] = useState<{ total: number; pending: number; awaitingDeposit: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<Array<{ uid: string; email?: string | null; displayName?: string | null; customClaims?: any }>>([])
  const [editingUid, setEditingUid] = useState<string | null>(null)
  const [editingProfile, setEditingProfile] = useState<any | null>(null)
  const [leadsList, setLeadsList] = useState<any[]>([])
  const [bookingsList, setBookingsList] = useState<any[]>([])

  useEffect(() => {
    if (!user) { setRole(null); return }
    let cancelled = false
    const loadRole = async () => {
      try {
        const profile = await getPublicProfile(user.uid)
        if (!cancelled) setRole(profile?.role ?? null)
      } catch (err) {
        console.error(err)
        if (!cancelled) setRole(null)
      }
    }
    loadRole()
    return () => { cancelled = true }
  }, [user])

  useEffect(() => {
    if (!user || role !== 'admin') return
    let cancelled = false
    const load = async () => {
      try {
        const [allProfiles, leads, bookings] = await Promise.all([
          fetchAllProfiles(),
          fetchLeadsOverview(),
          fetchBookingsOverview(),
        ])
        if (!cancelled) {
          setProfiles(allProfiles)
          setLeadSummary(leads)
          setBookingSummary(bookings)
        }
      } catch (err) {
        console.error(err)
        if (!cancelled) setError('Unable to load admin insights right now.')
      }
    }
    load()
    // also load auth users list for user-level actions
    const loadUsers = async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/admin/users/list', { headers: { Authorization: `Bearer ${token}` } })
        const json = await res.json()
        if (!cancelled && Array.isArray(json.users)) setUsers(json.users)
      } catch (e) {
        console.error('Unable to load users', e)
      }
    }
    loadUsers()
    // load full leads & bookings for admin actions
    const loadLeadsAndBookings = async () => {
      try {
        const token = await user.getIdToken()
        const [leadsRes, bookingsRes] = await Promise.all([
          fetch('/api/admin/leads/list', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/bookings/list', { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const leadsJson = await leadsRes.json()
        const bookingsJson = await bookingsRes.json()
        if (!cancelled) {
          setLeadsList(Array.isArray(leadsJson.leads) ? leadsJson.leads : [])
          setBookingsList(Array.isArray(bookingsJson.bookings) ? bookingsJson.bookings : [])
        }
      } catch (e) {
        console.error('Unable to load leads/bookings', e)
      }
    }
    loadLeadsAndBookings()
    return () => { cancelled = true }
  }, [role, user])

  async function toggleAdmin(uid: string, makeAdmin: boolean) {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ setAdmin: makeAdmin }),
      })
      const json = await res.json()
      if (json?.success) {
        setUsers((s) => s.map((u) => (u.uid === uid ? { ...u, customClaims: { ...(u.customClaims || {}), admin: makeAdmin } } : u)))
      }
    } catch (e) {
      console.error(e)
      setError('Unable to update user role')
    }
  }

  async function removeUser(uid: string) {
    if (!user) return
    if (!confirm('Delete user and all auth records? This is irreversible.')) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/users/${uid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json?.success) {
        setUsers((s) => s.filter((u) => u.uid !== uid))
      }
    } catch (e) {
      console.error(e)
      setError('Unable to delete user')
    }
  }

  async function startEditProfile(uid: string) {
    try {
      const token = await user!.getIdToken()
      const res = await fetch(`/api/admin/profiles/${uid}`, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()
      setEditingUid(uid)
      setEditingProfile(json.profile ?? { uid })
    } catch (e) {
      console.error(e)
      setError('Unable to load profile for editing')
    }
  }

  async function saveEditingProfile() {
    if (!user || !editingUid || !editingProfile) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/profiles/${editingUid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingProfile),
      })
      const json = await res.json()
      if (json?.success) {
        setProfiles((s) => s.map((p) => (p.uid === editingUid ? { ...p, ...editingProfile } : p)))
        setEditingUid(null)
        setEditingProfile(null)
      }
    } catch (e) {
      console.error(e)
      setError('Unable to save profile')
    }
  }

  async function updateLead(artistUid: string, leadId: string, updates: any) {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/leads/${artistUid}/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (json?.success) {
        setLeadsList((s) => s.map((l) => (l.artistUid === artistUid && l.leadId === leadId ? { ...l, ...updates } : l)))
      }
    } catch (e) {
      console.error(e)
      setError('Unable to update lead')
    }
  }

  async function deleteLead(artistUid: string, leadId: string) {
    if (!user) return
    if (!confirm('Delete this lead? This cannot be undone.')) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/leads/${artistUid}/${leadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json?.success) setLeadsList((s) => s.filter((l) => !(l.artistUid === artistUid && l.leadId === leadId)))
    } catch (e) {
      console.error(e)
      setError('Unable to delete lead')
    }
  }

  async function updateBooking(artistUid: string, bookingId: string, updates: any) {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/bookings/${artistUid}/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates),
      })
      const json = await res.json()
      if (json?.success) setBookingsList((s) => s.map((b) => (b.artistUid === artistUid && b.bookingId === bookingId ? { ...b, ...updates } : b)))
    } catch (e) {
      console.error(e)
      setError('Unable to update booking')
    }
  }

  async function deleteBooking(artistUid: string, bookingId: string) {
    if (!user) return
    if (!confirm('Delete this booking? This cannot be undone.')) return
    try {
      const token = await user.getIdToken()
      const res = await fetch(`/api/admin/bookings/${artistUid}/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json?.success) setBookingsList((s) => s.filter((b) => !(b.artistUid === artistUid && b.bookingId === bookingId)))
    } catch (e) {
      console.error(e)
      setError('Unable to delete booking')
    }
  }

  if (loading) return <div className="p-8 text-gray-400">Loading…</div>
  if (!user) return <div className="p-8 text-gray-400">Please login as an admin.</div>
  if (role !== 'admin') return <div className="p-8 text-gray-400">You need an admin role to access this page.</div>

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-white">Admin Control</h1>
        <p className="text-sm text-gray-400">Monitor community health, bookings, and leads without leaving InkMatching.</p>
      </header>

      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card border border-ink-muted/60 bg-ink-surface/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Profiles</h2>
          <p className="mt-2 text-3xl font-semibold text-white">{profiles.length}</p>
          <p className="text-xs text-gray-500">Active artists and clients in the network.</p>
        </div>
        <div className="card border border-ink-muted/60 bg-ink-surface/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Leads</h2>
          <p className="mt-2 text-3xl font-semibold text-white">{leadSummary?.total ?? 0}</p>
          <p className="text-xs text-gray-500">{leadSummary ? `${leadSummary.open} still open` : 'Loading insights…'}</p>
        </div>
        <div className="card border border-ink-muted/60 bg-ink-surface/70 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Bookings</h2>
          <p className="mt-2 text-3xl font-semibold text-white">{bookingSummary?.total ?? 0}</p>
          <p className="text-xs text-gray-500">
            {bookingSummary ? `${bookingSummary.pending} pending • ${bookingSummary.awaitingDeposit} awaiting deposits` : 'Loading data…'}
          </p>
        </div>
      </section>

      {/* Auth users management */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Auth Users</h2>
          <span className="rounded-full border border-ink-muted/60 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">
            {users.length} users
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink-muted/60">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-ink-surface/70 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">UID</th>
                <th className="px-4 py-3 text-left">Admin</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-muted/60 bg-ink-surface/40">
              {users.map((u) => (
                <tr key={u.uid} className="hover:bg-ink-surface/70">
                  <td className="px-4 py-3">{u.email ?? <span className="text-xs text-gray-500">—</span>}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">{u.uid}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${u.customClaims?.admin ? 'bg-green-600/40 text-green-200' : 'bg-gray-700/30 text-gray-300'}`}>
                      {u.customClaims?.admin ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAdmin(u.uid, !u.customClaims?.admin)} className="btn btn-sm">
                        {u.customClaims?.admin ? 'Revoke' : 'Make admin'}
                      </button>
                      <button onClick={() => removeUser(u.uid)} className="btn btn-danger btn-sm">Delete</button>
                      <button onClick={() => startEditProfile(u.uid)} className="btn btn-ghost btn-sm">Edit profile</button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No users found or insufficient privileges.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Leads management */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Leads</h2>
          <span className="rounded-full border border-ink-muted/60 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">{leadsList.length} leads</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-muted/60">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-ink-surface/70 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Artist</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Notes</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-muted/60 bg-ink-surface/40">
              {leadsList.map((l) => (
                <tr key={`${l.artistUid}_${l.leadId}`} className="hover:bg-ink-surface/70">
                  <td className="px-4 py-3 text-xs text-gray-300">{l.artistUid}</td>
                  <td className="px-4 py-3 text-white">{l.clientName ?? l.clientUid}</td>
                  <td className="px-4 py-3">
                    <select value={l.status || 'new'} onChange={(e) => updateLead(l.artistUid, l.leadId, { status: e.target.value })} className="input input-sm">
                      <option value="new">new</option>
                      <option value="accepted">accepted</option>
                      <option value="closed">closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{l.note || ''}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn btn-sm" onClick={() => updateLead(l.artistUid, l.leadId, { status: 'accepted' })}>Accept</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteLead(l.artistUid, l.leadId)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {leadsList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No leads yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bookings management */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Bookings</h2>
          <span className="rounded-full border border-ink-muted/60 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">{bookingsList.length} bookings</span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-muted/60">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-ink-surface/70 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Artist</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Deposit</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-muted/60 bg-ink-surface/40">
              {bookingsList.map((b) => (
                <tr key={`${b.artistUid}_${b.bookingId}`} className="hover:bg-ink-surface/70">
                  <td className="px-4 py-3 text-xs text-gray-300">{b.artistUid}</td>
                  <td className="px-4 py-3 text-white">{b.clientUid}</td>
                  <td className="px-4 py-3">
                    <select value={b.status || 'pending'} onChange={(e) => updateBooking(b.artistUid, b.bookingId, { status: e.target.value })} className="input input-sm">
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                      <option value="completed">completed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{b.depositAmount ? `$${b.depositAmount}` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="btn btn-sm" onClick={() => updateBooking(b.artistUid, b.bookingId, { status: 'confirmed' })}>Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteBooking(b.artistUid, b.bookingId)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {bookingsList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No bookings yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Profile edit modal (simple) */}
      {editingUid && editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-2xl rounded-lg bg-ink-surface/80 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Editing profile: {editingUid}</h3>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm text-gray-400">Display name
                <input className="input mt-1 w-full" value={editingProfile.displayName || ''} onChange={(e) => setEditingProfile({ ...editingProfile, displayName: e.target.value })} />
              </label>
              <label className="text-sm text-gray-400">City
                <input className="input mt-1 w-full" value={editingProfile.city || ''} onChange={(e) => setEditingProfile({ ...editingProfile, city: e.target.value })} />
              </label>
              <label className="text-sm text-gray-400">Role
                <input className="input mt-1 w-full" value={editingProfile.role || ''} onChange={(e) => setEditingProfile({ ...editingProfile, role: e.target.value })} />
              </label>
              <label className="text-sm text-gray-400">Styles (comma separated)
                <input className="input mt-1 w-full" value={Array.isArray(editingProfile.styles) ? editingProfile.styles.join(', ') : (editingProfile.styles || '')} onChange={(e) => setEditingProfile({ ...editingProfile, styles: e.target.value.split(',').map((s: string) => s.trim()) })} />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" onClick={() => { setEditingUid(null); setEditingProfile(null) }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => saveEditingProfile()}>Save</button>
            </div>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Community Directory</h2>
          <span className="rounded-full border border-ink-muted/60 px-3 py-1 text-xs uppercase tracking-wide text-gray-500">
            {profiles.length} profiles
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-ink-muted/60">
          <table className="min-w-full text-sm text-gray-300">
            <thead className="bg-ink-surface/70 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">City</th>
                <th className="px-4 py-3 text-left">Styles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-muted/60 bg-ink-surface/40">
              {profiles.map((profile) => (
                <tr key={profile.uid} className="hover:bg-ink-surface/70">
                  <td className="px-4 py-3 text-white">{profile.displayName || profile.uid}</td>
                  <td className="px-4 py-3 capitalize">{profile.role}</td>
                  <td className="px-4 py-3">{profile.city}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {Array.isArray(profile.styles) ? profile.styles.join(', ') : profile.styles}
                  </td>
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No profiles available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">Need more controls? Extend this dashboard with moderation tools or artist verification workflows.</p>
      </section>
    </div>
  )
}
