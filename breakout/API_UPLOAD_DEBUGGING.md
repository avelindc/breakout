# API Upload Route Debugging Guide

## Comprehensive Logging Added

The `/api/upload` route has been updated with extensive logging to capture all details:

### What Gets Logged

Each upload request gets a unique `requestId` for tracking:
```
[req-1723203425000-abc123] REQUEST STARTED
[req-1723203425000-abc123] AUTHENTICATION
[req-1723203425000-abc123] FORM DATA PARSED
[req-1723203425000-abc123] FILE VALIDATION PASSED
[req-1723203425000-abc123] R2 UPLOAD STARTING
[req-1723203425000-abc123] R2 UPLOAD SUCCESS
[req-1723203425000-abc123] PUBLIC URL GENERATED
[req-1723203425000-abc123] RESPONSE SENT
```

## Log Stages and Information

### 1. REQUEST STARTED
Logs basic request information:
```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/upload",
  "contentType": "multipart/form-data; boundary=...",
  "timestamp": "2026-07-28T15:45:30.123Z"
}
```

### 2. AUTHENTICATION
Logs session information:
```json
{
  "hasSession": true,
  "userId": "user-123abc",
  "userEmail": "user@example.com"
}
```
**Issue**: If `hasSession: false`, the request will fail with 401 Unauthorized.

### 3. FORM DATA PARSED
Logs all form fields:
```json
{
  "entries": [
    {
      "key": "file",
      "type": "File",
      "name": "cover.jpg",
      "size": 2097152,
      "mimeType": "image/jpeg"
    },
    {
      "key": "type",
      "type": "string",
      "value": "cover"
    },
    {
      "key": "artistId",
      "type": "string",
      "value": "artist-456def"
    }
  ]
}
```
**Issues**:
- If `file` entry missing → "No file provided" error
- If `type` entry missing → "Upload type required" error
- If parsing fails → Shows exception details

### 4. FORM FIELDS EXTRACTED
Logs extracted values:
```json
{
  "hasFile": true,
  "fileName": "cover.jpg",
  "fileSize": 2097152,
  "fileMimeType": "image/jpeg",
  "uploadType": "cover",
  "artistId": "artist-456def"
}
```

### 5. VALIDATION RULES SET
Logs the validation rules for this upload type:
```json
{
  "uploadType": "cover",
  "bucket": "nela-releases",
  "folder": "covers",
  "maxSize": 10485760,
  "allowedTypes": ["image/jpeg", "image/jpg", "image/png", "image/webp"]
}
```

### 6. FILE VALIDATION PASSED
File passed type and size checks:
```json
{
  "fileType": "image/jpeg",
  "fileSize": 2097152,
  "fileName": "cover.jpg"
}
```
**Issues**:
- If type not allowed → Shows received vs allowed types
- If too large → Shows received size vs max size

### 7. FILENAME GENERATED
Generated R2 key:
```json
{
  "timestamp": 1723203425000,
  "ext": "jpg",
  "userId": "user-123abc",
  "identifier": "artist-456def",
  "filename": "artist-456def-1723203425000.jpg",
  "key": "covers/artist-456def-1723203425000.jpg"
}
```

### 8. FILE CONVERTED TO BUFFER
File converted to Buffer successfully:
```json
{
  "bufferSize": 2097152,
  "byteLength": 2097152
}
```
**Issue**: If conversion fails → Shows exception details

### 9. R2 COMMAND PREPARED
AWS SDK PutObjectCommand prepared:
```json
{
  "bucket": "nela-releases",
  "key": "covers/artist-456def-1723203425000.jpg",
  "contentType": "image/jpeg",
  "bodySize": 2097152,
  "metadata": {
    "uploaded-by": "user-123abc",
    "upload-type": "cover",
    "original-name": "cover.jpg"
  }
}
```

### 10. R2 UPLOAD STARTING
About to send to R2:
```json
{
  "timestamp": "2026-07-28T15:45:30.456Z"
}
```

