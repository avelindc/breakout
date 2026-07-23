"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_ASSETS, R2_PUBLIC_URL_ASSETS } from "@/lib/r2";

const prisma = new PrismaClient();

export async function uploadBrandLogoAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // @ts-ignore
  if (session.user.role !== 'ADMIN') {
    return { error: "Admin access required" };
  }

  try {
    const logoFile = formData.get("logo") as File | null;

    if (!logoFile || logoFile.size === 0) {
      return { error: "No logo file provided" };
    }

    const ext = logoFile.name.split('.').pop();
    const path = `brand/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: BUCKET_ASSETS,
        Key: path,
        Body: buffer,
        ContentType: logoFile.type || "image/png",
      });
      await r2Client.send(uploadCommand);
    } catch (uploadError: any) {
      return { error: `Failed to upload logo to R2: ${uploadError.message}` };
    }
    
    const r2Domain = R2_PUBLIC_URL_ASSETS || "https://r2-assets.breakoutmusic.online";
    const logoUrl = `${r2Domain}/${path}`;

    // Upsert into Settings table
    await prisma.settings.upsert({
      where: { key: 'brand_logo' },
      update: { value: logoUrl },
      create: { key: 'brand_logo', value: logoUrl, description: 'Global brand logo url' }
    });

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Logo upload error:", error);
    return { error: error.message || "Failed to upload brand logo" };
  }
}

export async function updateCatalogVisibility(data: { rph: boolean; khana: boolean; halo: boolean }) {
  const session = await auth();
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };

  try {
    await prisma.settings.upsert({
      where: { key: 'enable_catalog_rph' },
      update: { value: data.rph ? "true" : "false" },
      create: { key: 'enable_catalog_rph', value: data.rph ? "true" : "false", description: 'Show RPH catalog to users' }
    });
    await prisma.settings.upsert({
      where: { key: 'enable_catalog_khana' },
      update: { value: data.khana ? "true" : "false" },
      create: { key: 'enable_catalog_khana', value: data.khana ? "true" : "false", description: 'Show Khana catalog to users' }
    });
    await prisma.settings.upsert({
      where: { key: 'enable_catalog_halo' },
      update: { value: data.halo ? "true" : "false" },
      create: { key: 'enable_catalog_halo', value: data.halo ? "true" : "false", description: 'Show Halo catalog to users' }
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: "Gagal menyimpan pengaturan" };
  }
}
