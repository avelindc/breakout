"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_RELEASES, R2_PUBLIC_URL_RELEASES } from "@/lib/r2";
import { v4 as uuidv4 } from "uuid";

export async function uploadCMSImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `cms/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Direct R2 Upload via AWS S3 SDK
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_RELEASES || "releases",
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      });

      await r2Client.send(command);

      const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || "https://releases.breakoutmusic.online";
      const url = `${publicBase.replace(/\/$/, '')}/${key}`;
      console.log("CMS image uploaded directly to R2:", url);
      return { url };
    } catch (r2SdkErr: any) {
      console.warn("Direct R2 S3 SDK upload failed, falling back to Cloudflare Worker:", r2SdkErr.message);
      
      // 2. Fallback via Cloudflare Worker
      const workerForm = new FormData();
      workerForm.append("file", file);
      const workerRes = await fetch("https://upload.breakoutmusic.online", {
        method: "POST",
        body: workerForm
      });
      const workerData = await workerRes.json();
      if (workerData.success && workerData.url) {
        return { url: workerData.url };
      }
      throw new Error(workerData.error || "Failed to upload image to R2 storage");
    }
  } catch (error: any) {
    console.error("CMS Upload error:", error);
    return { error: error.message };
  }
}