### 11. R2 UPLOAD SUCCESS
File uploaded to R2:
```json
{
  "bucket": "nela-releases",
  "key": "covers/artist-456def-1723203425000.jpg",
  "etag": "\"abc123def456\"",
  "statusCode": 200,
  "requestId": "r2-request-id-xyz789"
}
```

### 12. R2 UPLOAD FAILED (if error)
R2 upload failed:
```json
{
  "status": 500,
  "errorName": "AccessDenied",
  "errorCode": "AccessDenied",
  "errorMessage": "Access Denied",
  "errorDetails": "NoSuchKey",
  "metadata": {
    "httpStatusCode": 403,
    "requestId": "r2-request-id"
  }
}
```

**Possible R2 Errors**:
- `AccessDenied` (403) → R2 credentials invalid or no permission
- `NoSuchBucket` (404) → Bucket doesn't exist
- `SignatureDoesNotMatch` (403) → Secret key is wrong
- `InvalidAccessKeyId` (403) → Access key is wrong
- `ServiceUnavailable` (503) → R2 service down
- `RequestTimeTooSkewed` (403) → Server time incorrect

### 13. PUBLIC URL GENERATED
Custom domain URL generated:
```json
{
  "bucket": "nela-releases",
  "key": "covers/artist-456def-1723203425000.jpg",
  "publicUrl": "https://releases.breakoutmusic.online/covers/artist-456def-1723203425000.jpg"
}
```
**Issue**: If generation fails → Shows exception details

### 14. RESPONSE PREPARED
Response object created:
```json
{
  "success": true,
  "url": "https://releases.breakoutmusic.online/covers/artist-456def-1723203425000.jpg",
  "key": "covers/artist-456def-1723203425000.jpg",
  "bucket": "nela-releases",
  "size": 2097152,
  "type": "image/jpeg",
  "filename": "artist-456def-1723203425000.jpg"
}
```

### 15. RESPONSE SENT
Response headers and stats:
```json
{
  "status": 200,
  "contentType": "application/json",
  "bodyLength": 234
}
```

## Uncaught Exception Logging

If any unhandled exception occurs:
```json
{
  "status": 500,
  "errorName": "TypeError",
  "errorMessage": "Cannot read property 'name' of null",
  "errorCode": "ERR_UNKNOWN",
  "stack": "TypeError: Cannot read...\n    at ...",
  "constructor": "TypeError",
  "keys": ["message", "name", "stack", ...]
}
```

## How to View Logs

### In Development (npm run dev)
Logs appear in your terminal/console where you started the dev server.

### In Production (Vercel, etc.)
View logs via your hosting provider's dashboard:
- **Vercel**: Functions → Select function → Logs
- **Other**: Check application logs or stdout

### Log Format Example
```
[2026-07-28T15:45:30.123Z] 📤 UPLOAD API - [req-1723203425000-abc123] REQUEST STARTED
{
  "method": "POST",
  "url": "http://localhost:3000/api/upload",
  "contentType": "multipart/form-data; boundary=..."
}
```

## Common Issues and Solutions

### Issue: "An unexpected response was received from the server"

**Diagnosis Steps**:

1. **Check Logs** - Look for the request ID in logs
2. **Check Status Code** - Should be 200 on success, 400-500 on error
3. **Check Response Type** - Should be valid JSON, not HTML

**Possible Causes**:

#### 1. Authentication Failed (401)
```
[req-...] AUTHENTICATION
{
  "hasSession": false,
  "userId": "NONE"
}
```
**Solution**: Ensure user is logged in before upload

#### 2. No File Provided (400)
```
[req-...] FORM FIELDS EXTRACTED
{
  "hasFile": false,
  "uploadType": "cover"
}
```
**Solution**: Check that file is properly attached to FormData

