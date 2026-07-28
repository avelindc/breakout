"use server";

import { uploadFileToAPI } from "@/lib/r2-helpers";

export async function uploadCMSImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    console.log("=== UPLOADING CMS IMAGE ===");
    console.log("File:", file.name, file.type, `${Math.round(file.size / 1024)}KB`);

    // Upload via server-side API route
    const uploadResult = await uploadFileToAPI(file, 'cms');
    
    if (!uploadResult.success) {
      throw new Error(uploadResult.error || "Upload failed");
    }

    console.log("CMS image uploaded:", uploadResult.url);

    return { url: uploadResult.url };
  } catch (error: any) {
    console.error("CMS Upload error:", error);
    return { error: error.message };
  }
}
