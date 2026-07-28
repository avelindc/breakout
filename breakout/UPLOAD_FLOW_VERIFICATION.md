# Server-Side R2 Upload Flow Verification

## Overview
This document verifies the complete server-side upload flow implementation for the breakout music distribution platform.

## Upload Flow Architecture

### 1. Frontend (UploadForm.tsx)
**Step 1: File Selection**
- User selects cover artwork (image) and audio file (MP3/WAV)
- Files are validated on client-side for type and size

**Step 2: Server-Side Upload via API Route**
```typescript
const uploadFormData = new FormData();
uploadFormData.append("cover", coverFile);
uploadFormData.append("audio", audioFile);
uploadFormData.append("artistId", primaryArtistId);

uploadRes = await uploadMusicFilesAction(uploadFormData);
```
- Calls `uploadMusicFilesAction` from server action `src/app/actions/upload.ts`
- Returns: `{ success: true, cover: { url, key }, audio: { url, key } }`

**Step 3: Metadata Submission**
- After successful file uploads, submits metadata to database
- Includes the returned URLs directly in the metadata object
- No more presigned URLs or browser PUT requests

### 2. Server Actions (src/app/actions/upload.ts)

#### uploadMusicFilesAction
```typescript
export async function uploadMusicFilesAction(formData: FormData) {
  // 1. Validate authentication
  // 2. Extract cover and audio files from FormData
  // 3. Call uploadMusicFiles() helper function
  // 4. Returns URLs and keys from successful R2 upload
}
```

#### submitMusicMetadataAction
```typescript
export async function submitMusicMetadataAction(data: any) {
  // 1. Validate authentication
  // 2. Validate artist ownership
  // 3. Create Release and Track records in Prisma
  // 4. Save coverArtworkUrl and audioUrl from API response
  // 5. Send Telegram notification
  // 6. Return release ID
}
```

### 3. Helper Functions (src/lib/r2-helpers.ts)

#### uploadFileToAPI
```typescript
export async function uploadFileToAPI(
  file: File,
  uploadType: string,
  artistId?: string
): Promise<{ success: boolean; url?: string; error?: string; key?: string }>
```
- Sends file to `/api/upload` endpoint via multipart/form-data
- Passes upload type ('cover', 'audio', 'profile', 'cms', etc.)
- Returns public URL with custom domain

#### uploadMusicFiles
```typescript
export async function uploadMusicFiles(
  coverFile: File,
  audioFile: File,
  artistId: string
): Promise<{
  success: boolean;
  cover?: { url: string; key: string };
  audio?: { url: string; key: string };
  error?: string;
}>
```
- Uploads both files in parallel
- Returns both URLs for database storage

### 4. API Route (src/app/api/upload/route.ts)

#### POST /api/upload
```typescript
export async function POST(req: NextRequest) {
  // 1. Authenticate via auth() session
  // 2. Parse multipart form data
  // 3. Validate file type based on uploadType
  // 4. Validate file size limits
  // 5. Generate unique filename with timestamp
  // 6. Upload to R2 using AWS SDK PutObjectCommand
  // 7. Generate public URL using custom domain
  // 8. Return { success, url, key, bucket, size, type, filename }
}
```

**Supported Upload Types:**
- `cover`: Images (JPEG, PNG, WebP) → `BUCKET_RELEASES/covers/`
- `audio`: Audio (MP3, WAV) → `BUCKET_RELEASES/audio/`
- `profile`: Images (JPEG, PNG, WebP) → `BUCKET_PROFILES/avatars/`
- `cms`/`asset`: Images → `BUCKET_ASSETS/cms/`
- `brand`: Images → `BUCKET_ASSETS/brand/`
- `message`: Images or PDFs → `BUCKET_ASSETS/messages/`
- `contract`: Images → `BUCKET_ASSETS/contracts/`

**File Size Limits:**
- Images: 10 MB
- Audio: 100 MB
- Documents: 5 MB

### 5. R2 Configuration (src/lib/r2.ts)

**Buckets:**
- `nela-releases`: Cover artwork and audio files
- `nela-profiles`: User and artist avatars
- `nela-assets`: CMS assets, brand logos, messages, contracts

**Public URLs (Custom Domains):**
- Assets: `https://assets.breakoutmusic.online/`
- Profiles: `https://profiles.breakoutmusic.online/`
- Releases: `https://releases.breakoutmusic.online/`

## Updated Actions (No Longer Using Supabase Storage or Presigned URLs)

### 1. profile.ts - updateProfileAction
- ✅ Replaced Supabase storage with `uploadFileToAPI(photoFile, 'profile', user.id)`
- Returns custom domain URL for profile avatars

### 2. settings.ts - uploadBrandLogoAction
- ✅ Replaced Supabase storage with `uploadFileToAPI(logoFile, 'brand')`
- Stores URL in Settings table with key 'brand_logo'

### 3. cmsUpload.ts - uploadCMSImageAction
- ✅ Replaced Supabase storage with `uploadFileToAPI(file, 'cms')`
- Returns custom domain URL for CMS images

### 4. messages.ts - sendMessageAction
- ✅ Replaced Supabase storage with `uploadFileToAPI(attachment, 'message')`
- Stores URL in Message.attachment field

