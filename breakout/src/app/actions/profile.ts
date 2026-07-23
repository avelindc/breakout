"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import bcrypt from "bcryptjs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_PROFILES, R2_PUBLIC_URL_PROFILES } from "@/lib/r2";

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

    // Upload new profile photo if provided
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split('.').pop();
      const path = `avatars/${user.id}-${Date.now()}.${ext}`;
      const buffer = Buffer.from(await photoFile.arrayBuffer());
      
      try {
        const uploadCommand = new PutObjectCommand({
          Bucket: BUCKET_PROFILES,
          Key: path,
          Body: buffer,
          ContentType: photoFile.type || "image/jpeg",
        });
        await r2Client.send(uploadCommand);
      } catch (uploadError: any) {
        return { error: `Failed to upload photo to R2: ${uploadError.message}` };
      }
      
      const r2Domain = R2_PUBLIC_URL_PROFILES || "https://r2.breakoutmusic.online";
      imageUrl = `${r2Domain}/${path}`;
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
