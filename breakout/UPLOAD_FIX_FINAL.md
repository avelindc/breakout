# Upload Fix: Sequential File Uploads

## Problem
Upload was failing with **HTTP 413 Content Too Large** error.

Error message:
```
[Tahap 1] Gagal menghubungi server: An unexpected response was received from the server
POST 413 (Content Too Large)
```

Files: 9MB cover + 26MB audio = 35MB total

## Root Cause
Next.js server actions cannot efficiently pass large File objects. When trying to pass both 35MB files to a server action, the serialization overhead causes the request body to exceed server limits.

## Solution
**Upload files ONE AT A TIME via API route `/api/upload`**

Instead of:
- Upload both files together → 413 error

Now:
1. Upload COVER via `/api/upload` → Get cover URL
2. Upload AUDIO via `/api/upload` → Get audio URL  
3. Submit metadata with both URLs to database

This approach:
- ✅ Avoids serialization overhead
- ✅ Keeps each file upload under size limits
- ✅ Works with existing `/api/upload` route
- ✅ Uses proven multipart/form-data handling
- ✅ R2 upload still server-side (no CORS issues)

## Implementation

### UploadForm.tsx
```typescript
// Upload cover (9MB) - one request
const coverFormData = new FormData();
coverFormData.append("file", coverFile);
coverFormData.append("type", "cover");
const coverRes = await fetch("/api/upload", { method: "POST", body: coverFormData });
const coverUrl = (await coverRes.json()).url;

// Upload audio (26MB) - separate request  
const audioFormData = new FormData();
audioFormData.append("file", audioFile);
audioFormData.append("type", "audio");
const audioRes = await fetch("/api/upload", { method: "POST", body: audioFormData });
const audioUrl = (await audioRes.json()).url;

// Submit metadata with URLs
await submitMusicMetadataAction({ coverUrl, audioUrl, ... });
```

### API Flow
```
Frontend: UploadForm
   ↓
   → Cover file to /api/upload (single file FormData)
   ← Returns: { url: "https://releases.breakoutmusic.online/..." }
   ↓
   → Audio file to /api/upload (single file FormData)
   ← Returns: { url: "https://releases.breakoutmusic.online/..." }
   ↓
Backend: submitMusicMetadataAction
   → Create Release in DB with both URLs
```

## Key Points
- **No server action overhead** - Uses API route which doesn't have serialization limits
- **Sequential uploads** - One file at a time, each under 50MB limit
- **Same R2 backend** - `/api/upload` handles R2 upload with AWS SDK
- **Same database** - Metadata submitted after both files uploaded
- **Same custom domains** - URLs still use assets.breakoutmusic.online, etc.

## Files Changed
- `src/components/UploadForm.tsx` - Changed to sequential fetch requests to `/api/upload`
- No changes to `/api/upload` route (already working)
- No changes to database schema

## Build Status
✅ Build successful (Exit Code 0)

## Git Commits
- `bbebec4` - fix(upload): sequential file uploads via API route to avoid 413 error
- Pushed to: https://github.com/avelindc/breakout

## Next Steps
1. **Wait for deployment** - If on Vercel, wait 1-2 minutes for auto-deploy
2. **Clear browser cache** - Ctrl+Shift+Delete or use incognito
3. **Test upload** - Go to /dashboard/upload and try uploading
4. **Check console** - Look for success logs or any errors

## Expected Behavior
When you upload:
1. See log: "Uploading cover..."
2. See log: "✓ Cover uploaded: https://releases.breakoutmusic.online/..."
3. See log: "Uploading audio..."
4. See log: "✓ Audio uploaded: https://releases.breakoutmusic.online/..."
5. See log: "Calling submitMusicMetadataAction..."
6. Should redirect to /dashboard/releases

## Troubleshooting
If still getting error:
- Clear browser cache completely
- Try in incognito/private mode
- Check if deployment finished (if using Vercel, check deployment status)
- Try smaller files first (1MB cover, 5MB audio)
