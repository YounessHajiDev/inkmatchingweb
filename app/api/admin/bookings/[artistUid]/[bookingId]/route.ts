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

export async function PATCH(req: Request, { params }: { params: { artistUid: string; bookingId: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { artistUid, bookingId } = params
  try {
    const body = await req.json()
    await adminDb.ref(`bookingsByArtist/${artistUid}/${bookingId}`).update(body)
    // mirror to client index if present
    try {
      const clientRef = adminDb.ref(`bookingsByClient/${body.clientUid || ''}/${bookingId}`)
      if (body.clientUid) await clientRef.update(body)
    } catch (e) { /* ignore */ }
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'update_booking', `${artistUid}/${bookingId}`, { updates: body })
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin patch booking error', e)
    return NextResponse.json({ error: 'Unable to update booking' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { artistUid: string; bookingId: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { artistUid, bookingId } = params
  try {
    await adminDb.ref(`bookingsByArtist/${artistUid}/${bookingId}`).remove()
    try { await adminDb.ref(`bookingsByClient`).child(artistUid).child(bookingId).remove() } catch (e) { /* ignore */ }
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'delete_booking', `${artistUid}/${bookingId}`, null)
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin delete booking error', e)
    return NextResponse.json({ error: 'Unable to delete booking' }, { status: 500 })
  }
}
