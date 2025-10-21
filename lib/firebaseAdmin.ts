import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import { getStorage } from 'firebase-admin/storage'

let app

if (getApps().length === 0) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  const hasServiceAccount = Boolean(serviceAccountJson)

  app = initializeApp({
    ...(hasServiceAccount
      ? {
          credential: cert(JSON.parse(serviceAccountJson as string)),
          projectId: JSON.parse(serviceAccountJson as string).project_id,
        }
      : {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
} else {
  app = getApp()
}

export const adminAuth = getAuth(app)
export const adminDb = getDatabase(app)
export const adminStorage = getStorage(app)
