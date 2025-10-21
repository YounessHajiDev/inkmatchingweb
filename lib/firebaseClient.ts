import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Some users mistakenly paste a Firebase Storage download host (.firebasestorage.app) into storageBucket.
// The SDK expects the bucket name, typically `${projectId}.appspot.com`.
const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
const normalizedBucket = rawBucket && rawBucket.includes('firebasestorage.app')
  ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
  : rawBucket

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
