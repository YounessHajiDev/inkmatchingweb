# Quick Fix for Vercel Deployment Issues

## 🚨 Emergency Checklist (Do these NOW if deployments aren't working)

### 1. Verify Git Push Reached GitHub
```bash
git fetch origin
git log origin/main -n1
# Compare this SHA with your local: git rev-parse HEAD
```
If they don't match, your push didn't reach GitHub. Run:
```bash
git push origin main -v
```

---

### 2. Force a New Deployment
Try pushing an empty commit to trigger Vercel:
```bash
git commit --allow-empty -m "chore: trigger Vercel deployment"
git push origin main
```

---

### 3. Check Vercel GitHub App
1. Go to: https://github.com/settings/installations
2. Find "Vercel" app
3. Click "Configure"
4. Ensure your repository has access

---

### 4. Verify Environment Variables
**CRITICAL**: These MUST be set in Vercel for Production:

Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

**Required variables** (see `.env.local.example` for full list):
- `NEXT_PUBLIC_FIREBASE_DATABASE_URL` (Most commonly missing!)
- All other `NEXT_PUBLIC_FIREBASE_*` variables
- `FIREBASE_SERVICE_ACCOUNT_KEY` (must be single-line JSON)
- Stripe keys (`STRIPE_SECRET_KEY`, etc.)
- `OPENAI_API_KEY`

After adding variables:
```bash
git commit --allow-empty -m "chore: redeploy with env vars"
git push origin main
```

---

### 5. Check Webhook Status
1. GitHub: Repository → Settings → Webhooks
2. Find Vercel webhook
3. Click on it → "Recent Deliveries"
4. Look for **200 OK** responses
5. If you see 404/403 errors → Reconnect Vercel GitHub App (see step 3)

---

### 6. Verify Production Branch
1. Vercel Dashboard → Project → Settings → Git
2. Check "Production Branch" setting
3. Default should be `main`
4. Ensure you're pushing to this branch:
   ```bash
   git branch
   ```

---

## 🔴 If You See 500 Errors (Site deployed but crashes)

1. **Check Runtime Logs**:
   - Vercel Dashboard → Deployments → Latest → "Runtime Logs"
   - Look for error message

2. **Most likely cause**: Missing environment variables
   - Add them in Vercel (see step 4 above)
   - **Must redeploy** after adding (env vars aren't hot-reloaded)

3. **Common errors**:
   - "Can't determine Firebase Database URL" → Add `NEXT_PUBLIC_FIREBASE_DATABASE_URL`
   - Firebase Admin error → Check `FIREBASE_SERVICE_ACCOUNT_KEY` is single-line JSON
   - Stripe error → Verify keys are correct

---

## ✅ Verify Fix Worked

1. Wait 30-60 seconds after pushing
2. Check Vercel Dashboard → Deployments
3. Your commit SHA should appear with "Building" or "Ready" status
4. Click deployment → Check "Build Logs" for errors
5. Visit deployment URL (not production domain) to test

---

## 📚 Need More Help?

See [TROUBLESHOOTING_VERCEL.md](./TROUBLESHOOTING_VERCEL.md) for detailed diagnostics and solutions.

---

## 🎯 Quick Test Commands

Run these to test if webhook is working:
```bash
# Step 1: Create and commit an empty commit
git commit --allow-empty -m "test: verify Vercel webhook"

# Step 2: Push to trigger deployment
git push origin main

# Step 3: Wait 30 seconds and check Vercel Deployments page
echo "✓ Pushed! Check Vercel Deployments in 30 seconds"
```

**Note**: Breaking these into separate steps makes it easier to identify which step fails if there's an issue.

---

## Key Files Added to Fix This Issue

- ✅ `vercel.json` - Configures Vercel deployments
- ✅ `.vercelignore` - Excludes unnecessary files
- ✅ `TROUBLESHOOTING_VERCEL.md` - Full troubleshooting guide
- ✅ This file - Quick reference

All these files are now committed. Your next push to `main` should trigger a deployment.
