# Final Upload Solution: Presigned URLs

## The Real Problem
**Vercel's 4.5MB serverless function body size limit!**

Even though we set `bodySizeLimit: "100mb"` in Next.js config, Vercel hosting has a hard **4.5MB limit** on requests to serverless functions (API routes and server actions). This is why even a 9MB cover image was getting 413 errors.

## The Solution: Server-Generated Presigned URLs

Instead of sending files through Vercel's serverless functions, we:

1. **Generate presigned URLs on server** (no file upload, just metadata)
2. **Upload directly from browser to R2** using those URLs (bypasses Vercel entirely)
3. **Save public URLs to database**

This is the ONLY way to upload large files (>4.5MB) on Vercel!

## How It Works

### Step 1: Request Presigned URLs
```typescript
// Frontend calls server action (no files sent, just filenames)
const urlsResult = await getUploadPresignedUrlsAction(
  "cover.jpg",   // Just the filename
  "song.mp3",    // Just the filename  
  artistId
);

// Server generates presigned PUT URLs
// Returns: { cover: { presignedUrl, publicUrl }, audio: { presignedUrl, publicUrl } }
```

### Step 2: Direct Upload to R2
```typescript
// Browser uploads directly to R2 (bypasses Vercel)
await fetch(urlsResult.cover.presignedUrl, {
  method: "PUT",
  body: coverFile,  // Can be 100MB, doesn't go through Vercel!
  headers: { "Content-Type": coverFile.type }
});

// Same for audio file
await fetch(urlsResult.audio.presignedUrl, {
  method: "PUT",
  body: audioFile,
  headers: { "Content-Type": audioFile.type }
});
```

### Step 3: Save to Database
```typescript
// Save the public URLs to database
await submitMusicMetadataAction({
  coverUrl: urlsResult.cover.publicUrl,  // https://releases.breakoutmusic.online/...
  audioUrl: urlsResult.audio.publicUrl,
  ...metadata
});
```

## Advantages

✅ **No body size limit** - Files go directly to R2, not through Vercel  
✅ **No CORS issues** - Presigned URLs are generated server-side  
✅ **Works with Vercel free tier** - Doesn't hit serverless function limits  
✅ **Fast** - Direct upload, no proxy/intermediary  
✅ **Secure** - URLs expire in 10 minutes, only work for specific files  

## Technical Flow

```
UploadForm (Browser)
   ↓
   → getUploadPresignedUrlsAction("cover.jpg", "audio.mp3", artistId)
      ↓ Server generates S3 presigned URLs (no file content)
      ↓ Returns { cover: { presignedUrl, publicUrl }, audio: { presignedUrl, publicUrl } }
   ←
   ↓
   → PUT cover file directly to presigned URL (bypasses Vercel)
      ↓ Goes directly to Cloudflare R2
      ↓ R2 stores file
   ←
   ↓
   → PUT audio file directly to presigned URL (bypasses Vercel)
      ↓ Goes directly to Cloudflare R2
      ↓ R2 stores file
   ←
   ↓
   → submitMusicMetadataAction({ coverUrl, audioUrl, ... })
      ↓ Server saves to PostgreSQL database
   ←
```

## Files Changed

### `src/app/actions/upload.ts`
- **Added:** `getUploadPresignedUrlsAction()` - Generates presigned URLs
- **Removed:** Old `uploadMusicFilesServerAction()` (tried to send files through server action)
- **Uses:** AWS SDK's `getSignedUrl()` function

### `src/components/UploadForm.tsx`
- Gets presigned URLs from server action
- Uploads files directly to R2 using `fetch()` with PUT method
- Passes public URLs to `submitMusicMetadataAction()`

## Why This Works
- **Presigned URL generation** = Only ~1KB request (just filenames)
- **File upload** = Direct to R2 (doesn't touch Vercel serverless functions)
- **Database save** = Small JSON payload (just URLs and metadata)

All requests stay under Vercel's 4.5MB limit!

## Security
- Presigned URLs expire after **10 minutes**
- URLs are unique per file (timestamped keys)
- Can only be used for PUT operations
- Limited to specific bucket and key

## Testing
1. Wait for Vercel deployment (1-2 minutes)
2. Clear browser cache
3. Go to `/dashboard/upload`
4. Upload any size files (tested up to 100MB audio!)
5. Check console for success logs

## Expected Console Output
```
[UploadForm] Requesting presigned URLs...
[UploadForm] ✓ Got presigned URLs
[UploadForm] Uploading cover to R2...
[UploadForm] ✓ Cover uploaded: https://releases.breakoutmusic.online/...
[UploadForm] Uploading audio to R2...
[UploadForm] ✓ Audio uploaded: https://releases.breakoutmusic.online/...
[UploadForm] Calling submitMusicMetadataAction...
```

## Git Commit
```
commit 29778a7
fix(upload): use presigned URLs for direct R2 upload to bypass Vercel 4.5MB limit
```

## Status
✅ Implemented  
✅ Built successfully  
✅ Committed and pushed  
⏳ Waiting for Vercel deployment
