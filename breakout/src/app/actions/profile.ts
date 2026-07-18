"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { isMaintenanceActive } from "@/lib/maintenance";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function updateProfileAction(formData: FormData) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const active = await isMaintenanceActive();
  if (active && session.user.role !== "ADMIN") {
    return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artists: true }
  });

  if (!user) {
    return { error: "User not found" };
  }

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const whatsapp = formData.get("whatsapp") as string;
    const password = formData.get("password") as string;
    const photoFile = formData.get("photo") as File | null;

    if (!name || !email) {
      return { error: "Name and email are required" };
    }

    let imageUrl = user.image;

    // Upload new profile photo if provided
    if (photoFile && photoFile.size > 0) {
      if (!supabase) {
        return { error: `Supabase credentials missing. URL: ${supabaseUrl ? "OK" : "MISSING"}, KEY: ${supabaseKey ? "OK" : "MISSING"}` };
      }

      const ext = photoFile.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(path, buffer, {
          contentType: photoFile.type,
          upsert: false
        });
        
      if (uploadError) {
        return { error: `Failed to upload photo: ${uploadError.message}. Make sure 'profiles' bucket exists and is public.` };
      }
      
      imageUrl = `${supabaseUrl}/storage/v1/object/public/profiles/${path}`;
    }

    let updateData: any = {
      name,
      email,
      whatsapp,
      image: imageUrl
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update User
    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Sync avatarUrl to all associated Artist profiles
    if (imageUrl && user.artists.length > 0) {
      await prisma.artist.updateMany({
        where: { userId: user.id },
        data: { avatarUrl: imageUrl }
      });
    }

    revalidatePath("/", "layout");

    return { success: true };
  } catch (error: any) {
    console.error("Profile update error:", error);
    return { error: error.message || "Failed to update profile" };
  }
}
