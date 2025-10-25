# Troubleshooting Vercel Deployment Issues

## Why your git push isn't showing up on Vercel

This guide helps you diagnose and fix common issues where pushing to GitHub doesn't trigger a Vercel deployment or doesn't show your latest changes.

---

## Quick Diagnostics Checklist

Run these commands locally to gather diagnostic information:

```bash
# 1. Check your current commit and remote status
git status
git log --oneline -n5
git rev-parse HEAD
git remote -v

# 2. Verify your push reached GitHub
git fetch origin
git log origin/main -n1

# 3. Compare local vs remote
git log HEAD..origin/main --oneline
git log origin/main..HEAD --oneline
```

**Expected result**: Your local `git rev-parse HEAD` should match `git log origin/main -n1` commit SHA.

---

## Common Causes & Solutions

### 1. ⚠️ Vercel Configuration Missing

**Problem**: No `vercel.json` file to configure deployments.

**Solution**: This repository now includes `vercel.json` with proper configuration. Ensure it exists and is committed:

```bash
git add vercel.json .vercelignore
git commit -m "chore: add Vercel configuration"
git push origin main
```

The `vercel.json` file:
- Explicitly enables GitHub integration
- Configures build commands and output directory
- Sets deployment to trigger on pushes to `main` branch
- References environment variables

---

### 2. 🔐 GitHub App Not Connected / Lost Permission

**Problem**: Vercel GitHub App is not installed or lost access to your repository.

**Symptoms**:
- Pushes don't trigger deployments
- Deployments list doesn't show recent commits
- Webhook deliveries failing (404/403)

**Solution**:

1. **Check GitHub App installation**:
   - Go to GitHub → Settings → Applications → Installed GitHub Apps
   - OR Organization Settings → Installed GitHub Apps
   - Verify "Vercel" or "Vercel for Git" is installed

2. **Verify repository access**:
   - Click on the Vercel app
   - Ensure this repository (`inkmatchingweb`) is in the allowed list
   - If not, grant access or choose "All repositories"

3. **Reinstall if needed**:
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Click "Import Git Repository"
   - Follow prompts to reconnect GitHub

4. **Test webhook**:
   - Repository → Settings → Webhooks
   - Find the Vercel webhook (usually `https://api.vercel.com/v1/integrations/webhooks/...`)
   - Click on it → "Recent Deliveries"
   - Look for 200 responses (success)
   - If 404/403 errors, the webhook needs reconnecting

---

### 3. 🌿 Wrong Branch Configuration

**Problem**: Pushing to a branch that Vercel doesn't monitor.

**Solution**:

1. **Check Vercel Production Branch**:
   - Vercel Dashboard → Project → Settings → Git
   - Look for "Production Branch"
   - Default is usually `main` or `master`

2. **Verify which branch you pushed to**:
   ```bash
   git branch -vv
   git log origin/<branch-name> -n1
   ```

3. **Options**:
   - Push to the configured production branch, OR
   - Change Vercel production branch setting, OR
   - Enable Preview Deployments for all branches

**Note**: Feature branch pushes create Preview deployments, not Production deployments.

---

### 4. 🔴 Build Failing (500 errors at runtime)

**Problem**: Build succeeds but site returns 500 errors.

**Symptoms** (as seen in your screenshot):
- Deployment shows "Ready ✓"
- But visiting the site shows "INTERNAL_SERVER_ERROR" or "INVOCATION_FAILED"

**Root Cause**: Missing environment variables or runtime errors.

**Solution**:

1. **Check Vercel Build & Runtime Logs**:
   - Vercel Dashboard → Deployments → Click latest deployment
   - Open "Build Logs" (look for warnings/errors)
   - Open "Runtime Logs" (shows actual error stack trace)

