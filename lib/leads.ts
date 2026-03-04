import { ref, push, set, get, onValue, off } from 'firebase/database'
import { db } from './firebaseClient'
import { fetchProfile } from './threads'
import { leadSchema } from './schemas'
import type { Lead } from '@/types'

/**
 * Auto-create a lead when a client sends the first message in a thread.
 */
export async function ensureLeadForFirstMessage(
  threadId: string,
  senderId: string,
  previewText: string,
  createdAtSeconds: number,
  attachments?: string[]
): Promise<void> {
  try {
    const threadSnap = await get(ref(db, `threads/${threadId}`))
    if (!threadSnap.exists()) return
    const thread = threadSnap.val() as Record<string, unknown>
    if (thread.leadId) return
    const members = thread.members ? Object.keys(thread.members as Record<string, boolean>) : []
    if (members.length !== 2) return
    const recipientId = members.find((uid: string) => uid !== senderId)
    if (!recipientId) return

    const [senderProfile, recipientProfile] = await Promise.all([
      fetchProfile(senderId),
      fetchProfile(recipientId),
    ])
    if (!senderProfile || !recipientProfile) return
    if (senderProfile.role !== 'client' || recipientProfile.role !== 'artist') return

    const leadRef = push(ref(db, `leadsByArtist/${recipientId}`))
    const leadId = leadRef.key!

    const lead: Omit<Lead, 'id'> = {
      clientId: senderId,
      clientName: senderProfile.displayName || 'Client',
      message: previewText.trim() || 'New conversation started',
      style: '',
      city: '',
      createdAt: createdAtSeconds,
      status: 'new',
      threadId,
      attachments: attachments || [],
    }

    await set(leadRef, lead)
    await set(ref(db, `threads/${threadId}/leadId`), leadId)
  } catch (error) {
    console.error('ensureLeadForFirstMessage', error)
  }
}

export function subscribeToLeads(
  artistUid: string,
  callback: (leads: Lead[]) => void
): () => void {
  const leadsRef = ref(db, `leadsByArtist/${artistUid}`)
  const listener = onValue(leadsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const leads: Lead[] = Object.entries(data).map(([id, raw]) => {
      const parsed = leadSchema.safeParse(raw)
      if (!parsed.success) {
        return { id, clientId: '', clientName: '', message: '', style: '', city: '', createdAt: 0, status: 'new' as const }
      }
      return { ...parsed.data, id }
    })
    leads.sort((a, b) => b.createdAt - a.createdAt)
    callback(leads)
  })
  return () => off(leadsRef, 'value', listener)
}

export async function updateLeadStatus(
  artistUid: string,
  leadId: string,
  status: Lead['status']
): Promise<void> {
  const leadRef = ref(db, `leadsByArtist/${artistUid}/${leadId}`)
  const snapshot = await get(leadRef)
  if (snapshot.exists()) {
    const parsed = leadSchema.safeParse(snapshot.val())
    const existing = parsed.success ? parsed.data : snapshot.val()
    await set(leadRef, { ...existing, status })
  }
}
