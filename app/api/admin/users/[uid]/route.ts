import { NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebaseAdmin'

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

export async function DELETE(req: Request, { params }: { params: { uid: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uid } = params
  try {
    await adminAuth.deleteUser(uid)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin delete user error', e)
    return NextResponse.json({ error: 'Unable to delete user' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { uid: string } }) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { uid } = params
  try {
    const body = await req.json()
    if (body.setAdmin === true) {
      await adminAuth.setCustomUserClaims(uid, { admin: true })
    } else if (body.setAdmin === false) {
      await adminAuth.setCustomUserClaims(uid, { admin: false })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('admin patch user error', e)
    return NextResponse.json({ error: 'Unable to update user' }, { status: 500 })
  }
}
