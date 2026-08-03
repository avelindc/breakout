"use server";

import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { 
  r2Client, 
  BUCKET_RELEASES, 
  BUCKET_PROFILES, 
  BUCKET_ASSETS,
  R2_PUBLIC_URL_RELEASES,
  R2_PUBLIC_URL_PROFILES,
  R2_PUBLIC_URL_ASSETS,
  validateR2Config
} from "./r2";

/**
 * Generate presigned upload URL for R2
 * @param bucket - R2 bucket name
 * @param key - File key/path in bucket
 * @param contentType - MIME type of the file (from frontend)
 * @param expiresIn - URL expiration time in seconds (default: 900 = 15 minutes)
 */
export async function generateR2PresignedUploadUrl(
  bucket: string,
  key: string,
  contentType: string,
  expiresIn: number = 900 // 15 minutes
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate R2 configuration
    const validation = validateR2Config();
    if (!validation.isValid) {
      return { success: false, error: `R2 Configuration Error: ${validation.error}` };
    }

    // FIXED: Create PutObjectCommand with exact Content-Type from frontend
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType, // Use exact Content-Type from frontend request
    });

    const signedUrl = await getSignedUrl(r2Client, command, { 
      expiresIn,
      // FIXED: Add explicit signing options for R2 compatibility
      signableHeaders: new Set(['host', 'content-type']),
      unhoistableHeaders: new Set(), // Empty set for R2 compatibility
    });

    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Error generating R2 presigned upload URL:", error);
    return { success: false, error: error.message || "Failed to generate upload URL" };
  }
}

/**
 * Generate presigned download URL for R2
 * @param bucket - R2 bucket name
 * @param key - File key/path in bucket
 * @param expiresIn - URL expiration time in seconds (default: 3600 = 1 hour)
 */
export async function generateR2PresignedDownloadUrl(
  bucket: string,
  key: string,
  expiresIn: number = 3600 // 1 hour
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const validation = validateR2Config();
    if (!validation.isValid) {
      return { success: false, error: `R2 Configuration Error: ${validation.error}` };
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

    return { success: true, url: signedUrl };
  } catch (error: any) {
    console.error("Error generating R2 presigned download URL:", error);
    return { success: false, error: error.message || "Failed to generate download URL" };
  }
}

/**
 * Get public URL for R2 file using custom domain
 * @param bucket - R2 bucket name
 * @param key - File key/path in bucket
 */
export async function getR2PublicUrl(bucket: string, key: string): Promise<string> {
  let baseUrl = "";
  
  switch (bucket) {
    case BUCKET_RELEASES:
      baseUrl = R2_PUBLIC_URL_RELEASES;
      break;
    case BUCKET_PROFILES:
      baseUrl = R2_PUBLIC_URL_PROFILES;
      break;
    case BUCKET_ASSETS:
      baseUrl = R2_PUBLIC_URL_ASSETS;
      break;
    default:
      throw new Error(`Unknown bucket: ${bucket}`);
  }

  if (!baseUrl) {
    throw new Error(`Public URL not configured for bucket: ${bucket}`);
  }

  // Ensure key doesn't start with slash and baseUrl doesn't end with slash
  const cleanKey = key.startsWith('/') ? key.slice(1) : key;
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  return `${cleanBaseUrl}/${cleanKey}`;
}

/**
 * Delete file from R2
 * @param bucket - R2 bucket name
 * @param key - File key/path in bucket
 */
export async function deleteR2File(
  bucket: string, 
  key: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const validation = validateR2Config();
    if (!validation.isValid) {
      return { success: false, error: `R2 Configuration Error: ${validation.error}` };
    }

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await r2Client.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting R2 file:", error);
    return { success: false, error: error.message || "Failed to delete file" };
  }
}

/**
 * Upload file directly to API route (server-side upload)
 * @param file - File object to upload
 * @param uploadType - Type of upload ('cover', 'audio', 'profile', 'asset', etc.)
 * @param artistId - Optional artist ID for file naming
 */
export async function uploadFileToAPI(
  file: File,
  uploadType: string,
  artistId?: string
): Promise<{ success: boolean; url?: string; error?: string; key?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', uploadType);
    if (artistId) {
      formData.append('artistId', artistId);
    }

    // Get the base URL for API calls - server action runs on server so use internal URL
    const baseUrl = process.env.NEXTAUTH_URL 
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
      || 'http://localhost:3000';
    
    const apiUrl = `${baseUrl}/api/upload`;
    
    console.log(`[uploadFileToAPI] Uploading to: ${apiUrl}`);
    console.log(`[uploadFileToAPI] File: ${file.name}, Type: ${uploadType}, Size: ${file.size}`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary
    });

    console.log(`[uploadFileToAPI] Response status: ${response.status}`);
    console.log(`[uploadFileToAPI] Response headers:`, {
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.log(`[uploadFileToAPI] Error response:`, errorData);
      } catch (e) {
        const text = await response.text();
        console.log(`[uploadFileToAPI] Non-JSON error response:`, text);
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${text.substring(0, 100)}` 
        };
      }
      return { 
        success: false, 
        error: errorData.error || `HTTP ${response.status}` 
      };
    }

    let data;
    try {
      data = await response.json();
      console.log(`[uploadFileToAPI] Success response:`, data);
    } catch (e) {
      console.error(`[uploadFileToAPI] Failed to parse JSON response:`, e);
      return { 
        success: false, 
        error: "Invalid JSON response from API" 
      };
    }

    if (!data.success || !data.url) {
      console.error(`[uploadFileToAPI] Response missing success or url:`, data);
      return { 
        success: false, 
        error: "Invalid response format from API" 
      };
    }

    return { 
      success: true, 
      url: data.url,
      key: data.key 
    };
  } catch (error: any) {
    console.error("[uploadFileToAPI] Uncaught error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to upload file" 
    };
  }
}

/**
 * Upload multiple files (cover + audio for music releases)
 * @param coverFile - Cover image file
 * @param audioFile - Audio file
 * @param artistId - Artist ID for file naming
 */
export async function uploadMusicFiles(
  coverFile: File,
  audioFile: File,
  artistId: string
): Promise<{
  success: boolean;
  cover?: { url: string; key: string };
  audio?: { url: string; key: string };
  error?: string;
}> {
  try {
    // Upload both files in parallel
    const [coverResult, audioResult] = await Promise.all([
      uploadFileToAPI(coverFile, 'cover', artistId),
      uploadFileToAPI(audioFile, 'audio', artistId)
    ]);

    if (!coverResult.success) {
      return { success: false, error: `Cover upload failed: ${coverResult.error}` };
    }

    if (!audioResult.success) {
      return { success: false, error: `Audio upload failed: ${audioResult.error}` };
    }

    return {
      success: true,
      cover: { url: coverResult.url!, key: coverResult.key! },
      audio: { url: audioResult.url!, key: audioResult.key! }
    };
  } catch (error: any) {
    console.error("Music files upload error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to upload music files" 
    };
  }
}

/**
 * Get public URLs for uploaded files using their keys
 * @param coverKey - Cover file key from upload response
 * @param audioKey - Audio file key from upload response
 */
export async function getUploadedMusicUrls(coverKey: string, audioKey: string) {
  return {
    coverUrl: await getR2PublicUrl(BUCKET_RELEASES, coverKey),
    audioUrl: await getR2PublicUrl(BUCKET_RELEASES, audioKey),
  };
}