import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'

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
    const snap = await adminDb.ref('adminLogs').once('value')
    const data = snap.exists() ? snap.val() : {}
    const entries: any[] = []
    Object.entries(data).forEach(([key, val]: any) => entries.push({ id: key, ...val }))
    // sort desc
    entries.sort((a, b) => (b.ts || 0) - (a.ts || 0))
    return NextResponse.json({ logs: entries })
  } catch (e) {
    console.error('admin list logs error', e)
    return NextResponse.json({ error: 'Unable to list logs' }, { status: 500 })
  }
}
