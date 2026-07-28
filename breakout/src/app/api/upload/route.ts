import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_ASSETS, BUCKET_PROFILES, BUCKET_RELEASES } from "@/lib/r2";
import { getR2PublicUrl } from "@/lib/r2-helpers";

// File type validation
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

// File size limits (in bytes)
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const uploadType = formData.get("type") as string; // 'cover', 'audio', 'profile', 'asset', 'message'
    const artistId = formData.get("artistId") as string;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!uploadType) {
      return NextResponse.json({ error: "Upload type required" }, { status: 400 });
    }

    // Validate file type and size based on upload type
    let bucket: string;
    let folder: string;
    let maxSize: number;
    let allowedTypes: string[];

    switch (uploadType) {
      case 'cover':
        bucket = BUCKET_RELEASES;
        folder = 'covers';
        maxSize = MAX_IMAGE_SIZE;
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'audio':
        bucket = BUCKET_RELEASES;
        folder = 'audio';
        maxSize = MAX_AUDIO_SIZE;
        allowedTypes = ALLOWED_AUDIO_TYPES;
        break;
      case 'profile':
        bucket = BUCKET_PROFILES;
        folder = 'avatars';
        maxSize = MAX_IMAGE_SIZE;
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'asset':
      case 'cms':
      case 'brand':
        bucket = BUCKET_ASSETS;
        folder = uploadType === 'brand' ? 'brand' : 'cms';
        maxSize = MAX_IMAGE_SIZE;
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      case 'message':
        bucket = BUCKET_ASSETS;
        folder = 'messages';
        maxSize = MAX_DOCUMENT_SIZE;
        allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];
        break;
      case 'contract':
        bucket = BUCKET_ASSETS;
        folder = uploadType === 'signature' ? 'signatures' : 'contracts';
        maxSize = MAX_IMAGE_SIZE;
        allowedTypes = ALLOWED_IMAGE_TYPES;
        break;
      default:
        return NextResponse.json({ error: "Invalid upload type" }, { status: 400 });
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum: ${Math.round(maxSize / 1024 / 1024)}MB`
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const userId = session.user.id;
    const identifier = artistId || userId;
    const filename = `${identifier}-${timestamp}.${ext}`;
    const key = `${folder}/${filename}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to R2 using AWS SDK
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'uploaded-by': userId,
        'upload-type': uploadType,
        'original-name': file.name,
      }
    });

    try {
      await r2Client.send(command);
      console.log(`✅ Uploaded to R2: ${bucket}/${key}`);
    } catch (r2Error: any) {
      console.error("R2 upload error:", r2Error);
      return NextResponse.json({ 
        error: "Failed to upload to R2 storage",
        details: r2Error.message 
      }, { status: 500 });
    }

    // Generate public URL using custom domain
    const publicUrl = await getR2PublicUrl(bucket, key);

    // Return success response
    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key,
      bucket: bucket,
      size: file.size,
      type: file.type,
      filename: filename
    });

  } catch (error: any) {
    console.error("Upload API route error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error.message 
    }, { status: 500 });
  }
}
