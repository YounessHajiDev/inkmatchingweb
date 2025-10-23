import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebaseAdmin'
import { logAdminAction } from '@/lib/adminAudit'
import Stripe from 'stripe'

const stripeSecret = process.env.STRIPE_SECRET_KEY
const stripe = stripeSecret ? new Stripe(stripeSecret) : null

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
    for (const [artistUid, byId] of Object.entries(data)) {
      for (const [bookingId, bookingObj] of Object.entries(byId as any)) {
        const rec: any = { artistUid, bookingId, ...(bookingObj as any) }
        if (stripe && rec.paymentIntentId) {
          try {
            const intent = await stripe.paymentIntents.retrieve(rec.paymentIntentId)
            rec.stripeStatus = intent.status
            rec.stripeAmount = intent.amount
          } catch (e) {
            console.error('stripe retrieve failed', e)
            rec.stripeError = true
          }
        }
        flattened.push(rec)
      }
    }
    try {
      const auth = req.headers.get('authorization')
      const decoded = auth ? await adminAuth.verifyIdToken(auth.split(' ')[1]) : null
      await logAdminAction(decoded?.uid ?? null, 'view_payments_list', null, { count: flattened.length })
    } catch (e) { console.error('audit log failed', e) }
    return NextResponse.json({ payments: flattened })
  } catch (e) {
    console.error('admin list payments error', e)
    return NextResponse.json({ error: 'Unable to list payments' }, { status: 500 })
  }
}
