import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_RELEASES, R2_PUBLIC_URL_RELEASES } from "@/lib/r2";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop();
    const timestamp = Date.now();
    const filename = `catalog-rph/cover-${timestamp}.${ext}`;

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_RELEASES,
        Key: filename,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      });
      await r2Client.send(uploadCommand);
    } catch (uploadError) {
      console.error("R2 upload error:", uploadError);
      return NextResponse.json({ error: "Upload to storage failed" }, { status: 500 });
    }

    const r2Domain = R2_PUBLIC_URL_RELEASES || "https://r2.breakoutmusic.online";
    const publicUrl = `${r2Domain}/${filename}`;

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Upload route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
