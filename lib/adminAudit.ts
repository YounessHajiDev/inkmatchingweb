import { adminDb } from './firebaseAdmin'

export async function logAdminAction(actorUid: string | null, action: string, target: string | null = null, details: Record<string, any> | null = null) {
  try {
    const entry = {
      actor: actorUid || 'unknown',
      action,
      target: target || null,
      details: details || null,
      ts: Date.now(),
    }
    await adminDb.ref('adminLogs').push(entry)
  } catch (e) {
    console.error('Failed to write admin audit log', e)
  }
}
