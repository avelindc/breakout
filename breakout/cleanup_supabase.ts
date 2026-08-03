import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// PROTECTED folders — NEVER delete these, they contain active website images
const PROTECTED_PATHS: Record<string, string[]> = {
  assets: ['cms', 'brand'],
};

const BUCKETS_AND_FOLDERS = [
  { bucket: 'releases', folder: 'covers' },
  { bucket: 'releases', folder: 'audio' },
  { bucket: 'profiles', folder: null },
  { bucket: 'assets', folder: 'contracts' },
  { bucket: 'assets', folder: 'messages' },
];

async function listAllFiles(bucket: string, folder: string | null): Promise<string[]> {
  const path = folder || '';
  let allFiles: string[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit,
      offset,
    });

    if (error) {
      console.error(`Error listing ${bucket}/${path}:`, error.message);
      break;
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      if (item.id) {
        // It's a file
        const filePath = folder ? `${folder}/${item.name}` : item.name;
        // Check if this file is in a protected path
        const protectedFolders = PROTECTED_PATHS[bucket] || [];
        const isProtected = protectedFolders.some(pf => filePath.startsWith(pf + '/') || filePath === pf);
        if (isProtected) {
          console.log(`  [SKIP - Protected] ${bucket}/${filePath}`);
          continue;
        }
        allFiles.push(filePath);
      } else {
        // It's a subfolder - skip if protected
        const subFolderName = folder ? `${folder}/${item.name}` : item.name;
        const protectedFolders = PROTECTED_PATHS[bucket] || [];
        const isProtected = protectedFolders.some(pf => subFolderName.startsWith(pf + '/') || subFolderName === pf);
        if (isProtected) {
          console.log(`  [SKIP - Protected folder] ${bucket}/${subFolderName}`);
          continue;
        }
        const subFiles = await listAllFiles(bucket, subFolderName);
        allFiles = allFiles.concat(subFiles);
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return allFiles;
}

async function deleteAllInBucket(bucket: string, folder: string | null) {
  const files = await listAllFiles(bucket, folder);
  const label = `${bucket}/${folder || ''}`;

  if (files.length === 0) {
    console.log(`[${label}] ✅ Sudah kosong!`);
    return;
  }

  console.log(`[${label}] Ditemukan ${files.length} file, mulai hapus...`);

  const BATCH = 20;
  let deleted = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    const { error } = await supabase.storage.from(bucket).remove(batch);
    if (error) {
      console.warn(`  [Batch ${Math.floor(i / BATCH) + 1}] Gagal hapus batch:`, error.message);
      failed += batch.length;
    } else {
      deleted += batch.length;
      console.log(`  [${label}] ✅ Dihapus ${deleted}/${files.length}...`);
    }
  }

  console.log(`[${label}] Selesai: ${deleted} berhasil, ${failed} gagal.`);
}

async function main() {
  console.log('=== SUPABASE STORAGE CLEANUP ===\n');

  for (const { bucket, folder } of BUCKETS_AND_FOLDERS) {
    await deleteAllInBucket(bucket, folder);
    console.log('');
  }

  console.log('=== CLEANUP COMPLETE ===');
}

main();
