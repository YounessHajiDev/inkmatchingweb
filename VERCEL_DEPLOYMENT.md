# Vercel Deployment Guide - InkMatching Web

## Current Build Error Fix

### Error: `Can't determine Firebase Database URL`

**Solution**: Add the missing environment variable to Vercel.

## Required Environment Variables

Go to your Vercel project → Settings → Environment Variables and add ALL of these:

### 1. Firebase Client Configuration (Public - starts with NEXT_PUBLIC_)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

**⚠️ Critical**: `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is REQUIRED for the build to succeed.

**Where to find these values**:
1. Go to Firebase Console → Project Settings
2. Under "Your apps" section → Click on Web app
3. Copy all the config values

### 2. Firebase Admin (Server-side - Secret)

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
```

**Where to get this**:
1. Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Download the JSON file
4. **Important**: Paste the ENTIRE JSON content as a **single line** (no line breaks)
5. Can use this command to convert: `cat serviceAccount.json | tr -d '\n'`

### 3. Stripe Configuration (Secret)

```bash
STRIPE_SECRET_KEY=sk_live_... or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to find**:
- Stripe Dashboard → Developers → API Keys
- Webhook secret: Stripe Dashboard → Developers → Webhooks

### 4. OpenAI API (Secret - for AI stencil generation)

```bash
OPENAI_API_KEY=sk-...
```

**Where to get**:
- https://platform.openai.com/api-keys

## Step-by-Step Deployment

### Option 1: Fix Current Deployment

1. **Go to Vercel Dashboard**
   - Navigate to your project
   - Click "Settings" → "Environment Variables"

2. **Add ALL missing variables**
   - Pay special attention to `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - Make sure no extra spaces or line breaks in values
   - For FIREBASE_SERVICE_ACCOUNT_KEY, ensure it's a single line

3. **Redeploy**
   - Go to "Deployments" tab
   - Click on the failed deployment
   - Click "Redeploy"
   - OR: Push a new commit to trigger rebuild

### Option 2: Fresh Deployment

