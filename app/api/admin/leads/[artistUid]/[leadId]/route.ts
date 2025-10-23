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

export async function PATCH(req: Request, { params }: { params: { artistUid: string; leadId: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { artistUid, leadId } = params
  try {
    const body = await req.json()
    await adminDb.ref(`leadsByArtist/${artistUid}/${leadId}`).update(body)
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'update_lead', `${artistUid}/${leadId}`, { updates: body })
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin patch lead error', e)
    return NextResponse.json({ error: 'Unable to update lead' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { artistUid: string; leadId: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { artistUid, leadId } = params
  try {
    await adminDb.ref(`leadsByArtist/${artistUid}/${leadId}`).remove()
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'delete_lead', `${artistUid}/${leadId}`, null)
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin delete lead error', e)
    return NextResponse.json({ error: 'Unable to delete lead' }, { status: 500 })
  }
}
