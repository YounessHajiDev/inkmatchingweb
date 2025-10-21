import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

let app

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const hasServiceAccount = Boolean(serviceAccountJson)
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  const rawBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  const storageBucket = rawBucket && rawBucket.includes('firebasestorage.app')
    ? `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
    : rawBucket

  if (!databaseURL) {
    throw new Error(
      'Missing NEXT_PUBLIC_FIREBASE_DATABASE_URL environment variable. ' +
      'Please add it to your Vercel environment variables or .env.local file. ' +
      'Format: https://your-project-default-rtdb.firebaseio.com'
    )
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
