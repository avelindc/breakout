import { S3Client } from "@aws-sdk/client-s3";

export const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const BUCKET_ASSETS = process.env.R2_BUCKET_ASSETS || "assets";
export const BUCKET_PROFILES = process.env.R2_BUCKET_PROFILES || "profiles";
export const BUCKET_RELEASES = process.env.R2_BUCKET_RELEASES || "releases";

// Public URLs for buckets (e.g. https://pub-<id>.r2.dev or custom domain)
export const R2_PUBLIC_URL_ASSETS = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS || "";
export const R2_PUBLIC_URL_PROFILES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES || "";
export const R2_PUBLIC_URL_RELEASES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || "";
