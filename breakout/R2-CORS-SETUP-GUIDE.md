# 🔧 CLOUDFLARE R2 CORS SETUP GUIDE

## Status: 0 Error Analysis

**Status: 0** in browser indicates **CORS preflight failure**. Your code is correct, but R2 bucket needs proper CORS configuration.

---

## 🚀 STEP-BY-STEP SETUP

### 1. **Create R2 Bucket**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 Object Storage**
2. Click **"Create bucket"**
3. Name: `nela-releases`
4. Location: Choose closest to your users
5. Click **"Create bucket"**

### 2. **Generate R2 API Token**

1. In R2 dashboard → **"Manage R2 API tokens"**
2. Click **"Create API token"**  
3. Configuration:
   - **Permissions**: `Object Read & Write`
   - **Bucket Resources**: `Include - Specific bucket - nela-releases`
   - **Account Resources**: `Include - All accounts`
4. Click **"Create API token"**
5. **Copy and save** the token details:
   - Access Key ID
   - Secret Access Key  
   - Endpoint URL

### 3. **Configure CORS Policy**

1. Go to bucket → **"Settings"** tab
2. Find **"CORS policy"** section
3. Add this configuration:

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
    "Content-Length"
  ],
  "MaxAgeSeconds": 3600
}
```

4. Click **"Save"**

### 4. **Update Environment Variables**

Replace placeholder values in `.env`:

```env
# Replace with your actual values:
R2_ENDPOINT=https://YOUR_ACTUAL_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_actual_access_key_id
R2_SECRET_ACCESS_KEY=your_actual_secret_access_key
```

### 5. **Test Configuration**

```bash
# Test CORS preflight
node test-cors-headers.js

# Test presigned URL generation  
node test-presigned-url.js
```

---

## 🔍 TROUBLESHOOTING

### **Still Getting Status: 0?**

1. **Wait 5-10 minutes** after CORS configuration
2. **Clear browser cache** and restart dev server
3. **Check CORS policy** is saved correctly in R2 dashboard
4. **Verify origins** match exactly (including protocol)

### **403 Forbidden?**

- Check API token permissions
- Verify bucket name is correct
- Ensure token has `Object Read & Write` access

### **404 Not Found?**

- Verify bucket exists and name matches
- Check endpoint URL format
- Ensure account ID is correct in endpoint

### **Network Errors?**

- Test internet connectivity
- Try different network/VPN
- Check if company firewall blocks R2

---

## 🧪 BROWSER DEBUGGING

Open Chrome Dev Tools → **Network** tab:

1. **OPTIONS Request** (CORS preflight):
   - Should return **200 OK**  
   - Headers should include `Access-Control-Allow-*`
   
2. **PUT Request** (File upload):
   - Should return **200 OK**
   - Should upload file to R2

**If OPTIONS returns Status: 0** → CORS not configured
**If PUT returns Status: 0** → CORS headers missing in preflight

---

## ✅ SUCCESS INDICATORS

After proper setup, you should see:

1. **Presigned URL generation**: No errors in server logs
2. **CORS preflight**: OPTIONS request returns 200 OK  
3. **File upload**: PUT request returns 200 OK
4. **Public URL**: Custom domain accessible (releases.nela.com)

---

## 🔐 SECURITY NOTES

- **Presigned URLs** expire in 15 minutes (secure)
- **CORS origins** should be specific in production  
- **Custom domains** hide R2 infrastructure from users
- **API tokens** should have minimal required permissions

---

## 📞 SUPPORT

If still having issues:

1. Check Cloudflare R2 status page
2. Verify all steps completed exactly  
3. Test with minimal CORS policy (`AllowedOrigins: ["*"]`)
4. Enable verbose logging in browser dev tools