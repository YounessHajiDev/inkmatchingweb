import { ref, get, set } from 'firebase/database'
import { db } from './firebaseClient'
import type { PublicProfile, ArtistWithProfile } from '@/types'

function normalizeStyles(styles: string | string[] | undefined): string {
  if (!styles) return ''
  if (typeof styles === 'string') return styles
  return Array.isArray(styles) ? styles.join(', ') : ''
}

function getLatLon(profile: PublicProfile): { lat: number; lon: number } {
  const lat = profile.latitude ?? profile.lat ?? 0
  const lon = profile.longitude ?? profile.lng ?? 0
  return { lat, lon }
}

export async function fetchArtistsOnce(limit: number = 100): Promise<ArtistWithProfile[]> {
  const profilesRef = ref(db, 'publicProfiles')
  const snapshot = await get(profilesRef)
  if (!snapshot.exists()) return []
  const profiles = snapshot.val()
  const artists: ArtistWithProfile[] = []
  Object.entries(profiles).forEach(([uid, data]: [string, any]) => {
    if (data.role === 'artist' && data.isPublic !== false) {
      const { lat, lon } = getLatLon(data as PublicProfile)
      artists.push({
        uid,
        ...(data as any),
        normalizedStyles: normalizeStyles((data as any).styles),
        lat,
        lon,
      })
    }
  })
  return artists.slice(0, limit)
}

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const snapshot = await get(profileRef)
  if (!snapshot.exists()) return null
  return { uid, ...(snapshot.val() as any) }
}

export async function saveMyPublicProfile(
  uid: string,
  input: Partial<PublicProfile>
): Promise<void> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  
  // Remove undefined values - Firebase RTDB doesn't accept undefined
  const cleanedInput = Object.fromEntries(
    Object.entries({ ...input, uid }).filter(([_, v]) => v !== undefined)
  )
  
  await set(profileRef, cleanedInput)
}

export async function deferMyProfileVisibility(uid: string): Promise<void> {
  const profileRef = ref(db, `publicProfiles/${uid}`)
  const snapshot = await get(profileRef)
  if (snapshot.exists()) {
    await set(profileRef, { ...(snapshot.val() as any), isPublic: false })
  }
}
