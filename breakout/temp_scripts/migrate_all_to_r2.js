const { PrismaClient } = require('@prisma/client');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
require('dotenv').config({ path: '.env.local' });

const prisma = new PrismaClient();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const R2_PUBLIC_URL = "https://pub-7147b1bf75b74798aefe6ba7125f9a7c.r2.dev";

// Extract bucket and path from Supabase URL
function parseSupabaseUrl(url) {
  if (!url || !url.includes('supabase.co')) return null;
  
  // Format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path...]
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

// Ensure dir exists
const tempDir = path.join(__dirname, 'temp_downloads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

let totalMigrated = 0;

async function migrateUrl(originalUrl, folder) {
  const parsed = parseSupabaseUrl(originalUrl);
  if (!parsed) return null; // Not a Supabase URL, skip

  const { bucket, filePath } = parsed;
  const fileName = filePath.split('/').pop() || 'file';
  const localFilePath = path.join(tempDir, fileName);

  try {
    console.log(`Downloading ${bucket}/${filePath}...`);
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    if (error) throw error;

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Save locally temporarily
    fs.writeFileSync(localFilePath, buffer);

    const r2Key = `${folder}/${fileName}`;
    const contentType = data.type || 'application/octet-stream';

    console.log(`Uploading to R2 as ${r2Key}...`);
    const uploadCommand = new PutObjectCommand({
      Bucket: 'releases',
      Key: r2Key,
      Body: fs.createReadStream(localFilePath),
      ContentType: contentType,
    });
    
    await r2Client.send(uploadCommand);
    
    // Delete from Supabase
    console.log(`Deleting from Supabase ${bucket}/${filePath}...`);
    await supabase.storage.from(bucket).remove([filePath]);
    
    // Delete local temp file
    fs.unlinkSync(localFilePath);

    totalMigrated++;
    return `${R2_PUBLIC_URL}/${r2Key}`;
  } catch (err) {
    console.error(`Failed to migrate ${originalUrl}:`, err.message);
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
}

async function main() {
  console.log("=== STARTING MASSIVE R2 MIGRATION ===");
  
  // 1. Releases Cover Art
  console.log("\nMigrating Releases...");
  const releases = await prisma.release.findMany();
  for (const release of releases) {
    const newCover = await migrateUrl(release.coverArtworkUrl, 'covers');
    if (newCover) {
      await prisma.release.update({ where: { id: release.id }, data: { coverArtworkUrl: newCover } });
      console.log(`Updated Release ${release.id}`);
    }
  }

  // 2. Tracks Audio
  console.log("\nMigrating Tracks...");
  const tracks = await prisma.track.findMany();
  for (const track of tracks) {
    const newAudio = await migrateUrl(track.audioUrl, 'audio');
    if (newAudio) {
      await prisma.track.update({ where: { id: track.id }, data: { audioUrl: newAudio } });
      console.log(`Updated Track ${track.id}`);
    }
  }

  // 3. User Avatars & KTP
  console.log("\nMigrating Users...");
  const users = await prisma.user.findMany();
  for (const user of users) {
    let updateData = {};
    if (user.image) {
      const newImage = await migrateUrl(user.image, 'profiles');
      if (newImage) updateData.image = newImage;
    }
    if (user.ktpUrl) {
      const newKtp = await migrateUrl(user.ktpUrl, 'profiles');
      if (newKtp) updateData.ktpUrl = newKtp;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.user.update({ where: { id: user.id }, data: updateData });
      console.log(`Updated User ${user.id}`);
    }
  }

  // 4. Artist Avatars
  console.log("\nMigrating Artists...");
  const artists = await prisma.artist.findMany();
  for (const artist of artists) {
    if (artist.avatarUrl) {
      const newAvatar = await migrateUrl(artist.avatarUrl, 'profiles');
      if (newAvatar) {
        await prisma.artist.update({ where: { id: artist.id }, data: { avatarUrl: newAvatar } });
        console.log(`Updated Artist ${artist.id}`);
      }
    }
  }

  // 5. Settings (CMS)
  console.log("\nMigrating CMS Settings...");
  const settings = await prisma.settings.findMany();
  for (const setting of settings) {
    if (setting.value && setting.value.includes('supabase.co')) {
      const newUrl = await migrateUrl(setting.value, 'cms');
      if (newUrl) {
        await prisma.settings.update({ where: { id: setting.id }, data: { value: newUrl } });
        console.log(`Updated Setting ${setting.key}`);
      }
    }
  }

  // 6. Contracts
  console.log("\nMigrating Contracts...");
  const contracts = await prisma.contract.findMany();
  for (const contract of contracts) {
    let updateData = {};
    if (contract.pdfUrl) {
      const newPdf = await migrateUrl(contract.pdfUrl, 'contracts');
      if (newPdf) updateData.pdfUrl = newPdf;
    }
    if (contract.signatureUrl) {
      const newSig = await migrateUrl(contract.signatureUrl, 'contracts');
      if (newSig) updateData.signatureUrl = newSig;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.contract.update({ where: { id: contract.id }, data: updateData });
      console.log(`Updated Contract ${contract.id}`);
    }
  }

  // 7. Messages
  console.log("\nMigrating Messages...");
  const messages = await prisma.message.findMany({ where: { attachment: { not: null } } });
  for (const msg of messages) {
    const newAtt = await migrateUrl(msg.attachment, 'messages');
    if (newAtt) {
      await prisma.message.update({ where: { id: msg.id }, data: { attachment: newAtt } });
      console.log(`Updated Message ${msg.id}`);
    }
  }
  
  // 8. Catalogs
  console.log("\nMigrating Catalogs...");
  const catalogs = await prisma.catalogSong.findMany();
  for (const cat of catalogs) {
    let updateData = {};
    if (cat.coverUrl) {
      const newCover = await migrateUrl(cat.coverUrl, 'covers');
      if (newCover) updateData.coverUrl = newCover;
    }
    if (cat.audioUrl) {
      const newAudio = await migrateUrl(cat.audioUrl, 'audio');
      if (newAudio) updateData.audioUrl = newAudio;
    }
    if (Object.keys(updateData).length > 0) {
      await prisma.catalogSong.update({ where: { id: cat.id }, data: updateData });
      console.log(`Updated CatalogSong ${cat.id}`);
    }
  }

  console.log(`\n=== MIGRATION COMPLETE! Migrated ${totalMigrated} files ===`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
