"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { isMaintenanceActive } from "@/lib/maintenance";

const prisma = new PrismaClient();

export async function createArtistAction(stageName: string, userId: string) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.id !== userId) {
      return { error: "Unauthorized" };
    }

    const active = await isMaintenanceActive();
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    if (!stageName || stageName.trim() === "") {
      return { error: "Artist name is required" };
    }

    const artist = await prisma.artist.create({
      data: {
        stageName: stageName.trim(),
        userId: session.user.id,
      },
    });

    return { success: true, artist };
  } catch (error: any) {
    console.error("Error creating artist:", error);
    return { error: error.message || "Failed to create artist" };
  }
}
