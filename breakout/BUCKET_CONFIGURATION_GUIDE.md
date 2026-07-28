# Cloudflare R2 Bucket Configuration Guide

## Issue Found
Saya menggunakan placeholder bucket names (`nela-releases`, `nela-profiles`, `nela-assets`) tanpa memverifikasi nama bucket yang sebenarnya di Cloudflare kamu.

Kamu bilang: **Releases bucket bernama `releases`, bukan `nela-releases`**

## Required Information

Untuk fix ini, saya butuh informasi dari Cloudflare R2 kamu:

### 1. Bucket Names (CRITICAL)
```
R2_BUCKET_RELEASES = ?     (kamu: "releases")
R2_BUCKET_PROFILES = ?     (nama bucket untuk profiles/avatars)
R2_BUCKET_ASSETS = ?       (nama bucket untuk CMS/brand/messages)
```

### 2. R2 API Credentials
```
R2_ENDPOINT = https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID = ?
R2_SECRET_ACCESS_KEY = ?
```

**Cara Mendapatkan:**
1. Login ke Cloudflare Dashboard
2. Go to R2 → Buckets
3. Check exact bucket names
4. Go to R2 → Settings → API Tokens
5. Create or copy existing token credentials

### 3. Custom Domain URLs
```
NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES = https://releases.breakoutmusic.online
NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES = https://profiles.breakoutmusic.online (or custom domain)
NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS = https://assets.breakoutmusic.online
```

## How the Code Currently Works

### Bucket Mapping (src/lib/r2.ts)
```typescript
export const BUCKET_RELEASES = process.env.R2_BUCKET_RELEASES || "nela-releases";
export const BUCKET_PROFILES = process.env.R2_BUCKET_PROFILES || "nela-profiles";
export const BUCKET_ASSETS = process.env.R2_BUCKET_ASSETS || "nela-assets";
```

The defaults (`nela-*`) are fallbacks when env vars are not set. **These should NOT be used in production.**

### Usage in API Route (src/app/api/upload/route.ts)
```typescript
// For cover uploads
bucket = BUCKET_RELEASES;  // Uses R2_BUCKET_RELEASES env var

// For profile uploads
bucket = BUCKET_PROFILES;  // Uses R2_BUCKET_PROFILES env var

// For CMS/brand/message uploads
bucket = BUCKET_ASSETS;    // Uses R2_BUCKET_ASSETS env var
```

## Upload Type → Bucket Mapping

| Upload Type | Bucket | Folder | Example Path |
|------------|--------|--------|--------------|
| `cover` | BUCKET_RELEASES | covers | `releases/covers/artist-123-1723203425000.jpg` |
| `audio` | BUCKET_RELEASES | audio | `releases/audio/artist-123-1723203425000.mp3` |
| `profile` | BUCKET_PROFILES | avatars | `profiles/avatars/user-456-1723203425000.jpg` |
| `cms` | BUCKET_ASSETS | cms | `assets/cms/admin-123-1723203425000.jpg` |
| `brand` | BUCKET_ASSETS | brand | `assets/brand/admin-123-1723203425000.png` |
| `message` | BUCKET_ASSETS | messages | `assets/messages/user-456-1723203425000.pdf` |
| `contract` | BUCKET_ASSETS | contracts | `assets/contracts/user-456-1723203425000.jpg` |

## Current .env Configuration

```bash
# Replace these with YOUR actual bucket names:
R2_BUCKET_ASSETS=nela-assets        # ← WRONG: placeholder
R2_BUCKET_PROFILES=nela-profiles    # ← WRONG: placeholder
R2_BUCKET_RELEASES=nela-releases    # ← WRONG: placeholder (should be "releases")

# Replace with YOUR actual credentials:
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
```

## How to Fix

### Step 1: Get Bucket Names from Cloudflare
1. Go to Cloudflare Dashboard → R2 → Buckets
2. List your buckets and note exact names
3. Examples:
   - `releases` (for music uploads)
   - `profiles` (for user avatars)
   - `assets` (for CMS/brand/messages)

### Step 2: Get R2 Credentials
1. Go to Cloudflare Dashboard → R2 → Settings → API Tokens
2. Create or copy an existing API token
3. Get:
   - **Access Key ID** (starts with something like `6d5f...`)
   - **Secret Access Key** (long string)
   - **Account ID** (in endpoint URL)

