"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function uploadBrandLogoAction(formData: FormData) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

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

    if (!supabase) {
      return { error: `Supabase credentials missing.` };
    }

    const ext = logoFile.name.split('.').pop();
    const path = `brand/logo-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await logoFile.arrayBuffer());
    
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(path, buffer, {
        contentType: logoFile.type,
        upsert: false
      });
      
    if (uploadError) {
      return { error: `Failed to upload logo: ${uploadError.message}. Make sure 'assets' bucket exists and is public.` };
    }
    
    const logoUrl = `${supabaseUrl}/storage/v1/object/public/assets/${path}`;

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
