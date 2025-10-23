import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'
import { logAdminAction } from '@/lib/adminAudit'

async function isAdmin(req: Request) {
  const auth = req.headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return false
  const idToken = auth.split(' ')[1]
  try {
    const decoded = await (await import('@/lib/firebaseAdmin')).adminAuth.verifyIdToken(idToken)
    return Boolean(decoded?.admin === true)
  } catch (e) {
    console.error('isAdmin error', e)
    return false
  }
}

export async function GET(req: Request, { params }: { params: { uid: string } }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uid } = params
  try {
    const snap = await adminDb.ref(`publicProfiles/${uid}`).once('value')
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await (await import('@/lib/firebaseAdmin')).adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'view_profile', uid, null)
    } catch (e) {
      console.error('audit log failed', e)
    }
    return NextResponse.json({ profile: snap.exists() ? snap.val() : null })
  } catch (e) {
    console.error('admin get profile error', e)
    return NextResponse.json({ error: 'Unable to get profile' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { uid: string } }) {
  if (!(await isAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uid } = params
  try {
    const body = await req.json()
    await adminDb.ref(`publicProfiles/${uid}`).update(body)
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await (await import('@/lib/firebaseAdmin')).adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'update_profile', uid, { updates: body })
    } catch (e) {
      console.error('audit log failed', e)
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin put profile error', e)
    return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 })
  }
}
