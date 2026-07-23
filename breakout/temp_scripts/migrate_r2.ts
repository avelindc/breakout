import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient();

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const BUCKET_ASSETS = process.env.R2_BUCKET_ASSETS || "assets";
const BUCKET_PROFILES = process.env.R2_BUCKET_PROFILES || "profiles";
const BUCKET_RELEASES = process.env.R2_BUCKET_RELEASES || "releases";

const R2_PUBLIC_URL_ASSETS = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_ASSETS || "https://r2-assets.breakoutmusic.online";
const R2_PUBLIC_URL_PROFILES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_PROFILES || "https://r2-profiles.breakoutmusic.online";
const R2_PUBLIC_URL_RELEASES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || "https://r2-releases.breakoutmusic.online";

async function downloadFile(url: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch ${url} - Status: ${res.status}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get("content-type") || "application/octet-stream";
    return { buffer, contentType };
  } catch (err: any) {
    console.error(`Error downloading ${url}:`, err.message);
    return null;
  }
}

async function uploadToR2(bucket: string, key: string, buffer: Buffer, contentType: string): Promise<boolean> {
  try {
    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await r2Client.send(cmd);
    return true;
  } catch (err: any) {
    console.error(`Error uploading to R2 (Bucket: ${bucket}, Key: ${key}):`, err.message);
    return false;
  }
}

function getR2PublicUrl(bucket: string, key: string): string {
  if (bucket === BUCKET_ASSETS) return `${R2_PUBLIC_URL_ASSETS}/${key}`;
  if (bucket === BUCKET_PROFILES) return `${R2_PUBLIC_URL_PROFILES}/${key}`;
  if (bucket === BUCKET_RELEASES) return `${R2_PUBLIC_URL_RELEASES}/${key}`;
  return "";
}

function extractKeyFromSupabaseUrl(url: string, defaultFolder: string): string {
  const parts = url.split("object/public/");
  if (parts.length < 2) return `${defaultFolder}/file-${Date.now()}`;
  
  const pathPart = parts[1];
  const splitPath = pathPart.split("/");
  const keyPart = splitPath.slice(1).join("/");
  
  if (!keyPart) return `${defaultFolder}/file-${Date.now()}`;
  return keyPart;
}

async function migrateField(
  modelName: string,
  field: string,
  bucket: string,
  defaultFolder: string
) {
  console.log(`\n--- Migrating ${modelName}.${field} ---`);
  // @ts-ignore
  const items = await prisma[modelName].findMany({
    where: {
      [field]: {
        contains: "supabase.co",
      },
    },
  });

  console.log(`Found ${items.length} records to migrate.`);

  for (const item of items) {
    const oldUrl = item[field];
    if (!oldUrl) continue;

    console.log(`\nMigrating ID ${item.id}`);
    console.log(`Old URL: ${oldUrl}`);

    const key = extractKeyFromSupabaseUrl(oldUrl, defaultFolder);
    console.log(`R2 Key: ${key}`);

    const downloaded = await downloadFile(oldUrl);
    if (!downloaded) {
      console.log(`Skipping ID ${item.id} due to download failure.`);
      continue;
    }

    const success = await uploadToR2(bucket, key, downloaded.buffer, downloaded.contentType);
    if (success) {
      const newUrl = getR2PublicUrl(bucket, key);
      // @ts-ignore
      await prisma[modelName].update({
        where: { id: item.id },
        data: { [field]: newUrl },
      });
      console.log(`Updated DB: ${newUrl}`);
    }
  }
}

async function main() {
  console.log("Starting Migration...");

  await migrateField("user", "image", BUCKET_PROFILES, "avatars");
  await migrateField("user", "ktpUrl", BUCKET_PROFILES, "ktp");
  await migrateField("artist", "avatarUrl", BUCKET_PROFILES, "avatars");
  
  await migrateField("release", "coverArtworkUrl", BUCKET_RELEASES, "covers");
  await migrateField("track", "audioUrl", BUCKET_RELEASES, "audio");
  
  await migrateField("contract", "pdfUrl", BUCKET_ASSETS, "contracts");
  await migrateField("contract", "signatureUrl", BUCKET_ASSETS, "signatures");
  
  await migrateField("message", "attachment", BUCKET_ASSETS, "messages");
  
  await migrateField("catalogSong", "coverUrl", BUCKET_RELEASES, "covers");
  await migrateField("catalogSong", "audioUrl", BUCKET_RELEASES, "audio");
  
  await migrateField("catalogRph", "coverUrl", BUCKET_RELEASES, "covers");
  await migrateField("catalogKhana", "coverUrl", BUCKET_RELEASES, "covers");
  await migrateField("catalogHalo", "coverUrl", BUCKET_RELEASES, "covers");

  console.log("\nMigration Completed!");
  await prisma.$disconnect();
}

main().catch(console.error);
