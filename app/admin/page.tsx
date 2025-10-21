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
    return () => { cancelled = true }
  }, [role, user])

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