### 5. auth.ts - getContractUploadUrlsAction & finalizeContractAction
- ✅ Updated to use API route via `uploadFileToAPI(file, 'contract')`
- Stores signature and PDF URLs in Contract records

### 6. catalog.ts - createCatalogSongAction & updateCatalogSongAction
- ✅ Replaced Supabase storage with `uploadFileToAPI()` calls
- Uploads cover and audio files to R2

## Verification Checklist

### Code Integration
- [x] API route created at `/api/upload`
- [x] File validation implemented (type and size)
- [x] R2 upload via AWS SDK PutObjectCommand
- [x] Custom domain URLs returned
- [x] Helper functions in r2-helpers.ts
- [x] All server actions updated
- [x] UploadForm component updated to use API route
- [x] No presigned URLs used
- [x] No direct browser PUT requests
- [x] No Supabase Storage calls in active code

### File Paths Updated
- [x] `src/app/api/upload/route.ts` - API route implementation
- [x] `src/lib/r2-helpers.ts` - Helper functions
- [x] `src/app/actions/upload.ts` - Music upload actions
- [x] `src/app/actions/profile.ts` - Profile photo upload
- [x] `src/app/actions/settings.ts` - Brand logo upload
- [x] `src/app/actions/cmsUpload.ts` - CMS image upload
- [x] `src/app/actions/messages.ts` - Message attachment upload
- [x] `src/app/actions/auth.ts` - Contract upload
- [x] `src/app/actions/catalog.ts` - Catalog upload
- [x] `src/components/UploadForm.tsx` - Frontend component
- [x] `breakout/.env` - Environment variables

### Build Status
- [x] `npm run build` - Successful compilation
- [x] No TypeScript errors
- [x] All imports resolved correctly
- [x] All exports available

### Database Integration
- [x] Release.coverArtworkUrl - Stores custom domain URL
- [x] Track.audioUrl - Stores custom domain URL
- [x] User.image - Stores profile avatar custom domain URL
- [x] Artist.avatarUrl - Synced from User.image
- [x] Settings.value (brand_logo) - Stores brand logo custom domain URL
- [x] Message.attachment - Stores attachment custom domain URL
- [x] Contract.pdfUrl & signatureUrl - Store custom domain URLs

## Benefits of Server-Side Upload

1. **CORS Eliminated**: No browser CORS issues - server handles all R2 communication
2. **Safari Compatible**: Works on Safari iOS (previous issue was Status: 0 errors)
3. **More Secure**: Server validates all file types and sizes before upload
4. **Simpler Flow**: No presigned URLs, no multiple requests
5. **Better Error Handling**: Server can provide detailed error messages
6. **Consistent URLs**: All uploads return custom domain URLs
7. **Easier Rollback**: Can switch storage backends without frontend changes

## Testing Instructions

### Music Upload Flow
1. Navigate to `/dashboard/upload`
2. Fill in metadata (title, genre, language, release date)
3. Select cover artwork and audio file
4. System will:
   - Upload cover to API route → R2 → returns `https://releases.breakoutmusic.online/covers/...`
   - Upload audio to API route → R2 → returns `https://releases.breakoutmusic.online/audio/...`
   - Save both URLs to Release and Track records
5. Verify Release appears in `/dashboard/releases`

### Profile Upload Flow
1. Navigate to user settings/profile page
2. Upload profile photo
3. System will:
   - Upload to API route → R2 → returns `https://profiles.breakoutmusic.online/avatars/...`
   - Store in User.image field
   - Sync to all Artist.avatarUrl records
4. Verify avatar displays on profile and artist pages

### CMS Asset Upload
1. Navigate to `/admin/website-cms`
2. Upload image for CMS content
3. System will:
   - Upload to API route → R2 → returns `https://assets.breakoutmusic.online/cms/...`
4. Verify URL is stored in database

### Brand Logo Upload
1. Navigate to `/admin/settings`
2. Upload brand logo
3. System will:
   - Upload to API route → R2 → returns `https://assets.breakoutmusic.online/brand/...`
   - Store in Settings with key 'brand_logo'
4. Verify logo displays on website

## Environment Variables

```
# Cloudflare R2
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_ASSETS=nela-assets
R2_BUCKET_PROFILES=nela-profiles
R2_BUCKET_RELEASES=nela-releases

# Public URLs (Custom Domains)
NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS=https://assets.breakoutmusic.online
NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES=https://profiles.breakoutmusic.online
NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES=https://releases.breakoutmusic.online
```

## Rollback Plan

If R2 upload fails:
1. Check R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in `.env`
2. Verify bucket names match R2_BUCKET_* environment variables
3. Check custom domain DNS configuration
4. Review server logs for AWS SDK errors

To revert to Supabase Storage (if needed):
- Revert the action files to use Supabase client
- Restore presigned URL generation
- Update UploadForm component to handle presigned URLs
- Revert API route

## Conclusion

✅ Server-side R2 upload implementation is complete and ready for testing.
✅ All required features are implemented.
✅ Build passes without errors.
✅ No CORS issues - browser makes no PUT requests to R2.
✅ Custom domain URLs for all buckets.
