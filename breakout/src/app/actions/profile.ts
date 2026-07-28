"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { uploadFileToAPI } from "@/lib/r2-helpers";
import { isMaintenanceActive } from "@/lib/maintenance";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function updateProfileAction(formData: FormData) {
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

    // Upload new profile photo if provided via API route
    if (photoFile && photoFile.size > 0) {
      console.log("=== UPLOADING PROFILE PHOTO ===");
      console.log("File:", photoFile.name, photoFile.type, `${Math.round(photoFile.size / 1024)}KB`);
      
      const uploadResult = await uploadFileToAPI(photoFile, 'profile', user.id);
      
      if (!uploadResult.success) {
        return { error: `Failed to upload photo: ${uploadResult.error}` };
      }
      
      imageUrl = uploadResult.url!;
      console.log("Profile photo uploaded:", imageUrl);
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
