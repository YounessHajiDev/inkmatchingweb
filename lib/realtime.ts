import { ref, push, set, get, onValue, off, update, serverTimestamp } from 'firebase/database'
import { db } from './firebaseClient'
import type { Thread, Message, Lead, UserThread, PublicProfile } from '@/types'

function buildDMId(uid1: string, uid2: string): string {
  const [lower, higher] = [uid1, uid2].sort()
  return `dm_${lower}___${higher}`
}

async function fetchProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await get(ref(db, `publicProfiles/${uid}`))
  if (!snap.exists()) return null
  return snap.val() as PublicProfile
}

function canMessageBetween(a: PublicProfile | null, b: PublicProfile | null): boolean {
  if (!a || !b) return false
  if (a.role === 'admin' || b.role === 'admin') return true
  const roles = new Set([a.role, b.role])
  return roles.has('artist') && roles.has('client')
}

function containsExternalContact(text: string): boolean {
  const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i
  const phonePattern = /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(\d{1,4}\)|\d{1,4})[-.\s]?\d{3}[-.\s]?\d{3,4}\b/
  const socialPattern = /\b(instagram|facebook|whatsapp|telegram|snapchat|tiktok|imessage)\b/i
  return emailPattern.test(text) || phonePattern.test(text) || socialPattern.test(text)
}

async function assertThreadMember(threadId: string, uid: string): Promise<Thread & { members: Record<string, boolean> }> {
  const threadRef = ref(db, `threads/${threadId}`)
  const snapshot = await get(threadRef)
  if (!snapshot.exists()) throw new Error('Thread does not exist')
  const thread = snapshot.val() as Thread & { members: Record<string, boolean> }
  if (!thread.members?.[uid]) throw new Error('Access denied for this thread')
  return thread
}

async function touchIndexes(
  threadId: string,
  memberIds: string[],
  lastMessage: string
): Promise<void> {
  if (memberIds.length === 0) return
  const preview = lastMessage.trim() === '' ? ' ' : lastMessage.slice(0, 300)
  const timestamp = serverTimestamp()
  const updates: Record<string, any> = {}
  memberIds.forEach((uid) => {
    const basePath = `userThreads/${uid}/${threadId}`
    updates[`${basePath}/updatedAt`] = timestamp
    updates[`${basePath}/lastMessage`] = preview
  })
  await update(ref(db), updates)
}

async function ensureLeadForFirstMessage(
  threadId: string,
  senderId: string,
  previewText: string,
  createdAtSeconds: number
): Promise<void> {
  try {
    const threadSnap = await get(ref(db, `threads/${threadId}`))
    if (!threadSnap.exists()) return
    const thread = threadSnap.val()
    if (thread.leadId) return
    const members = thread.members ? Object.keys(thread.members) : []
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
    }

    await set(leadRef, lead)
    await set(ref(db, `threads/${threadId}/leadId`), leadId)
  } catch (error) {
    console.error('ensureLeadForFirstMessage', error)
  }
}

export async function ensureOneToOneThread(
  myUid: string,
  otherUid: string
): Promise<string> {
  const threadId = buildDMId(myUid, otherUid)
  const indexRef = ref(db, `userThreads/${myUid}/${threadId}`)
  const indexSnap = await get(indexRef)
  if (indexSnap.exists()) return threadId

  const [myProfile, otherProfile] = await Promise.all([fetchProfile(myUid), fetchProfile(otherUid)])
  if (!canMessageBetween(myProfile, otherProfile)) {
    throw new Error('Conversations are limited to artists and clients within the platform.')
  }

  const updates: Record<string, any> = {}
  updates[`threads/${threadId}/type`] = 'dm'
  updates[`threads/${threadId}/members/${myUid}`] = true
  updates[`threads/${threadId}/members/${otherUid}`] = true
  updates[`threads/${threadId}/createdAt`] = serverTimestamp()

  const participants = [myUid, otherUid]
  participants.forEach((uid) => {
    const basePath = `userThreads/${uid}/${threadId}`
    updates[`${basePath}/updatedAt`] = serverTimestamp()
    updates[`${basePath}/members/${myUid}`] = true
    updates[`${basePath}/members/${otherUid}`] = true
    updates[`${basePath}/lastMessage`] = ' '
  })

  await update(ref(db), updates)
  return threadId
}

