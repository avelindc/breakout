"use server";

import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

export async function uploadCMSImageAction(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file provided");

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `cms/${uuidv4()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from("assets")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const url = `${supabaseUrl}/storage/v1/object/public/assets/${path}`;
    console.log("CMS image uploaded to Supabase:", url);
    return { url };
  } catch (error: any) {
    console.error("CMS Upload error:", error);
    return { error: error.message };
  }
}
