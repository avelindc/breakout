import { PrismaClient } from "@prisma/client";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const R2_ENDPOINT = process.env.R2_ENDPOINT || '';
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';

const r2Client = new S3Client({
  region: "auto",
  endpoint: R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_RELEASES = process.env.R2_BUCKET_RELEASES || "releases";
const R2_PUBLIC_URL_RELEASES = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || '';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function parseSupabaseUrl(url: string) {
  if (!url || !url.includes('supabase.co')) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const publicIndex = pathParts.indexOf('public');
    if (publicIndex !== -1 && pathParts.length > publicIndex + 2) {
      const bucket = pathParts[publicIndex + 1];
      const filePath = pathParts.slice(publicIndex + 2).join('/');
      return { bucket, filePath };
    }
  } catch (e) {
    console.error("Error parsing URL:", url);
  }
  return null;
}

async function migrateCover(releaseId: string, url: string, title: string): Promise<boolean> {
  try {
    const parsed = parseSupabaseUrl(url);
    if (!parsed) {
      console.log(`[Skip] ${title} - bukan Supabase URL`);
      return false;
    }

    const { bucket: supabaseBucket, filePath } = parsed;
    const fileName = filePath.split('/').pop() || 'cover.jpg';
    const r2Key = `covers/${fileName}`;

    console.log(`[Download] ${title}...`);
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      console.log(`[Not Found] ${title} tidak ada di Supabase (${downloadRes.status})`);
      return false;
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer());
    const contentType = downloadRes.headers.get('content-type') || 'image/jpeg';

    console.log(`[Upload] ${title} -> R2 (${BUCKET_RELEASES}/${r2Key})...`);
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    }));

    // Delete from Supabase
    try {
      await supabase.storage.from(supabaseBucket).remove([filePath]);
      console.log(`[Deleted] ${title} dari Supabase`);
    } catch (e: any) {
      console.warn(`[Delete Warning] ${title}:`, e.message);
    }

    // Update DB
    const cleanBase = R2_PUBLIC_URL_RELEASES.endsWith('/') ? R2_PUBLIC_URL_RELEASES.slice(0, -1) : R2_PUBLIC_URL_RELEASES;
    const newUrl = `${cleanBase}/${r2Key}`;
    await prisma.release.update({ where: { id: releaseId }, data: { coverArtworkUrl: newUrl } });
    console.log(`[Updated DB] ${title} -> ${newUrl}`);

    return true;
  } catch (err: any) {
    console.error(`[Error] ${title}:`, err.message);
    return false;
  }
}

async function migrateAudio(trackId: string, url: string, title: string): Promise<boolean> {
  try {
    const parsed = parseSupabaseUrl(url);
    if (!parsed) return false;

    const { bucket: supabaseBucket, filePath } = parsed;
    const fileName = filePath.split('/').pop() || 'audio.mp3';
    const r2Key = `audio/${fileName}`;

    console.log(`[Download Audio] ${title}...`);
    const downloadRes = await fetch(url);
    if (!downloadRes.ok) {
      console.error(`[Download Audio Failed] ${title}: status ${downloadRes.status} ${downloadRes.statusText}`);
      return false;
    }

    const buffer = Buffer.from(await downloadRes.arrayBuffer());
    const contentType = downloadRes.headers.get('content-type') || 'audio/mpeg';

    console.log(`[Upload Audio] ${title} -> R2...`);
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    }));

    try {
      await supabase.storage.from(supabaseBucket).remove([filePath]);
    } catch (e) {}

    const cleanBase = R2_PUBLIC_URL_RELEASES.endsWith('/') ? R2_PUBLIC_URL_RELEASES.slice(0, -1) : R2_PUBLIC_URL_RELEASES;
    const newUrl = `${cleanBase}/${r2Key}`;
    await prisma.track.update({ where: { id: trackId }, data: { audioUrl: newUrl } });
    console.log(`[Updated DB Audio] ${title} -> R2`);

    return true;
  } catch (err: any) {
    console.error(`[Audio Error] ${title}:`, err?.message || err);
    return false;
  }
}

async function main() {
  console.log("=== MIGRASI LAGU & COVER: SUPABASE -> R2 ===\n");

  const releases = await prisma.release.findMany({
    where: { coverArtworkUrl: { contains: 'supabase.co' } }
  });

  const tracks = await prisma.track.findMany({
    where: { audioUrl: { contains: 'supabase.co' } }
  });

  if (releases.length === 0 && tracks.length === 0) {
    console.log("✅ Semua lagu dan cover sudah di R2.");
    return;
  }

  console.log(`Ditemukan ${releases.length} cover dan ${tracks.length} lagu di Supabase. Mulai migrasi...\n`);

  let coverSuccess = 0;
  let audioSuccess = 0;
  let failed = 0;

  for (let i = 0; i < releases.length; i++) {
    const r = releases[i];
    console.log(`--- [Cover ${i + 1}/${releases.length}] ${r.title} ---`);
    if (r.coverArtworkUrl?.includes('supabase.co')) {
      const ok = await migrateCover(r.id, r.coverArtworkUrl, r.title);
      if (ok) coverSuccess++; else failed++;
    }
  }

  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    console.log(`--- [Audio ${i + 1}/${tracks.length}] ${t.title} ---`);
    if (t.audioUrl?.includes('supabase.co')) {
      const ok = await migrateAudio(t.id, t.audioUrl, t.title);
      if (ok) audioSuccess++; else failed++;
    }
  }

  console.log(`\n=== SELESAI ===`);
  console.log(`Berhasil Migrasi Cover: ${coverSuccess}/${releases.length}`);
  console.log(`Berhasil Migrasi Audio: ${audioSuccess}/${tracks.length}`);
  console.log(`Gagal: ${failed}`);
}

main().finally(() => prisma.$disconnect());