1. **Prepare `.env.local` file locally** (don't commit this!)
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in all values with your actual credentials

2. **Test build locally**
   ```bash
   npm run build
   ```
   Make sure it completes successfully

3. **Import to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Add all environment variables
   - Deploy

## Verification Checklist

Before deploying, ensure:

- [ ] All 16 environment variables are set in Vercel
- [ ] `NEXT_PUBLIC_FIREBASE_DATABASE_URL` is present and correct
- [ ] `FIREBASE_SERVICE_ACCOUNT_KEY` is on a single line
- [ ] No trailing spaces in variable values
- [ ] Stripe keys match your mode (test/live)
- [ ] OpenAI API key is active

## Post-Deployment Setup

After successful deployment:

### 1. Update Firebase Configuration

**Add Vercel domain to Firebase authorized domains**:
1. Firebase Console → Authentication → Settings
2. Under "Authorized domains", add:
   - `your-project.vercel.app`
   - `your-custom-domain.com` (if applicable)

### 2. Update Stripe Webhooks

**Add Vercel webhook endpoint**:
1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.vercel.app/api/payments/webhook`
3. Select events to listen for
4. Copy the webhook secret to Vercel environment variables

### 3. Test Core Features

- [ ] User authentication (login/signup)
- [ ] Upload stencil
- [ ] Generate AI stencil
- [ ] Send stencil to artist
- [ ] Chat messaging
- [ ] Payment flow (if using Stripe)

### 4. Configure Firebase Storage (Critical for stencils feature)

**Set up CORS** (required for browser uploads):
```bash
# Install Google Cloud SDK if not already installed
brew install --cask google-cloud-sdk  # macOS
# Or download from: https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Apply CORS config (use cors.json from the repo root)
gsutil cors set cors.json gs://your-project-id.firebasestorage.app

# Verify
gsutil cors get gs://your-project-id.firebasestorage.app
```

**Set up Storage Rules** (use `storage.rules` from repo):
1. Firebase Console → Storage → Rules
2. Copy content from `storage.rules` in your repo
3. Click "Publish"

These steps are **required** for the stencils upload/AI generation feature to work.

## Common Issues & Solutions

### Issue: "Module not found" during build
**Solution**: Make sure all dependencies are in `package.json`, not just `devDependencies`

### Issue: Environment variables not working
**Solution**: 
- Redeploy after adding variables (they're not hot-reloaded)
- Make sure to add variables for "Production", "Preview", and "Development" environments

### Issue: Firebase admin fails
**Solution**: 
- Check FIREBASE_SERVICE_ACCOUNT_KEY is properly formatted (single line JSON)
- Verify all Firebase URLs are correct
- Ensure service account has proper permissions

### Issue: Build succeeds but runtime errors
**Solution**: 
- Check Vercel function logs in the dashboard
- Ensure all secret keys are set for production environment
- Verify Firebase rules allow the operations

### Issue: Firebase Storage CORS errors (blocked by CORS policy)
**Symptoms**:
```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/v0/b/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Root Cause**: Firebase Storage CORS is not configured for your domain.

**Solution**:
1. **Install gsutil** (Google Cloud SDK):
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download from: https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   ```

3. **Create `cors.json` file** in your project root:
   ```json
   [
     {
       "origin": ["http://localhost:3000", "https://your-project.vercel.app"],
       "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       "maxAgeSeconds": 3600
     }
   ]
   ```
   Replace `your-project.vercel.app` with your actual Vercel domain.

4. **Apply CORS config** to your Firebase Storage bucket:
   ```bash
   gsutil cors set cors.json gs://your-project-id.appspot.com
   ```
   Replace `your-project-id` with your Firebase project ID.

5. **Verify CORS is set**:
   ```bash
   gsutil cors get gs://your-project-id.appspot.com
   ```

**Note**: This is required for both local development and production. Add all domains you'll deploy to.

### Issue: Firebase Storage "retry-limit-exceeded" or timeouts
**Symptoms**:
```
FirebaseError: Firebase Storage: Max retry time for operation exceeded
```

**Root Cause**: Either incorrect bucket configuration or Storage rules blocking the operation.

**Solution**:

1. **Fix Storage Bucket Variable**:
   - Ensure `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set to the bucket name format:
     ```
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
     ```
   - ❌ **NOT** the download host: `your-project-id.firebasestorage.app`
   - ❌ **NOT** a full URL: `https://firebasestorage.googleapis.com/...`

2. **Configure Storage Security Rules**:
   - Go to Firebase Console → Storage → Rules
   - Add rules to allow authenticated uploads/downloads:
   
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       // Allow authenticated users to upload stencils to their own folder
       match /stencils/{userId}/{allPaths=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Allow authenticated users to upload public covers
       match /publicCovers/{userId}.{extension} {
         allow read: if true;  // Public read
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Default: deny all other access
       match /{allPaths=**} {
         allow read, write: if false;
       }
     }
   }
   ```

3. **Publish the rules** and test uploading a stencil.

4. **If still failing**, check browser console for specific error codes:
   - `403`: Rules are blocking you → adjust rules
   - `CORS`: See CORS solution above
   - `Network error`: Check bucket name format

## Environment-Specific Variables

You can set different values for different environments:

- **Production**: Live site (your-project.vercel.app)
- **Preview**: Pull request previews
- **Development**: Local development (`vercel dev`)

Recommended approach:
- Use test/development keys for Preview
- Use production keys only for Production
- Keep development keys local only

## Build Performance

Current build stats:
- Dependencies: ~624 packages
- Build time: ~30-40 seconds
- Bundle size: Optimized for production

## Support

If deployment fails:
1. Check build logs in Vercel dashboard
2. Verify all environment variables are set
3. Test build locally: `npm run build`
4. Check Firebase and Stripe dashboards for API issues

## Security Notes

- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ Use environment variables in Vercel for all secrets
- ✅ Rotate API keys if accidentally exposed
- ✅ Use Stripe test keys for preview deployments
- ✅ Monitor API usage in Firebase/Stripe/OpenAI dashboards
