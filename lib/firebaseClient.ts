import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Some users mistakenly paste a Firebase Storage download host (.firebasestorage.app) or a full URL into storageBucket.
// The SDK expects the bucket name only, typically `${projectId}.appspot.com`.
const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

function normalizeBucket(input: string): string | undefined {
  if (!input) return undefined
  // If it's already a bucket name, pass through
  if (/^[a-z0-9\-]+\.appspot\.com$/i.test(input)) return input
  // If user pasted the .firebasestorage.app host, convert to .appspot.com preserving the prefix
  if (/\.firebasestorage\.app$/i.test(input)) {
    return input.replace(/\.firebasestorage\.app$/i, '.appspot.com')
  }
  // If user pasted a googleapis URL, try to extract the bucket after "/b/"
  const bIdx = input.indexOf('/b/')
  if (bIdx !== -1) {
    const rest = input.slice(bIdx + 3)
    const slash = rest.indexOf('/')
    const bucket = slash === -1 ? rest : rest.slice(0, slash)
    if (bucket) return bucket
  }
  // As a last resort, warn and pass through
  if (typeof window !== 'undefined') {
    console.warn('[Firebase] Unexpected storage bucket format:', input)
  }
  return input
}

const normalizedBucket = normalizeBucket(rawBucket)

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: normalizedBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getDatabase(app)
export const storage = getStorage(app)
export default app
