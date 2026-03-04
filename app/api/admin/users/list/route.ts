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

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const list = await adminAuth.listUsers(1000)
    const users = list.users.map((u) => ({ uid: u.uid, email: u.email, displayName: u.displayName, customClaims: u.customClaims }))
    return NextResponse.json({ users })
  } catch (e) {
    console.error('admin list users error', e)
    return NextResponse.json({ error: 'Unable to list users' }, { status: 500 })
  }
}
