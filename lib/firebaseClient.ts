import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// storageBucket expects a bucket name (not a full URL). Valid defaults are typically
// `${projectId}.appspot.com` (legacy) OR `${projectId}.firebasestorage.app` (newer).
// We accept both without forced conversion.
const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

function normalizeBucket(input: string): string | undefined {
  if (!input) return undefined
  // If it's already a bucket name (either scheme), pass through
  if (/^[a-z0-9\-]+\.(appspot\.com|firebasestorage\.app)$/i.test(input)) return input
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

// Export live bindings that are initialized only in the browser. During SSR or build
// time we avoid initializing the Firebase client SDK to prevent invalid-api-key errors
// when NEXT_PUBLIC_FIREBASE_API_KEY is not set in the environment used by the server.
export let auth: any = null
export let db: any = null
export let storage: any = null
export let firebaseApp: any = null
export default firebaseApp

if (typeof window === 'undefined') {
  // Server: provide proxies that throw helpful errors if used.
  const missing = () => {
    throw new Error('[Firebase Client] Browser Firebase SDK is not available on the server. Guard usage with `if (typeof window !== \"undefined\")`.')
  }
  auth = new Proxy({}, { get: () => missing })
  db = new Proxy({}, { get: () => missing })
  storage = new Proxy({}, { get: () => missing })
  firebaseApp = null
} else {
  // Browser: only initialize if an API key is configured. If it's missing, export
  // proxies that throw a clear error so the UI can show a friendly message.
  if (!firebaseConfig.apiKey) {
    const missing = () => {
      throw new Error('[Firebase Client] NEXT_PUBLIC_FIREBASE_API_KEY is missing. Set your Firebase web config in Vercel or .env.local')
    }
    auth = new Proxy({}, { get: () => missing })
    db = new Proxy({}, { get: () => missing })
    storage = new Proxy({}, { get: () => missing })
    firebaseApp = null
  } else {
    firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(firebaseApp)
    db = getDatabase(firebaseApp)
    storage = getStorage(firebaseApp)
  }
}
