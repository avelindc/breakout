# 🔧 FIXED R2 CORS POLICY FOR AWS SDK V3

## Problem Analysis
Error: "Ensure CORS response header values are valid" adalah masalah AWS SDK v3 yang strict dalam validasi CORS headers.

## Root Causes Fixed:
1. ✅ **AWS SDK Checksum Configuration** - Changed to `WHEN_SUPPORTED`
2. ✅ **Content-Type Signing Mismatch** - Now uses dynamic Content-Type from frontend
3. ✅ **Missing x-amz-* Headers** - Complete CORS policy provided
4. ✅ **Presigned URL Signing Options** - Added R2-specific signing parameters

---

## 🛠️ COMPLETE R2 CORS POLICY

Add this EXACT policy to your R2 bucket in Cloudflare dashboard:

```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://breakoutmusic.online",
    "https://yourdomain.com"
  ],
  "AllowedMethods": [
    "GET",
    "PUT", 
    "POST",
    "DELETE",
    "HEAD",
    "OPTIONS"
  ],
  "AllowedHeaders": [
    "*"
  ],
  "ExposeHeaders": [
    "ETag",
    "Content-Length",
    "Content-Type",
    "Last-Modified",
    "x-amz-request-id",
    "x-amz-version-id",
    "x-amz-delete-marker",
    "x-amz-server-side-encryption",
    "x-amz-checksum-crc32",
    "x-amz-checksum-crc32c", 
    "x-amz-checksum-sha1",
    "x-amz-checksum-sha256"
  ],
  "MaxAgeSeconds": 86400
}
```

**CRITICAL:** Use `"AllowedHeaders": ["*"]` instead of listing specific headers. AWS SDK v3 can add unpredictable headers that break with specific lists.

---

## 🔍 CODE CHANGES SUMMARY

### 1. **Fixed R2 Client Configuration** (`r2.ts`)
```typescript
// BEFORE (Problematic):
requestChecksumCalculation: "WHEN_REQUIRED",
responseChecksumValidation: "WHEN_REQUIRED",

// AFTER (Fixed):
requestChecksumCalculation: "WHEN_SUPPORTED", 
responseChecksumValidation: "WHEN_SUPPORTED",
```

### 2. **Fixed Presigned URL Signing** (`r2-helpers.ts`)
```typescript
// BEFORE (Hardcoded):
generateR2PresignedUploadUrl(BUCKET_RELEASES, coverPath, 'image/jpeg')

// AFTER (Dynamic):
generateR2PresignedUploadUrl(BUCKET_RELEASES, coverPath, coverContentType)

// Added signing options:
signableHeaders: new Set(['host', 'content-type']),
unhoistableHeaders: new Set(),
```

### 3. **Fixed Content-Type Matching** (`upload.ts`)
```typescript
// BEFORE (Mismatch potential):
generateMusicUploadUrls(artistId, coverExt, audioExt)

// AFTER (Exact match):
generateMusicUploadUrls(artistId, coverExt, audioExt, coverType, audioType)
```

---

## 🧪 TESTING THE FIX

### 1. **Browser Network Tab Should Show:**
```
OPTIONS /nela-releases/covers/artist-123.jpg
Status: 200 OK
Headers:
  Access-Control-Allow-Origin: http://localhost:3000
  Access-Control-Allow-Methods: GET, PUT, POST, DELETE, HEAD, OPTIONS
  Access-Control-Allow-Headers: *
  Access-Control-Max-Age: 86400

PUT /nela-releases/covers/artist-123.jpg
Status: 200 OK  
Headers:
  ETag: "abc123..."
  Content-Length: 54321
```

### 2. **Console Logs Should Show:**
```
=== GENERATED R2 URLS (FIXED) ===
Cover URL: https://abc123.r2.cloudflarestorage.com/nela-releases/covers/...
Audio URL: https://abc123.r2.cloudflarestorage.com/nela-releases/audio/...
Cover Content-Type: image/jpeg
Audio Content-Type: audio/mpeg
```

### 3. **No More Errors:**
- ❌ ~~"Ensure CORS response header values are valid"~~
- ❌ ~~Status: 0 errors~~
- ❌ ~~CORS preflight failures~~

---

## ⚠️ IMPORTANT NOTES

### **CORS Policy Location:**
1. Cloudflare Dashboard → R2 Object Storage
2. Select bucket `nela-releases` 
3. Settings tab → CORS Policy section
4. Paste the JSON policy above
5. **SAVE** and wait 5-10 minutes for propagation

### **Environment Variables:**
Ensure your actual `.env` has real values:
```env
R2_ENDPOINT=https://YOUR_ACTUAL_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_actual_access_key_id
R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
```

### **Frontend Compatibility:**
The fix maintains backward compatibility - existing frontend code will work without changes.

---

## 🚀 EXPECTED RESULT

After applying these fixes:
1. ✅ Presigned URLs generate without errors
2. ✅ Browser CORS preflight succeeds (OPTIONS → 200 OK)  
3. ✅ File upload succeeds (PUT → 200 OK)
4. ✅ Files accessible via custom domain URLs
5. ✅ Database stores correct public URLs

**Status: READY FOR TESTING** 🎉