2. **Add Missing Environment Variables**:
   - Vercel Dashboard → Project → Settings → Environment Variables
   - Add ALL required variables (see `.env.local.example`)
   - **CRITICAL**: Set for "Production" environment (not just Preview)

   Required variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_FIREBASE_DATABASE_URL ← Often missing!
   FIREBASE_SERVICE_ACCOUNT_KEY (server-side, single line JSON)
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   STRIPE_PRICE_PRO_MONTHLY
   STRIPE_PRICE_PRO_YEARLY
   STRIPE_PRICE_PREMIUM_MONTHLY
   STRIPE_PRICE_PREMIUM_YEARLY
   PUBLIC_SITE_URL
   OPENAI_API_KEY
   ```

3. **Redeploy after adding variables**:
   - Variables are NOT hot-reloaded
   - Trigger a new deployment:
     ```bash
     git commit --allow-empty -m "trigger redeploy"
     git push origin main
     ```
   - OR click "Redeploy" in Vercel UI

4. **Common runtime errors**:
   - `Can't determine Firebase Database URL` → Add `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - `Firebase Admin initialization failed` → Check `FIREBASE_SERVICE_ACCOUNT_KEY` is single-line JSON
   - `Stripe error` → Verify Stripe keys match environment (test vs live)

---

### 5. 📦 Commit Mismatch (Different SHA in Vercel)

**Problem**: Vercel shows a different commit than what you pushed.

**Example from your case**:
- You pushed commit `19a8e67...`
- Vercel deployed commit `f0f55ba...`

**Possible causes**:
- Vercel deployed an older commit before your push arrived
- CI bot or automation pushed a different commit after yours
- You're looking at a Preview deployment instead of Production
- Cache/CDN showing old content

**Solution**:

