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

async function main() {
  console.log("=== MIGRASI COVER LAGU: SUPABASE -> R2 ===\n");

  const releases = await prisma.release.findMany({
    where: { coverArtworkUrl: { contains: 'supabase.co' } }
  });

  if (releases.length === 0) {
    console.log("✅ Semua cover lagu sudah di R2. Tidak ada yang perlu dipindahkan.");
    return;
  }

  console.log(`Ditemukan ${releases.length} cover lagu di Supabase. Mulai migrasi...\n`);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < releases.length; i++) {
    const r = releases[i];
    console.log(`--- [${i + 1}/${releases.length}] ${r.title} ---`);
    const ok = await migrateCover(r.id, r.coverArtworkUrl, r.title);
    if (ok) success++;
    else failed++;
    console.log('');
  }

  console.log(`=== SELESAI ===`);
  console.log(`Total: ${releases.length} | Berhasil: ${success} | Gagal: ${failed}`);
}

main().finally(() => prisma.$disconnect());
