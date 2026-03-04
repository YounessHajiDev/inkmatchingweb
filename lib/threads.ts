import { ref, get, set, update, onValue, off, serverTimestamp } from 'firebase/database'
import { db } from './firebaseClient'
import { publicProfileSchema, threadSchema, userThreadSchema, userRecordSchema } from './schemas'
import type { PublicProfile, Thread, UserThread } from '@/types'

// ── Helpers ─────────────────────────────────────────────────────────

export function buildDMId(uid1: string, uid2: string): string {
  const [lower, higher] = [uid1, uid2].sort()
  return `dm_${lower}___${higher}`
}

export async function fetchProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await get(ref(db, `publicProfiles/${uid}`))
  if (!snap.exists()) return null
  const parsed = publicProfileSchema.safeParse({ ...snap.val(), uid })
  if (!parsed.success) {
    console.warn('[threads] Failed to parse profile for', uid, parsed.error.flatten())
    return null
  }
  return parsed.data as PublicProfile
}

export async function ensureDefaultClientProfile(uid: string): Promise<PublicProfile> {
  const existing = await fetchProfile(uid)
  if (existing) return existing

  let role: PublicProfile['role'] = 'client'
  let displayName = 'Client'
  try {
    const uSnap = await get(ref(db, `users/${uid}`))
    if (uSnap.exists()) {
      const parsed = userRecordSchema.safeParse(uSnap.val())
      if (parsed.success) {
        if (parsed.data.role) role = parsed.data.role
        if (parsed.data.displayName) displayName = parsed.data.displayName
      }
    }
  } catch { /* user record may not exist */ }

  const fallback: PublicProfile = {
    uid,
    role,
    displayName,
    city: '',
    styles: '',
    isPublic: role !== 'artist',
  }
  await set(ref(db, `publicProfiles/${uid}`), fallback)
  return fallback
}

export function canMessageBetween(a: PublicProfile | null, b: PublicProfile | null): boolean {
  if (!a || !b) return false
  if (a.role === 'admin' || b.role === 'admin') return true
  const roles = new Set([a.role, b.role])
  return roles.has('artist') && roles.has('client')
}

export async function assertThreadMember(
  threadId: string,
  uid: string
): Promise<Thread & { members: Record<string, boolean> }> {
  const threadRef = ref(db, `threads/${threadId}`)
  const snapshot = await get(threadRef)
  if (!snapshot.exists()) throw new Error('Thread does not exist')
  const parsed = threadSchema.safeParse(snapshot.val())
  if (!parsed.success) throw new Error('Invalid thread data')
  const thread = parsed.data as Thread & { members: Record<string, boolean> }
  if (!thread.members?.[uid]) throw new Error('Access denied for this thread')
  return thread
}

export async function touchIndexes(
  threadId: string,
  memberIds: string[],
  lastMessage: string
): Promise<void> {
  if (memberIds.length === 0) return
  const preview = lastMessage.trim() === '' ? ' ' : lastMessage.slice(0, 300)
  const timestamp = serverTimestamp()
  const updates: Record<string, unknown> = {}
  memberIds.forEach((uid) => {
    const basePath = `userThreads/${uid}/${threadId}`
    updates[`${basePath}/updatedAt`] = timestamp
    updates[`${basePath}/lastMessage`] = preview
  })
  await update(ref(db), updates)
}

// ── Exported Functions ──────────────────────────────────────────────

export async function ensureOneToOneThread(
  myUid: string,
  otherUid: string
): Promise<string> {
  const threadId = buildDMId(myUid, otherUid)
  const indexRef = ref(db, `userThreads/${myUid}/${threadId}`)
  const indexSnap = await get(indexRef)
  if (indexSnap.exists()) return threadId

  const [myProfile, otherProfile] = await Promise.all([
    ensureDefaultClientProfile(myUid),
    fetchProfile(otherUid),
  ])
  if (!canMessageBetween(myProfile, otherProfile)) {
    throw new Error('Conversations are limited to artists and clients within the platform.')
  }

  const updates: Record<string, unknown> = {}
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

export async function deleteChatForUser(threadId: string, uid: string): Promise<void> {
  const thread = await assertThreadMember(threadId, uid)

  // Remove this user's index entry (soft delete)
  await set(ref(db, `userThreads/${uid}/${threadId}`), null)

  // Check if any participant still references this thread
  const memberIds = Object.keys(thread.members || {})
  const snapshots = await Promise.all(
    memberIds.map((m) => get(ref(db, `userThreads/${m}/${threadId}`)))
  )
  const anyLeft = snapshots.some((s) => s.exists())

  if (!anyLeft) {
    await update(ref(db), {
      [`threads/${threadId}`]: null,
      [`messages/${threadId}`]: null,
    })
  }
}

export function subscribeToUserThreads(
  uid: string,
  callback: (threads: UserThread[]) => void
): () => void {
  const threadsRef = ref(db, `userThreads/${uid}`)
  const listener = onValue(threadsRef, (snapshot) => {
    if (!snapshot.exists()) { callback([]); return }
    const data = snapshot.val()
    const threads: UserThread[] = Object.entries(data).map(([id, raw]) => {
      const parsed = userThreadSchema.safeParse(raw)
      if (!parsed.success) {
        return { threadId: id, updatedAt: 0, members: {} }
      }
      return { ...parsed.data, threadId: id }
    })
    threads.sort((a, b) => b.updatedAt - a.updatedAt)
    callback(threads)
  })
  return () => off(threadsRef, 'value', listener)
}
