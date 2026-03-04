import { ref, push, set, get, onValue, off, serverTimestamp } from 'firebase/database'
import { db } from './firebaseClient'
import { assertThreadMember, touchIndexes, fetchProfile } from './threads'
import { ensureLeadForFirstMessage } from './leads'
import { containsExternalContact } from './filters'
import { messageSchema, publicProfileSchema } from './schemas'
import type { Message } from '@/types'

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
  await touchIndexes(threadId, memberIds, '\u{1F4F7}')
  if (!thread.leadId) {
    await ensureLeadForFirstMessage(threadId, senderId, '\u{1F4F7}', Math.floor(Date.now() / 1000), [url])
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
  await touchIndexes(threadId, memberIds, '\u{1F4CD}')
  if (!thread.leadId) {
    await ensureLeadForFirstMessage(threadId, senderId, '\u{1F4CD}', Math.floor(Date.now() / 1000))
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
    const messages: Message[] = Object.entries(data).map(([id, raw]) => {
      const parsed = messageSchema.safeParse(raw)
      if (!parsed.success) {
        return { id, senderId: '', createdAt: 0, kind: 'text' as const }
      }
      return { ...parsed.data, id }
    })
    messages.sort((a, b) => a.createdAt - b.createdAt)
    callback(messages)
  })
  return () => off(messagesRef, 'value', listener)
}

export function subscribeToReceivedStencils(
  artistUid: string,
  callback: (stencils: Array<{ url: string; senderId: string; senderName: string; threadId: string; timestamp: number }>) => void
): () => void {
  const threadsRef = ref(db, `userThreads/${artistUid}`)
  const listener = onValue(threadsRef, async (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }

    const threadIds = Object.keys(snapshot.val())
    const allStencils: Array<{ url: string; senderId: string; senderName: string; threadId: string; timestamp: number }> = []

    for (const threadId of threadIds) {
      try {
        const messagesSnap = await get(ref(db, `messages/${threadId}`))
        if (!messagesSnap.exists()) continue

        const messages = messagesSnap.val()
        for (const [, msg] of Object.entries(messages)) {
          const parsed = messageSchema.safeParse(msg)
          if (!parsed.success) continue
          const message = parsed.data
          if (message.kind === 'image' && message.senderId !== artistUid && message.attachments && message.attachments.length > 0) {
            const senderProfile = await fetchProfile(message.senderId)
            const profileParsed = senderProfile ? publicProfileSchema.safeParse(senderProfile) : null
            const senderName = profileParsed?.success ? profileParsed.data.displayName : 'Client'
            allStencils.push({
              url: message.attachments[0].url,
              senderId: message.senderId,
              senderName: senderName || 'Client',
              threadId,
              timestamp: typeof message.createdAt === 'number' ? message.createdAt : Date.now() / 1000,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching messages for thread:', threadId, error)
      }
    }

    allStencils.sort((a, b) => b.timestamp - a.timestamp)
    callback(allStencils)
  })

  return () => off(threadsRef, 'value', listener)
}
