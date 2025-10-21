# Firebase Storage Setup - Quick Reference

## ✅ COMPLETED: CORS Configuration

Your Firebase Storage CORS has been successfully configured for:
- ✅ `http://localhost:3000` (local development)
- ✅ `https://www.inkmatching.com` (production)
- ✅ `https://*.vercel.app` (preview deployments)

**Bucket**: `gs://superapp-699a9.firebasestorage.app`

## What This Fixes

CORS (Cross-Origin Resource Sharing) was blocking browser requests to Firebase Storage from your web app. Now uploads and downloads will work from all your domains.

## Verify CORS is Working

1. Visit https://www.inkmatching.com/stencils
2. Try uploading an image
3. CORS errors should be gone from browser console

## If You Need to Update CORS Later

```bash
# Edit cors.json to add/remove domains
# Then re-apply:
gsutil cors set cors.json gs://superapp-699a9.firebasestorage.app

# Verify:
gsutil cors get gs://superapp-699a9.firebasestorage.app
```

## Next: Set Storage Rules

**IMPORTANT**: CORS only allows the request—you still need Storage Rules for authorization.

1. Go to Firebase Console → Storage → Rules
2. Copy content from `storage.rules` in your repo:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /stencils/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       match /publicCovers/{userId}.{extension} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```
3. Click **Publish**

## Troubleshooting

### Still seeing CORS errors?
- Wait 1-2 minutes for CORS cache to clear
- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check that you're on the correct domain (www.inkmatching.com, not a preview URL)

### Upload fails with 403?
- Storage Rules are not set or blocking you
- Follow "Next: Set Storage Rules" above

### Upload fails with retry-limit?
- Check that `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` env var is correctly set in Vercel
- Should be: `superapp-699a9.firebasestorage.app` OR `superapp-699a9.appspot.com`
- Both work (code normalizes them)

## Adding New Domains

If you add a custom domain later:

1. Edit `cors.json`:
   ```json
   {
     "origin": [
       "http://localhost:3000",
       "https://www.inkmatching.com",
       "https://your-new-domain.com",
       "https://*.vercel.app"
     ],
     ...
   }
   ```

2. Re-apply:
   ```bash
   gsutil cors set cors.json gs://superapp-699a9.firebasestorage.app
   ```

---

**Last Updated**: CORS applied successfully on October 21, 2025
**Status**: ✅ Ready for production
