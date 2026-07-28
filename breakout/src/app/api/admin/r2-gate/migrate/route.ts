import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const R2_PUBLIC_URL = "https://releases.breakoutmusic.online";

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

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { table, id, column, url } = await req.json();

    if (!table || !id || !column || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const parsed = parseSupabaseUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid Supabase URL" }, { status: 400 });
    }

    const { bucket, filePath } = parsed;
    const fileName = filePath.split('/').pop() || 'file';

    // Map columns to R2 folders (same logic as migrate_all_to_r2)
    let folder = 'others';
    if (column === 'coverArtworkUrl' || column === 'coverUrl') folder = 'covers';
    else if (column === 'audioUrl') folder = 'audio';
    else if (['image', 'ktpUrl', 'avatarUrl'].includes(column)) folder = 'profiles';
    else if (['pdfUrl', 'signatureUrl'].includes(column)) folder = 'contracts';
    else if (column === 'attachment') folder = 'messages';
    else if (table === 'Settings') folder = 'cms';

    console.log(`[R2 Gate] Downloading ${bucket}/${filePath}...`);
    const { data, error } = await supabase.storage.from(bucket).download(filePath);
    
    if (error) {
      console.error(`[R2 Gate] Supabase download error for ${filePath}:`, error.message);
      // If it doesn't exist in Supabase but the DB still has it, we might want to just skip
      if (error.message.includes('Object not found')) {
        return NextResponse.json({ error: "File not found in Supabase" }, { status: 404 });
      }
      throw error;
    }

    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const r2Key = `${folder}/${fileName}`;
    const contentType = data.type || 'application/octet-stream';

    console.log(`[R2 Gate] Uploading to R2 as ${r2Key}...`);
    const uploadCommand = new PutObjectCommand({
      Bucket: 'releases', // Hardcoded as per your current R2 setup
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await r2Client.send(uploadCommand);
    
    // Delete from Supabase
    console.log(`[R2 Gate] Deleting from Supabase ${bucket}/${filePath}...`);
    await supabase.storage.from(bucket).remove([filePath]);

    const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    // Update Database dynamically
    // Use prisma.$executeRawUnsafe for dynamic table/column updates, 
    // or map to specific prisma calls to be safe.
    console.log(`[R2 Gate] Updating database ${table}.${column} for ID ${id}...`);
    
    if (table === 'Release') {
      await prisma.release.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'Track') {
      await prisma.track.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'User') {
      await prisma.user.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'Artist') {
      await prisma.artist.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'Contract') {
      await prisma.contract.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'Message') {
      await prisma.message.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'Settings') {
      await prisma.settings.update({ where: { id }, data: { [column]: newUrl } });
    } else if (table === 'CatalogSong') {
      await prisma.catalogSong.update({ where: { id }, data: { [column]: newUrl } });
    }

    return NextResponse.json({ success: true, newUrl });

  } catch (error: any) {
    console.error("[R2 Gate] Migration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
