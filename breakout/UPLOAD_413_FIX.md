# Fix: 413 Content Too Large Error

## Problem
Upload was failing with HTTP 413 (Content Too Large) error when uploading music files (9MB cover + 26MB audio = 35MB total).

**Error Message:**
```
POST https://www.breakoutmusic.online/dashboard/upload 413 (Content Too Large)
[UploadForm] uploadMusicFilesAction exception: Error: An unexpected response was received from the server.
```

## Root Cause
The issue was **NOT** the `/api/upload` route or R2 upload itself, but how the files were being passed to the server action:

1. **UploadForm** extracted files from form data
2. **Wrapped them in FormData** and passed to `uploadMusicFilesAction(formData)`
3. **Next.js serialized** the entire FormData payload (35MB+) to send to the server action
4. This serialization hit the body size limit during transmission, even though `bodySizeLimit: "100mb"` was set

The problem was the **FormData wrapper layer** - files shouldn't be wrapped in FormData when passing to a server action that will upload them.

## Solution
Refactored to pass **File objects directly** instead of wrapping in FormData:

### Changes Made

#### 1. `src/components/UploadForm.tsx`
- Extract coverFile, audioFile, primaryArtistId from form data
- **Call server action with raw File objects**: `uploadMusicFilesServerAction(coverFile, audioFile, primaryArtistId)`
- Remove FormData wrapper that caused serialization bloat
- This allows Next.js to transfer files more efficiently

```typescript
// Before: wrapped in FormData
const uploadFormData = new FormData();
uploadFormData.append("cover", coverFile);
uploadFormData.append("audio", audioFile);
uploadFormData.append("artistId", primaryArtistId);
uploadRes = await uploadMusicFilesAction(uploadFormData);

// After: pass Files directly
const { uploadMusicFilesServerAction } = await import("@/app/actions/upload");
uploadRes = await uploadMusicFilesServerAction(coverFile, audioFile, primaryArtistId);
```

#### 2. `src/app/actions/upload.ts`
- **Renamed** function from `uploadMusicFilesAction` to `uploadMusicFilesServerAction`
- **Changed signature** to accept File objects directly:
  ```typescript
  export async function uploadMusicFilesServerAction(
    coverFile: File,
    audioFile: File,
    artistId: string
  )
  ```
- Removed unused import: `import { uploadMusicFiles } from "@/lib/r2-helpers"`
- Function now receives files ready to upload without deserialization overhead

## Technical Details

### Why This Works
- **Server actions** in Next.js serialize parameters for transmission
- **FormData with large files** gets serialized as multipart form, hitting size limits during serialization
- **File objects** are handled more efficiently by Next.js server actions runtime
- **Direct file parameters** bypass the FormData serialization layer

### Preserved Functionality
- Files still uploaded to R2 with same logic (PutObjectCommand, same buckets, same keys)
- Public URLs still generated with custom domains
- Database integration unchanged
- All error handling preserved
- All logging intact

### Build Verification
✅ Build successful (Exit Code 0)
✅ No TypeScript errors
✅ All routes compiled correctly

## Testing Steps
1. Navigate to /dashboard/upload
2. Fill out music metadata form
3. Select cover image (≥5MB) and audio file (≥10MB)
4. Submit form
5. Expected: Files upload successfully without 413 error

## Related Files
- `src/components/UploadForm.tsx` - Updated to use new function signature
- `src/app/actions/upload.ts` - Updated function signature and parameter handling
- `.env` - R2 credentials and bucket names (unchanged)
- `next.config.ts` - bodySizeLimit already set to "100mb" (unchanged)

## Git Commit
```
commit a3b21b5
fix(upload): solve 413 error by passing File objects directly to server action
```

## Status
✅ Implemented
✅ Built successfully
✅ Committed and pushed to GitHub
⏳ Ready for testing
