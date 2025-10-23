import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebaseAdmin'

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
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin put profile error', e)
    return NextResponse.json({ error: 'Unable to update profile' }, { status: 500 })
  }
}
