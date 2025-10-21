# Stencils Feature

## Overview
The Stencils page allows users to upload their own tattoo stencil images or generate them using AI (DALL-E 3), and send them directly to artists through the integrated messaging system.

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
- Thumbnail view with hover effects showing quick actions

### 4. **Send to Artist** ⭐ NEW
- **Direct Send**: Click "Send" button on any stencil thumbnail
- **From Preview**: Open full-screen preview and click "Send to Artist"
- **Artist Selection**: Search and browse available artists
- **Smart Search**: Filter by name, city, or tattoo style
- **Instant Messaging**: Creates/opens chat thread and sends stencil
- **Auto-Navigate**: Redirects to chat after sending

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
    page.tsx                          # Main stencils page with UI & send feature
  api/
    stencils/
      generate/
        route.ts                      # AI generation endpoint

lib/
  stencils.ts                         # Client-side stencil functions
  firebaseAdmin.ts                    # Admin SDK with storage
  publicProfiles.ts                   # Fetch artists for selection
  realtime.ts                         # Chat/messaging integration
```

## Key Integration Points

### With Messaging System
- Uses `ensureOneToOneThread()` to create/get chat thread
- Uses `sendImageAttachment()` to send stencil as message
- Validates artist-client relationship
- Auto-creates lead if first message

### With Artist Discovery
- Fetches artists using `fetchArtistsOnce()`
- Filters by display name, city, and styles
- Shows artist profile pictures and details
- Real-time search filtering

## Usage Flow

### Basic Flow
1. **User visits `/stencils`**
2. **Choose option:**
   - Click "Generate with AI" → Enter prompt → AI creates stencil
   - Click "Upload" → Select file → Instant upload
3. **Stencil appears in grid**
4. **Click to preview full size**

### Sending to Artists Flow
1. **Hover over any stencil** → Click "Send" button
   - OR click stencil to open preview → Click "Send to Artist"
2. **Artist selection modal opens**
   - Browse list of available artists
   - Use search to filter by name, city, or style
   - See artist profile pictures and specialties
3. **Click on artist** to send
4. **Automatically creates/opens chat thread**
5. **Stencil sent as image attachment**
6. **Redirected to chat** to continue conversation

## AI Prompt Tips
For best results, prompts should include:
- Subject/theme (e.g., "dragon", "rose", "geometric pattern")
- Style (e.g., "minimalist", "traditional", "tribal")
- Details (e.g., "wrapped around a sword", "with thorns")
- Specification: "black and white line art for tattoo stencil"

Example: "A minimalist dragon wrapped around a sword, black and white line art suitable for a tattoo stencil"

## Benefits

### For Clients
- **Streamlined Communication**: Send visual references directly to artists
- **No Context Loss**: Stencils preserved in chat history
- **Easy Discovery**: Find the right artist with search filters
- **Visual Portfolio**: Keep all stencil ideas in one place

### For Artists
- **Clear Vision**: Receive client ideas as visual references
- **Professional Flow**: All communication in one platform
- **Better Proposals**: Understand client vision before responding
- **Lead Generation**: First stencil creates automatic lead entry

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
