import { S3Client } from "@aws-sdk/client-s3";

// Initialize R2 Client with proper configuration
export const r2Client = new S3Client({
  region: "auto", // R2 uses "auto" region
  endpoint: process.env.R2_ENDPOINT || "",
  forcePathStyle: true, // Required for R2
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  // Disable AWS flexible checksums which can break Cloudflare R2 presigned URLs
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// Bucket configurations
export const BUCKET_ASSETS = process.env.R2_BUCKET_ASSETS || "nela-assets";
export const BUCKET_PROFILES = process.env.R2_BUCKET_PROFILES || "nela-profiles";
export const BUCKET_RELEASES = process.env.R2_BUCKET_RELEASES || "nela-releases";

// Public URLs for buckets (using custom domains for security)
export const R2_PUBLIC_URL_ASSETS = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS || "";
export const R2_PUBLIC_URL_PROFILES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES || "";
export const R2_PUBLIC_URL_RELEASES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || "";

// Validate R2 configuration
export function validateR2Config(): { isValid: boolean; error?: string } {
  if (!process.env.R2_ENDPOINT) {
    return { isValid: false, error: "R2_ENDPOINT is not configured" };
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    return { isValid: false, error: "R2_ACCESS_KEY_ID is not configured" };
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    return { isValid: false, error: "R2_SECRET_ACCESS_KEY is not configured" };
  }
  if (!R2_PUBLIC_URL_RELEASES) {
    return { isValid: false, error: "NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES is not configured" };
  }
  return { isValid: true };
}
