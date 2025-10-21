import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

let app

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const hasServiceAccount = Boolean(serviceAccountJson)
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ''

  function normalizeBucket(input: string): string | undefined {
    if (!input) return undefined
    if (/^[a-z0-9\-]+\.appspot\.com$/i.test(input)) return input
    if (/\.firebasestorage\.app$/i.test(input)) {
      return input.replace(/\.firebasestorage\.app$/i, '.appspot.com')
    }
    const bIdx = input.indexOf('/b/')
    if (bIdx !== -1) {
      const rest = input.slice(bIdx + 3)
      const slash = rest.indexOf('/')
      const bucket = slash === -1 ? rest : rest.slice(0, slash)
      if (bucket) return bucket
    }
    return input
  }

  const storageBucket = normalizeBucket(rawBucket)

  if (!databaseURL) {
    throw new Error(
      'Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable. ' +
      'Please add it to your Vercel environment variables or .env.local file. ' +
      'Format: https://your-project-default-rtdb.firebaseio.com'
    )
  }

  if (storageBucket && /\.firebasestorage\.app$/i.test(storageBucket)) {
    // Extra guard in case normalization failed
    console.warn('[Firebase Admin] storageBucket appears to be a host, expected a bucket name like my-project.appspot.com')
  }

  app = initializeApp({
    ...(hasServiceAccount
      ? {
          credential: cert(JSON.parse(serviceAccountJson as string)),
          projectId: JSON.parse(serviceAccountJson as string).project_id,
        }
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }),
    databaseURL,
    storageBucket,
  })
} else {
  app = getApp()
}

export const adminAuth = getAuth(app)
export const adminDb = getDatabase(app)
export const adminStorage = getStorage(app)