#### 3. Invalid File Type (400)
```
[req-...] ERROR: INVALID FILE TYPE
{
  "receivedType": "video/mp4",
  "allowedTypes": ["image/jpeg", "image/png", ...]
}
```
**Solution**: Upload correct file type for this upload type

#### 4. File Too Large (400)
```
[req-...] ERROR: FILE TOO LARGE
{
  "receivedSize": 104857600,
  "maxSize": 10485760,
  "maxSizeMB": 10
}
```
**Solution**: Reduce file size or use different upload type

#### 5. R2 Access Denied (403)
```
[req-...] ERROR: R2 UPLOAD FAILED
{
  "errorName": "AccessDenied",
  "errorCode": "AccessDenied",
  "errorMessage": "Access Denied"
}
```
**Solution**: 
- Check R2_ACCESS_KEY_ID is correct
- Check R2_SECRET_ACCESS_KEY is correct
- Check R2 bucket has correct permissions
- Verify R2_ENDPOINT is correct

#### 6. R2 Bucket Not Found (404)
```
[req-...] ERROR: R2 UPLOAD FAILED
{
  "errorName": "NoSuchBucket",
  "errorCode": "NoSuchBucket"
}
```
**Solution**: 
- Check R2_BUCKET_RELEASES, R2_BUCKET_PROFILES, R2_BUCKET_ASSETS exist
- Check bucket names match R2 console

#### 7. Signature Mismatch (403)
```
[req-...] ERROR: R2 UPLOAD FAILED
{
  "errorName": "SignatureDoesNotMatch",
  "errorCode": "SignatureDoesNotMatch"
}
```
**Solution**: 
- Check R2_SECRET_ACCESS_KEY is exactly correct (copy-paste carefully)
- Check R2_ENDPOINT is exactly correct
- Check no extra spaces or quotes

#### 8. Invalid Access Key (403)
```
[req-...] ERROR: R2 UPLOAD FAILED
{
  "errorName": "InvalidAccessKeyId",
  "errorCode": "InvalidAccessKeyId"
}
```
**Solution**: 
- Check R2_ACCESS_KEY_ID is exactly correct
- Verify key hasn't been revoked in R2 dashboard

## Testing the Route

### Using cURL
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@cover.jpg" \
  -F "type=cover" \
  -F "artistId=artist-123"
```

### Using Node.js fetch
```javascript
const formData = new FormData();
formData.append('file', new File(['test'], 'test.jpg', { type: 'image/jpeg' }));
formData.append('type', 'cover');
formData.append('artistId', 'artist-123');

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

console.log('Status:', response.status);
console.log('Response:', await response.json());
```

## Response Examples

### Successful Response (200)
```json
{
  "success": true,
  "url": "https://releases.breakoutmusic.online/covers/artist-123-1723203425000.jpg",
  "key": "covers/artist-123-1723203425000.jpg",
  "bucket": "nela-releases",
  "size": 2097152,
  "type": "image/jpeg",
  "filename": "artist-123-1723203425000.jpg"
}
```

### Failed Response (400/500)
```json
{
  "error": "Failed to upload to R2 storage",
  "errorType": "AccessDenied",
  "errorCode": "AccessDenied",
  "details": "Access Denied",
  "requestId": "req-1723203425000-abc123:r2-request-id-xyz789"
}
```

## Debugging Checklist

- [ ] Check logs for request ID
- [ ] Verify authentication (hasSession: true)
- [ ] Verify file exists in FormData
- [ ] Verify file type is allowed
- [ ] Verify file size is within limit
- [ ] Verify R2 credentials are correct
- [ ] Verify R2 buckets exist
- [ ] Verify DNS/network can reach R2
- [ ] Check response status code (200 = success)
- [ ] Verify response is valid JSON (not HTML error page)

## Summary

With comprehensive logging now in place, you can:
1. Identify exactly where uploads fail
2. See all R2 error codes and messages
3. Verify multipart/form-data parsing
4. Track authentication issues
5. Monitor R2 integration health

Check your server logs after attempting upload to see detailed debug information.
