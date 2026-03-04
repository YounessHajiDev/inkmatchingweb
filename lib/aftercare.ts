import { ref, push, set, get, onValue, off, update } from 'firebase/database'
import { db } from './firebaseClient'
import { aftercareSchema, aftercareIndexSchema } from './schemas'
import type { Aftercare, AftercareStatus } from '@/types'

/**
 * Create a new aftercare plan for a client
 */
export async function createAftercare(
  artistUid: string,
  artistName: string,
  clientUid: string,
  clientName: string,
  data: {
    leadId?: string
    tattooStyle?: string
    tattooLocation?: string
    instructions: { title: string; content: string; day?: number }[]
    generalNotes?: string
    scheduledDays?: number
  }
): Promise<string> {
  const aftercareRef = push(ref(db, `aftercareByClient/${clientUid}`))
  const aftercareId = aftercareRef.key!

  const aftercare: Omit<Aftercare, 'id'> = {
    artistUid,
    artistName,
    clientUid,
    clientName,
    leadId: data.leadId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'active',
    tattooStyle: data.tattooStyle,
    tattooLocation: data.tattooLocation,
    instructions: data.instructions,
    generalNotes: data.generalNotes,
    scheduledDays: data.scheduledDays || data.instructions.length,
    completedDays: 0,
  }

  await set(aftercareRef, aftercare)

  // Also index by artist for artist's view
  await set(ref(db, `aftercareByArtist/${artistUid}/${aftercareId}`), {
    aftercareId,
    clientUid,
    clientName,
    createdAt: aftercare.createdAt,
    status: aftercare.status,
  })

  return aftercareId
}

/**
 * Fetch all aftercare plans for a client
 */
export async function fetchClientAftercares(clientUid: string): Promise<Aftercare[]> {
  const snapshot = await get(ref(db, `aftercareByClient/${clientUid}`))
  if (!snapshot.exists()) return []
  
  const data = snapshot.val()
  const aftercares: Aftercare[] = Object.entries(data).map(([id, raw]) => {
    const parsed = aftercareSchema.safeParse(raw)
    if (!parsed.success) return { id, artistUid: '', artistName: '', clientUid: '', clientName: '', createdAt: 0, updatedAt: 0, status: 'active' as const, instructions: [] }
    return { ...parsed.data, id }
  })
  
  return aftercares.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Fetch all aftercare plans created by an artist
 */
export async function fetchArtistAftercares(artistUid: string): Promise<Aftercare[]> {
  const indexSnap = await get(ref(db, `aftercareByArtist/${artistUid}`))
  if (!indexSnap.exists()) return []
  
  const indices = indexSnap.val()
  const aftercares: Aftercare[] = []
  
  for (const [aftercareId, indexData] of Object.entries(indices)) {
    const parsed = aftercareIndexSchema.safeParse(indexData)
    if (!parsed.success) continue
    const clientUid = parsed.data.clientUid
    const acSnap = await get(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`))
    if (acSnap.exists()) {
      const acParsed = aftercareSchema.safeParse(acSnap.val())
      if (acParsed.success) aftercares.push({ ...acParsed.data, id: aftercareId })
    }
  }
  
  return aftercares.sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * Fetch a single aftercare plan by ID
 */
export async function fetchAftercare(clientUid: string, aftercareId: string): Promise<Aftercare | null> {
  const snapshot = await get(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`))
  if (!snapshot.exists()) return null
  const parsed = aftercareSchema.safeParse(snapshot.val())
  if (!parsed.success) return null
  return { ...parsed.data, id: aftercareId }
}

/**
 * Update aftercare status
 */
export async function updateAftercareStatus(
  clientUid: string,
  aftercareId: string,
  status: AftercareStatus
): Promise<void> {
  await update(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`), {
    status,
    updatedAt: Date.now(),
  })
  
  // Also update artist index
  const acSnap = await get(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`))
  if (acSnap.exists()) {
    const parsed = aftercareSchema.safeParse(acSnap.val())
    if (parsed.success) {
      await update(ref(db, `aftercareByArtist/${parsed.data.artistUid}/${aftercareId}`), { status })
    }
  }
}

/**
 * Mark a day as completed
 */
export async function markDayCompleted(
  clientUid: string,
  aftercareId: string,
  completedDays: number
): Promise<void> {
  await update(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`), {
    completedDays,
    updatedAt: Date.now(),
  })
}

/**
 * Subscribe to client's aftercare updates
 */
export function subscribeToClientAftercares(
  clientUid: string,
  callback: (aftercares: Aftercare[]) => void
): () => void {
  const aftercaresRef = ref(db, `aftercareByClient/${clientUid}`)
  const listener = onValue(aftercaresRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([])
      return
    }
    const data = snapshot.val()
    const aftercares: Aftercare[] = Object.entries(data).map(([id, raw]) => {
      const parsed = aftercareSchema.safeParse(raw)
      if (!parsed.success) return { id, artistUid: '', artistName: '', clientUid: '', clientName: '', createdAt: 0, updatedAt: 0, status: 'active' as const, instructions: [] }
      return { ...parsed.data, id }
    })
    aftercares.sort((a, b) => b.createdAt - a.createdAt)
    callback(aftercares)
  })
  return () => off(aftercaresRef, 'value', listener)
}

/**
 * Update an existing aftercare plan
 */
export async function updateAftercare(
  clientUid: string,
  aftercareId: string,
  updates: Partial<Omit<Aftercare, 'id' | 'artistUid' | 'clientUid' | 'createdAt'>>
): Promise<void> {
  await update(ref(db, `aftercareByClient/${clientUid}/${aftercareId}`), {
    ...updates,
    updatedAt: Date.now(),
  })
}
