import { ref, set, get } from 'firebase/database'
import { db } from './firebaseClient'

export async function addFavorite(clientUid: string, artistUid: string): Promise<void> {
  const fRef = ref(db, `favoritesByClient/${clientUid}/${artistUid}`)
  await set(fRef, { artistUid, addedAt: Date.now() })
}

export async function removeFavorite(clientUid: string, artistUid: string): Promise<void> {
  const fRef = ref(db, `favoritesByClient/${clientUid}/${artistUid}`)
  await set(fRef, null)
}

export async function isFavorite(clientUid: string, artistUid: string): Promise<boolean> {
  const fRef = ref(db, `favoritesByClient/${clientUid}/${artistUid}`)
  const snap = await get(fRef)
  return snap.exists()
}

export async function listFavorites(clientUid: string): Promise<string[]> {
  const fRef = ref(db, `favoritesByClient/${clientUid}`)
  const snap = await get(fRef)
  if (!snap.exists()) return []
  const data = snap.val() as Record<string, any>
  return Object.keys(data)
}