1. **Find your commit in Deployments list**:
   - Vercel Dashboard → Deployments
   - Search for your commit SHA or message
   - If not found → Vercel never received it (see #2 above)
   - If found → Click it and check status/logs

2. **Force deploy your commit**:
   ```bash
   # Option A: Push again
   git commit --allow-empty -m "force deploy"
   git push origin main

   # Option B: Use Vercel CLI
   npm i -g vercel
   vercel --prod

   # Option C: Deploy Hook (if configured)
   curl -X POST https://api.vercel.com/v1/integrations/deploy/<HOOK_ID>
   ```

3. **Manual redeploy from Vercel UI**:
   - Find the commit you want → Three dots menu → "Redeploy"

---

### 6. 🌐 Browser/CDN Cache

**Problem**: Deployment succeeded but you still see old content.

**Solution**:

1. **Check deployment-specific URL**:
   - Each Vercel deployment has a unique URL: `https://<project>-<hash>.vercel.app`
   - Click deployment → "Visit" → This URL bypasses CDN
   - If this shows new content but production URL doesn't, it's a cache issue

2. **Hard refresh browser**:
   - Chrome/Firefox: Ctrl+Shift+R (Cmd+Shift+R on Mac)
   - Or open in Incognito/Private mode

3. **Purge Vercel cache**:
   - Not usually needed, but can help
   - Redeploy → Vercel automatically purges on new deployments

---

### 7. 🔧 Monorepo / Root Directory Mismatch

**Problem**: Your app is in a subfolder but Vercel builds the wrong directory.

**Check**:
- Vercel Dashboard → Settings → General → Root Directory
- Should be empty (for root) or the subfolder name (e.g., `apps/web`)

**This project**: Root directory should be empty (project is at repo root).

---

### 8. 🚧 CI Blocking Deployments

**Problem**: Required GitHub checks must pass before Vercel deploys.

**Check**:
- Go to your GitHub commit → Check status icons
- If checks are running/failing, Vercel may wait
- Review branch protection rules in GitHub repo settings

---

## Force Deployment Options

If all else fails, force a deployment:

### Option 1: Empty commit
```bash
git commit --allow-empty -m "chore: trigger Vercel deployment"
git push origin main
```

### Option 2: Vercel CLI
```bash
npm i -g vercel
cd /path/to/project
vercel --prod
```

### Option 3: Deploy Hook
1. Vercel Dashboard → Settings → Git → Deploy Hooks
2. Create a hook for `main` branch
3. Copy the URL
4. Trigger:
   ```bash
   curl -X POST <your-hook-url>
   ```

### Option 4: Manual Redeploy
1. Vercel Dashboard → Deployments
2. Find the commit you want
3. Click "..." → "Redeploy"

---

## Verification After Fix

Once you've applied fixes, verify:

```bash
# 1. Confirm commit is on GitHub
git fetch origin
git log origin/main -n1

# 2. Wait 30-60 seconds, then check Vercel
# Go to Vercel Dashboard → Deployments
# Your commit SHA should appear in the list

# 3. Check build logs for errors
# Click deployment → "Build Logs" → Look for red errors

# 4. Check runtime logs if 500 errors
# Click deployment → "Runtime Logs" → Look for stack traces

# 5. Visit deployment URL (not production domain)
# Use the deployment-specific URL to bypass cache
```

---

## Environment Variables Setup

**Critical**: All these must be set in Vercel for Production:

```bash
# Firebase (Public - exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Firebase Admin (Secret - server-only)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Stripe (Secret)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Prices
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_PREMIUM_MONTHLY=price_...
STRIPE_PRICE_PREMIUM_YEARLY=price_...

# Site config
PUBLIC_SITE_URL=https://your-domain.vercel.app

# OpenAI
OPENAI_API_KEY=sk-...
```

**How to add**:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add each variable → Select "Production" (and optionally Preview/Development)
3. Click "Save"
4. Redeploy for changes to take effect

**Tips**:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Paste entire JSON as single line (no line breaks)
- Use test keys for Preview, production keys for Production
- Verify URLs have correct format (no trailing slashes, correct protocol)

---

## Post-Deployment Configuration

After successful deployment:

### 1. Authorize Vercel domain in Firebase
- Firebase Console → Authentication → Settings → Authorized domains
- Add: `your-project.vercel.app` and any custom domains

### 2. Configure Firebase Storage CORS
```bash
gcloud auth login
gsutil cors set storage.cors.json gs://your-project.appspot.com
```

See `README.md` for detailed CORS setup.

### 3. Add Stripe webhook
- Stripe Dashboard → Developers → Webhooks
- Add endpoint: `https://your-project.vercel.app/api/payments/webhook`
- Select events, copy webhook secret to Vercel env vars

---

## Getting Help

If issues persist after following this guide:

### Information to provide:
```bash
# Run these and share outputs:
git remote -v
git branch -vv
git rev-parse HEAD
git log origin/main -n1
```

**Also share**:
- Vercel project URL or screenshot of Deployments page
- Commit SHA you expect to be live
- Build logs (if build failing)
- Runtime logs (if 500 errors)
- Screenshot of Environment Variables page (hide values!)

### Quick test:
```bash
# Push empty commit to verify webhook works
git commit --allow-empty -m "test: verify Vercel webhook"
git push origin main

# Wait 30 seconds, check Vercel Deployments for new entry
```

---

## Reference Links

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Git Integration](https://vercel.com/docs/concepts/git)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [GitHub Webhooks](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [Firebase Configuration](https://firebase.google.com/docs/web/setup)

---

## Summary

**Most common fixes**:
1. ✅ Add `vercel.json` (now included in this repo)
2. ✅ Reconnect Vercel GitHub App
3. ✅ Add all environment variables to Vercel
4. ✅ Redeploy after adding env vars
5. ✅ Push to correct branch (check production branch setting)
6. ✅ Force empty commit if webhook stuck

**Always check**:
- Vercel Deployments list for your commit SHA
- Build Logs for errors
- Runtime Logs for 500 errors
- Environment Variables are set for Production
- GitHub webhook recent deliveries show 200 status
