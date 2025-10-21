# InkMatching Web

A Next.js web application for discovering tattoo artists, connecting via real-time chat, and managing leads.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase Web v10** (Auth, Realtime Database, Storage)
- **MapLibre GL** for interactive maps
- **Zustand** for state management

## Features

- 🔍 **Discover**: Browse and search tattoo artists
- 🗺️ **Map**: View artists on an interactive map
- 💬 **Chat**: Real-time messaging with artists
- 📋 **Leads**: Manage client inquiries (artist accounts)
- 🔐 **Authentication**: Email/password sign-in

## Setup

### 1. Install Dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Configure Firebase
Copy the environment template:
```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your Firebase web credentials.

### 3. Firebase Security Rules (reference)

**Realtime Database Rules**
```json
{
  "rules": {
    "publicProfiles": {
      "$uid": {
        ".read": true,
        ".write": "$uid === auth.uid"
      }
    },
    "threads": {
      "$threadId": {
        ".read": "auth != null && data.child('members').child(auth.uid).exists()",
        ".write": "auth != null && data.child('members').child(auth.uid).exists()"
      }
    },
    "messages": {
      "$threadId": {
        ".read": "auth != null && root.child('threads').child($threadId).child('members').child(auth.uid).exists()",
        ".write": "auth != null && root.child('threads').child($threadId).child('members').child(auth.uid).exists()"
      }
    },
    "userThreads": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "leadsByArtist": {
      "$artistUid": {
        ".read": "$artistUid === auth.uid",
        "$leadId": {
          ".write": "$artistUid === auth.uid || data.child('clientId').val() === auth.uid"
        }
      }
    }
  }
}
```

**Storage Rules**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /publicCovers/{uid}.jpg {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 4. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

## Project Structure
See file tree in this repository.

## Notes
- Map style uses MapLibre demo style. Replace with your own style for production.
- Next/Image is configured to allow any https remote images.
- DM thread IDs are stable: `dm_{lowerUid}___{higherUid}`.
- A lead is auto-created when a **client** sends the first message to an **artist** in a new DM thread.

## Firebase Storage CORS (fix 403/CORS from Vercel)

If you see errors like "CORS policy: Response to preflight request doesn't pass access control check" or uploads failing from your Vercel preview URLs, set the CORS configuration on your Firebase Storage bucket.

1) Ensure your Storage bucket matches the expected format: `<projectId>.appspot.com`. Our client normalizes the value from `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, but the actual bucket in Firebase should be e.g. `superapp-699a9.appspot.com`.

2) Use the provided `storage.cors.json` and apply it with `gsutil`:

```bash
# Install gcloud + gsutil if you don't have it
# https://cloud.google.com/sdk/docs/install

gcloud auth login
gcloud config set project $YOUR_PROJECT_ID

# Apply CORS to your bucket (replace the bucket name)
gsutil cors set storage.cors.json gs://superapp-699a9.appspot.com

# Verify
gsutil cors get gs://superapp-699a9.appspot.com
```

The included `storage.cors.json` allows localhost and Vercel preview/prod (uses `"*"` so all preview subdomains work).

When you’re ready to lock down to your primary domain, use `storage.cors.prod.json` which is restricted to:
- https://inkmatching.com
- https://www.inkmatching.com
- http://localhost:3000 and http://localhost:3001 (for local dev)

Apply the production policy:
```bash
gsutil cors set storage.cors.prod.json gs://superapp-699a9.firebasestorage.app
gsutil cors get gs://superapp-699a9.firebasestorage.app
```

Tip: Firebase Authentication also needs your custom domain whitelisted. In Firebase Console → Authentication → Settings → Authorized domains, add `inkmatching.com` and `www.inkmatching.com`.

## Favicon
We've added a minimal `app/icon.svg` so you won't see 404s for `favicon.ico` anymore. Next.js will serve the SVG as the app icon automatically.
