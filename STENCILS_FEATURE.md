# Stencils Feature

## Overview
The Stencils page allows users to upload their own tattoo stencil images or generate them using AI (DALL-E 3).

## Features

### 1. **Upload Stencils**
- Users can upload images (PNG, JPG, etc.)
- Stored in Firebase Storage under `stencils/{uid}/`
- Automatically displayed in a responsive grid

### 2. **AI Generation**
- Generate tattoo stencils using OpenAI's DALL-E 3
- Users describe what they want in a text prompt
- AI creates black and white line art suitable for tattoos
- Generated images are automatically saved to Firebase Storage

### 3. **View & Preview**
- Click any stencil to view it in full screen
- Responsive grid layout (2-4 columns based on screen size)
- Thumbnail view with hover effects

## Setup Requirements

### Environment Variables
Add to your `.env.local`:

```bash
# OpenAI API Key (required for AI generation)
OPENAI_API_KEY=sk-...

# Firebase Storage Bucket (required)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### Dependencies
Already included in `package.json`:
- `firebase` - Firebase Storage for file uploads
- `firebase-admin` - Server-side storage operations
- `@heroicons/react` - UI icons

## API Endpoints

### POST `/api/stencils/generate`
Generates a tattoo stencil using AI.

**Request Body:**
```json
{
  "uid": "user-id",
  "prompt": "A minimalist dragon wrapped around a sword"
}
```

**Response:**
```json
{
  "url": "https://storage.googleapis.com/...",
  "message": "Stencil generated successfully"
}
```

## File Structure

```
app/
  stencils/
    page.tsx                          # Main stencils page with UI
  api/
    stencils/
      generate/
        route.ts                      # AI generation endpoint

lib/
  stencils.ts                         # Client-side stencil functions
  firebaseAdmin.ts                    # Admin SDK with storage
```

## Usage Flow

1. **User visits `/stencils`**
2. **Choose option:**
   - Click "Generate with AI" → Enter prompt → AI creates stencil
   - Click "Upload" → Select file → Instant upload
3. **Stencil appears in grid**
4. **Click to preview full size**

## AI Prompt Tips
For best results, prompts should include:
- Subject/theme (e.g., "dragon", "rose", "geometric pattern")
- Style (e.g., "minimalist", "traditional", "tribal")
- Details (e.g., "wrapped around a sword", "with thorns")
- Specification: "black and white line art for tattoo stencil"

Example: "A minimalist dragon wrapped around a sword, black and white line art suitable for a tattoo stencil"

## Next Steps for Sending to Artists

To complete the flow of sending stencils to artists, you would need to:

1. Add a "Send to Artist" button in the stencil preview modal
2. Create a selection mechanism to choose which artist
3. Integrate with your chat or messaging system
4. Optionally attach stencils to booking requests

## Cost Considerations

- **DALL-E 3 pricing:** ~$0.04 per 1024x1024 image (standard quality)
- **Firebase Storage:** Free tier includes 5GB storage, 1GB/day downloads
- Consider implementing rate limiting for AI generation

## Security Notes

- User authentication required (checked via `useAuth`)
- Files scoped by user ID (`stencils/{uid}/`)
- API key stored server-side only
- Consider adding file size limits
- Consider adding content moderation for AI prompts
