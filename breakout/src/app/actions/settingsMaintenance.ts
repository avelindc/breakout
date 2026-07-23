"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function saveMaintenanceSettingsAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // @ts-ignore
  if (session.user.role !== "ADMIN") {
    return { error: "Admin access required" };
  }

  try {
    const active = formData.get("active") === "true" ? "true" : "false";
    const title = (formData.get("title") as string) || "Mohon Maaf";
    const message =
      (formData.get("message") as string) ||
      "Maaf, hari ini operasional BREAKOUT.ID sedang libur. Silakan kembali lagi sesuai jadwal yang telah ditentukan.";
    const start = (formData.get("start") as string) || "";
    const end = (formData.get("end") as string) || "";
    const type = (formData.get("type") as string) || "system";
    const bgType = (formData.get("bg_type") as string) || "gradient";
    const bgVideo = (formData.get("bg_video") as string) || "";
    const resetLogo = formData.get("reset_logo") === "true";

    const settingsData = [
      { key: "maintenance_active", value: active },
      { key: "maintenance_title", value: title },
      { key: "maintenance_message", value: message },
      { key: "maintenance_start", value: start },
      { key: "maintenance_end", value: end },
      { key: "maintenance_type", value: type },
      { key: "maintenance_bg_type", value: bgType },
      { key: "maintenance_bg_video", value: bgVideo }
    ];

    for (const setting of settingsData) {
      await prisma.settings.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: {
          key: setting.key,
          value: setting.value,
          description: `Maintenance setting: ${setting.key}`
        }
      });
    }

    // Handle logo upload
    const logoFile = formData.get("logo") as File | null;
    if (resetLogo) {
      await prisma.settings.deleteMany({
        where: { key: "maintenance_logo_url" }
      });
    } else if (logoFile && logoFile.size > 0) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
      
      if (!supabaseUrl || !supabaseKey) {
        return { error: "Supabase credentials missing" };
      }
      
      const supabase = createClient(supabaseUrl, supabaseKey);
      const ext = logoFile.name.split('.').pop();
      const path = `brand/maintenance-logo-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      
      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(path, buffer, {
          contentType: logoFile.type,
          upsert: false
        });
        
      if (uploadError) {
        return { error: `Failed to upload logo: ${uploadError.message}` };
      }
      
      const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/${path}`;
      
      await prisma.settings.upsert({
        where: { key: "maintenance_logo_url" },
        update: { value: logoUrl },
        create: {
          key: "maintenance_logo_url",
          value: logoUrl,
          description: "Custom maintenance page logo url"
        }
      });
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Save maintenance settings error:", error);
    return { error: error.message || "Failed to save maintenance settings" };
  }
}