export async function sendText(
  threadId: string,
  text: string,
  senderId: string
): Promise<void> {
  if (!text.trim()) return
  if (containsExternalContact(text)) throw new Error('Sharing contact details is not allowed inside InkMatching.')
  const sanitized = text.trim().slice(0, 2000)
  const thread = await assertThreadMember(threadId, senderId)

  const messagesRef = ref(db, `messages/${threadId}`)
  const messageRef = push(messagesRef)
  const messageId = messageRef.key ?? `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const message = {
    id: messageId,
    senderId,
    createdAt: serverTimestamp(),
    kind: 'text',
    text: sanitized,
  }
  await set(messageRef, message)

  const memberIds = Object.keys(thread.members || {})
  await touchIndexes(threadId, memberIds, sanitized)
  if (!thread.leadId) {
    await ensureLeadForFirstMessage(threadId, senderId, sanitized, Math.floor(Date.now() / 1000))
  }
}

export async function sendImageAttachment(
  threadId: string,
  senderId: string,
  url: string,
  dimensions?: { width?: number; height?: number }
): Promise<void> {
  if (!url) throw new Error('Missing image URL')
  const thread = await assertThreadMember(threadId, senderId)

  const messagesRef = ref(db, `messages/${threadId}`)
  const messageRef = push(messagesRef)
  const messageId = messageRef.key ?? `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const attachment: Record<string, unknown> = {
    id: `att_${Math.random().toString(36).slice(2, 10)}`,
    url,
  }
  if (dimensions?.width) attachment.width = dimensions.width
  if (dimensions?.height) attachment.height = dimensions.height

  const payload = {
    id: messageId,
    senderId,
    createdAt: serverTimestamp(),
    kind: 'image',
    attachments: [attachment],
  }
  await set(messageRef, payload)

  const memberIds = Object.keys(thread.members || {})
  await touchIndexes(threadId, memberIds, '📷')
  if (!thread.leadId) {
    await ensureLeadForFirstMessage(threadId, senderId, '📷', Math.floor(Date.now() / 1000))
  }
}

export async function sendLocationMessage(
  threadId: string,
  senderId: string,
  location: { latitude: number; longitude: number }
): Promise<void> {
  if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    throw new Error('Invalid location payload')
  }
  const thread = await assertThreadMember(threadId, senderId)
  const messagesRef = ref(db, `messages/${threadId}`)
  const messageRef = push(messagesRef)
  const messageId = messageRef.key ?? `loc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

  const payload = {
    id: messageId,
    senderId,
    createdAt: serverTimestamp(),
    kind: 'location',
    location,
  }
  await set(messageRef, payload)

  const memberIds = Object.keys(thread.members || {})
  await touchIndexes(threadId, memberIds, '📍')
  if (!thread.leadId) {
    await ensureLeadForFirstMessage(threadId, senderId, '📍', Math.floor(Date.now() / 1000))
  }
}

export async function subscribeToMessages(
  threadId: string,
  uid: string,
  callback: (messages: Message[]) => void
): Promise<() => void> {
  await assertThreadMember(threadId, uid)
  const messagesRef = ref(db, `messages/${threadId}`)
  const listener = onValue(messagesRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const messages: Message[] = Object.entries(data).map(([id, msg]: [string, any]) => {
      const rawCreated = (msg as any).createdAt
      const createdAt = typeof rawCreated === 'number'
        ? rawCreated
        : typeof rawCreated === 'string'
          ? parseFloat(rawCreated)
          : 0
      return {
        ...(msg as any),
        id,
        createdAt,
      }
    })
    messages.sort((a, b) => a.createdAt - b.createdAt)
    callback(messages)
  })
  return () => off(messagesRef, 'value', listener)
}

export function subscribeToUserThreads(
  uid: string,
  callback: (threads: UserThread[]) => void
): () => void {
  const threadsRef = ref(db, `userThreads/${uid}`)
  const listener = onValue(threadsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const threads: UserThread[] = Object.entries(data).map(([id, thread]: [string, any]) => {
      const updatedAtRaw = (thread as any).updatedAt
      const updatedAt = typeof updatedAtRaw === 'number'
        ? updatedAtRaw
        : typeof updatedAtRaw === 'string'
          ? parseInt(updatedAtRaw, 10)
          : 0
      return {
        ...(thread as any),
        threadId: id,
        updatedAt,
      }
    })
    threads.sort((a, b) => b.updatedAt - a.updatedAt)
    callback(threads)
  })
  return () => off(threadsRef, 'value', listener)
}

export function subscribeToLeads(
  artistUid: string,
  callback: (leads: Lead[]) => void
): () => void {
  const leadsRef = ref(db, `leadsByArtist/${artistUid}`)
  const listener = onValue(leadsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const leads: Lead[] = Object.entries(data).map(([id, lead]: [string, any]) => ({ id, ...(lead as any) }))
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
    await set(leadRef, { ...(snapshot.val() as any), status })
  }
}