### Step 3: Update .env
```bash
# Set correct bucket names
R2_BUCKET_RELEASES=releases
R2_BUCKET_PROFILES=profiles         # or whatever name you have
R2_BUCKET_ASSETS=assets             # or whatever name you have

# Set credentials
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_actual_access_key
R2_SECRET_ACCESS_KEY=your_actual_secret_key

# Keep custom domains as is (or update if different)
NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES=https://releases.breakoutmusic.online
NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES=https://profiles.breakoutmusic.online
NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS=https://assets.breakoutmusic.online
```

### Step 4: Test Upload
1. Start dev server: `npm run dev`
2. Go to `/dashboard/upload`
3. Try uploading a music release
4. Check browser console for logs (should show `[UploadForm]` prefix)
5. Check server logs for upload details (should show `UPLOAD API` prefix)

## Debugging "Gagal Menghubungi Server"

With new logging added, here's what to check:

### Browser Console (Press F12)
Look for logs starting with `[UploadForm]`:
```
[UploadForm] [Tahap 1] Uploading music files to API route...
[UploadForm] Cover: cover.jpg 2097152 image/jpeg
[UploadForm] Audio: track.mp3 10485760 audio/mpeg
[UploadForm] Artist ID: artist-123
[UploadForm] Calling uploadMusicFilesAction...
[UploadForm] uploadMusicFilesAction response: {success: true, cover: {...}, audio: {...}}
```

### Server Logs (Terminal/Vercel)
Look for logs starting with `[req-...]` (unique request ID):
```
[req-1723203425000-abc123] REQUEST STARTED
[req-1723203425000-abc123] AUTHENTICATION
[req-1723203425000-abc123] FORM DATA PARSED
[req-1723203425000-abc123] FILE VALIDATION PASSED
[req-1723203425000-abc123] R2 UPLOAD STARTING
[req-1723203425000-abc123] R2 UPLOAD SUCCESS
[req-1723203425000-abc123] RESPONSE SENT
```

### Common Errors and Fixes

#### Error: "R2_BUCKET_RELEASES is not configured"
- Solution: Set `R2_BUCKET_RELEASES` in .env
- Example: `R2_BUCKET_RELEASES=releases`

#### Error: "NoSuchBucket"
- Solution: Verify bucket name matches Cloudflare exactly
- Check spelling and case

#### Error: "AccessDenied"
- Solution: Verify R2 credentials are correct
- Check if API token has permission to PutObject

#### Error: "SignatureDoesNotMatch"
- Solution: Verify `R2_SECRET_ACCESS_KEY` is exactly correct
- Copy-paste carefully (no extra spaces)

#### Error: "InvalidAccessKeyId"
- Solution: Verify `R2_ACCESS_KEY_ID` is correct
- Check if key hasn't been revoked

#### Error: "An unexpected response was received from the server"
- Check browser console for `[UploadForm]` logs
- Check server logs for `[req-...]` logs
- Look for where the process fails

## Files That Use Buckets

1. **src/lib/r2.ts** - Defines bucket constants
2. **src/app/api/upload/route.ts** - Uses buckets for upload logic
3. **src/lib/r2-helpers.ts** - Uses buckets for URL generation
4. **.env** - Configures bucket names

## What I Did (Explanations)

### Why Default Placeholders?
AWS SDK needs configuration to work. If env vars are missing, the code would crash. So I added sensible defaults (`nela-*`) that:
- Make it clear these are placeholders (prefix `nela`)
- Prevent hard-coding your specific bucket names (security)
- Force developers to set env vars explicitly
- Give clear error messages if config is wrong

### Why No Code Changes for New Buckets?
The code is designed to be **bucket-name agnostic**. It reads bucket names from:
1. Environment variables first (`.env`)
2. Falls back to hardcoded defaults if not set
3. This means you can change bucket names just by updating `.env` without code changes

### Why This Approach?
- ✅ Same code works for development, staging, production
- ✅ No need to recompile for different bucket names
- ✅ Easier to rotate or migrate buckets
- ✅ Secrets stay in `.env` (not in code)

## Next Steps

1. **Provide bucket names and credentials** (from Cloudflare)
2. **Update .env** with actual values
3. **Test upload** and check logs
4. **Share any errors** with `[req-...]` request ID
5. **I'll help debug** the specific R2 issue

## Summary

**The code is correct.** The defaults are just placeholders. Your actual bucket names should go in `.env` file, not in code. This is the standard way to handle configuration in production applications.
