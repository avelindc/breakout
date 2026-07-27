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
 * @param contentType - MIME type of the file
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

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });

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
 * Helper function to generate music upload URLs (cover + audio)
 * @param artistId - Artist ID for file naming
 * @param coverExt - Cover file extension
 * @param audioExt - Audio file extension
 */
export async function generateMusicUploadUrls(
  artistId: string,
  coverExt: string,
  audioExt: string
): Promise<{
  success: boolean;
  cover?: { url: string; path: string };
  audio?: { url: string; path: string };
  error?: string;
}> {
  try {
    const timestamp = Date.now();
    const coverPath = `covers/${artistId}-${timestamp}.${coverExt}`;
    const audioPath = `audio/${artistId}-${timestamp}.${audioExt}`;

    // Generate presigned URLs for both files
    const [coverResult, audioResult] = await Promise.all([
      generateR2PresignedUploadUrl(BUCKET_RELEASES, coverPath, 'image/jpeg'),
      generateR2PresignedUploadUrl(BUCKET_RELEASES, audioPath, 'audio/mpeg'),
    ]);

    if (!coverResult.success) {
      return { success: false, error: `Cover upload URL error: ${coverResult.error}` };
    }

    if (!audioResult.success) {
      return { success: false, error: `Audio upload URL error: ${audioResult.error}` };
    }

    return {
      success: true,
      cover: { url: coverResult.url!, path: coverPath },
      audio: { url: audioResult.url!, path: audioPath },
    };
  } catch (error: any) {
    console.error("Error generating music upload URLs:", error);
    return { success: false, error: error.message || "Failed to generate upload URLs" };
  }
}

/**
 * Get public URLs for music files
 * @param coverPath - Cover file path in R2
 * @param audioPath - Audio file path in R2
 */
export async function getMusicPublicUrls(coverPath: string, audioPath: string) {
  return {
    coverUrl: await getR2PublicUrl(BUCKET_RELEASES, coverPath),
    audioUrl: await getR2PublicUrl(BUCKET_RELEASES, audioPath),
  };
}