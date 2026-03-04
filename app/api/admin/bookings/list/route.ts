import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { logAdminAction } from '@/lib/adminAudit'

async function verifyAdmin(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return false
  const idToken = auth.split(' ')[1]
  try {
    const decoded = await adminAuth.verifyIdToken(idToken)
    return Boolean(decoded?.admin === true)
  } catch (e) {
    console.error('verifyAdmin error', e)
    return false
  }
}

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const snap = await adminDb.ref('bookingsByArtist').once('value')
    const data = snap.exists() ? snap.val() : {}
    const flattened: Array<any> = []
    Object.entries(data).forEach(([artistUid, byId]: any) => {
      Object.entries(byId || {}).forEach(([bookingId, bookingObj]: any) => {
        flattened.push({ artistUid, bookingId, ...bookingObj })
      })
    })
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'view_bookings_list', null, { count: flattened.length })
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ bookings: flattened })
  } catch (e) {
    console.error('admin list bookings error', e)
    return NextResponse.json({ error: 'Unable to list bookings' }, { status: 500 })
  }
}
