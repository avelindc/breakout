"use server";

import { v4 as uuidv4 } from "uuid";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_ASSETS, R2_PUBLIC_URL_ASSETS } from "@/lib/r2";


export async function uploadCMSImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const fileExt = file.name.split('.').pop();
    const fileName = `cms/${uuidv4()}.${fileExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_ASSETS,
        Key: fileName,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
      });
      await r2Client.send(uploadCommand);
    } catch (uploadError: any) {
      throw new Error(`R2 Upload Error: ${uploadError.message}`);
    }

    const r2Domain = R2_PUBLIC_URL_ASSETS || "https://r2-assets.breakoutmusic.online";
    const publicUrl = `${r2Domain}/${fileName}`;

    return { url: publicUrl };
  } catch (error: any) {
    console.error("CMS Upload error:", error);
    return { error: error.message };
  }
}
