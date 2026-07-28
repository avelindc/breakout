import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { createClient } from '@supabase/supabase-js';
import { r2Client, BUCKET_RELEASES, BUCKET_PROFILES, BUCKET_ASSETS, R2_PUBLIC_URL_RELEASES, R2_PUBLIC_URL_PROFILES, R2_PUBLIC_URL_ASSETS } from "@/lib/r2";

const prisma = new PrismaClient();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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

    const { bucket: supabaseBucket, filePath } = parsed;
    const fileName = filePath.split('/').pop() || 'file';

    let r2Bucket = BUCKET_RELEASES;
    let publicUrlBase = R2_PUBLIC_URL_RELEASES;
    let folder = 'others';

    if (column === 'coverArtworkUrl' || column === 'coverUrl') { folder = 'covers'; }
    else if (column === 'audioUrl') { folder = 'audio'; }
    else if (['image', 'ktpUrl', 'avatarUrl'].includes(column)) { 
      r2Bucket = BUCKET_PROFILES; 
      publicUrlBase = R2_PUBLIC_URL_PROFILES; 
      folder = 'profiles'; 
    }
    else if (['pdfUrl', 'signatureUrl'].includes(column)) {
      r2Bucket = BUCKET_ASSETS;
      publicUrlBase = R2_PUBLIC_URL_ASSETS;
      folder = 'contracts';
    }
    else if (column === 'attachment') {
      r2Bucket = BUCKET_ASSETS;
      publicUrlBase = R2_PUBLIC_URL_ASSETS;
      folder = 'messages';
    }
    else if (table === 'Settings') {
      r2Bucket = BUCKET_ASSETS;
      publicUrlBase = R2_PUBLIC_URL_ASSETS;
      folder = 'cms';
    }

    console.log(`[R2 Gate] Downloading ${url}...`);
    // Use standard fetch to download public files (avoids RLS/Auth issues)
    const downloadRes = await fetch(url);
    
    if (!downloadRes.ok) {
      console.error(`[R2 Gate] Download failed with status: ${downloadRes.status}`);
      if (downloadRes.status === 404) {
         return NextResponse.json({ error: "File not found in Supabase" }, { status: 404 });
      }
      throw new Error(`Failed to download from Supabase. Status: ${downloadRes.status}`);
    }

    const arrayBuffer = await downloadRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const r2Key = `${folder}/${fileName}`;
    const contentType = downloadRes.headers.get('content-type') || 'application/octet-stream';

    console.log(`[R2 Gate] Uploading to R2 (${r2Bucket}) as ${r2Key}...`);
    const uploadCommand = new PutObjectCommand({
      Bucket: r2Bucket,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
    });
    
    await r2Client.send(uploadCommand);
    
    // Attempt to delete from Supabase, but don't fail if it doesn't work 
    // (since Anon key might not have DELETE permissions)
    try {
      console.log(`[R2 Gate] Deleting from Supabase ${supabaseBucket}/${filePath}...`);
      await supabase.storage.from(supabaseBucket).remove([filePath]);
    } catch (delErr) {
      console.warn(`[R2 Gate] Failed to delete from Supabase, skipping...`, delErr);
    }

    const newUrl = `${publicUrlBase}/${r2Key}`;

    // Update Database dynamically
    console.log(`[R2 Gate] Updating database ${table}.${column} for ID ${id} to ${newUrl}...`);
    
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
