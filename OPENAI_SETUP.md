# OpenAI API Setup for AI Stencil Generation

## Quick Setup

### 1. Get Your OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Name it (e.g., "InkMatching Production")
5. Copy the key (starts with `sk-`)

### 2. Add to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add a new variable:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your API key (e.g., `sk-proj-...`)
   - **Environments**: Production, Preview, Development

4. Click "Save"
5. Redeploy your application

### 3. Add to Local Development

```bash
# Add to your .env.local file
OPENAI_API_KEY=sk-proj-your-api-key-here
```

## Pricing Information

**DALL-E 3 Pricing** (as of 2024):
- Standard Quality (1024x1024): **$0.040 per image**
- HD Quality (1024x1024): **$0.080 per image**

InkMatching uses **Standard Quality** to keep costs reasonable.

### Cost Examples:
- 10 stencils/day × 30 days = **$12/month**
- 50 stencils/day × 30 days = **$60/month**
- 100 stencils/day × 30 days = **$120/month**

## Usage Limits

OpenAI has rate limits to prevent abuse:

**Free Tier**:
- ~50 requests per day
- ~3 requests per minute

**Paid Tier (after $5+ credit)**:
- 50 requests per minute
- Much higher daily limits

## Testing

To test if your API key is working:

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

If successful, you'll see a list of available models.

## Error Messages

### "OpenAI API key not configured"
- **Cause**: Missing `OPENAI_API_KEY` environment variable
- **Solution**: Add the API key to Vercel environment variables and redeploy

### "Failed to generate image with AI"
- **Possible causes**:
  1. Invalid API key
  2. Insufficient credits/quota
  3. Rate limit exceeded
  4. Content policy violation in prompt
- **Solution**: Check OpenAI dashboard for usage and errors

### "quota exceeded"
- **Cause**: You've reached your OpenAI usage limit
- **Solution**: 
  1. Add credits to your OpenAI account
  2. Wait for limit reset (if on free tier)
  3. Upgrade to paid tier

## Security Best Practices

✅ **DO:**
- Store API key in environment variables only
- Use different API keys for development and production
- Monitor usage in OpenAI dashboard
- Set up billing alerts in OpenAI
- Rotate keys periodically

❌ **DON'T:**
- Commit API keys to Git
- Share API keys in chat/email
- Use production keys in development
- Expose keys in client-side code

## Monitoring Usage

1. Go to https://platform.openai.com/usage
2. View daily/monthly usage
3. Set up billing alerts
4. Track costs per project

## Alternative: Disable AI Generation

If you don't want to use OpenAI, you can:

1. **Hide the AI button** in the UI:
   ```tsx
   // In app/stencils/page.tsx, comment out or remove:
   // <button onClick={() => setShowAIModal(true)}>
   //   Generate with AI
   // </button>
   ```

2. **Or make it optional** - only show if API key is configured

## Optimization Tips

To reduce costs:

1. **Cache common stencils** - Store frequently generated designs
2. **Add rate limiting** - Limit users to X generations per day
3. **Use lower quality** - Already using "standard" quality
4. **Smaller images** - Could use 512x512 instead of 1024x1024 (cheaper)
5. **Prompt optimization** - Better prompts = fewer regenerations

## Support

- OpenAI Documentation: https://platform.openai.com/docs
- API Reference: https://platform.openai.com/docs/api-reference
- Community Forum: https://community.openai.com
- Status Page: https://status.openai.com

## Current Implementation

The AI stencil generation:
- Uses DALL-E 3 model
- Generates 1024x1024 standard quality images
- Optimized prompts for tattoo stencil style
- Automatic Firebase Storage upload
- Error handling with user feedback
