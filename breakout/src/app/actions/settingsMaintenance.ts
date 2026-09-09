"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "@/lib/r2";

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
      const ext = logoFile.name.split('.').pop() || 'png';
      const key = `brand/maintenance-logo-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await logoFile.arrayBuffer());
      
      let logoUrl = "";
      try {
        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_RELEASES || "releases",
          Key: key,
          Body: buffer,
          ContentType: logoFile.type || "image/png",
        });
        await r2Client.send(command);
        const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL_RELEASES || "https://releases.breakoutmusic.online";
        logoUrl = `${publicBase.replace(/\/$/, '')}/${key}`;
      } catch (r2Err: any) {
        console.warn("Direct R2 upload failed, using worker:", r2Err.message);
        const workerForm = new FormData();
        workerForm.append("file", logoFile);
        const workerRes = await fetch("https://upload.breakoutmusic.online", {
          method: "POST",
          body: workerForm
        });
        const workerData = await workerRes.json();
        if (workerData.success && workerData.url) {
          logoUrl = workerData.url;
        } else {
          return { error: `Failed to upload logo: ${workerData.error || r2Err.message}` };
        }
      }
      
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
