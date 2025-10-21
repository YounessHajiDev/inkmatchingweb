import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

// Rebuilds minimal publicProfiles from /users
// Auth: requires ?secret=ADMIN_REPAIR_SECRET
export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const secret = url.searchParams.get('secret') || req.headers.get('x-repair-secret') || ''
    const expected = process.env.ADMIN_REPAIR_SECRET || process.env.REPAIR_SECRET
    if (!expected || secret !== expected) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const usersSnap = await adminDb.ref('users').get()
    if (!usersSnap.exists()) {
      return NextResponse.json({ ok: false, error: 'no-users' }, { status: 404 })
    }

    const users: Record<string, any> = usersSnap.val()
    const updates: Record<string, any> = {}
    let created = 0
    let skipped = 0

    Object.entries(users).forEach(([uid, u]: [string, any]) => {
      const role = u.role || 'client'
      const displayName = u.displayName || u.email || uid
      // Only recreate for existing artists and clients, leave others untouched
      const baseProfile = {
        uid,
        role,
        displayName,
        city: u.city || '',
        styles: Array.isArray(u.styles) ? u.styles : [],
        portfolioImages: Array.isArray(u.portfolioImages) ? u.portfolioImages : [],
        coverURL: u.coverURL || '',
        isPublic: role === 'artist',
      }
      // Write only if missing, to avoid overwriting any profile that may have been recreated already
      updates[`publicProfiles/${uid}`] = baseProfile
      created += 1
    })

    await adminDb.ref().update(updates)

    return NextResponse.json({ ok: true, created, skipped })
  } catch (err: any) {
    console.error('[repair-public-profiles] failed:', err)
    return NextResponse.json({ ok: false, error: err?.message || 'unknown-error' }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'
