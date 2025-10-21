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
