"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addRoyaltyPerSong(data: {
  artistId: string;
  songName: string;
  platform: string;
  revenue: number;
  currency: string;
  month: number;
  year: number;
  status: string;
}) {
  try {
    const track = await prisma.track.findFirst({
      where: {
        release: { artistId: data.artistId },
        title: data.songName
      }
    });

    await prisma.royaltyPerSong.create({
      data: {
        ...data,
        trackId: track?.id
      }
    });
    
    revalidatePath("/admin/royalty-per-song");
    revalidatePath("/dashboard/royalty-per-song");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to add royalty" };
  }
}

export async function updateRoyaltyPerSong(id: string, data: {
  songName?: string;
  platform?: string;
  revenue?: number;
  currency?: string;
  month?: number;
  year?: number;
  status?: string;
}) {
  try {
    const existing = await prisma.royaltyPerSong.findUnique({ where: { id } });
    if (!existing) return { error: "Royalty not found" };

    let trackId = existing.trackId;
    if (data.songName && data.songName !== existing.songName) {
      const track = await prisma.track.findFirst({
        where: {
          release: { artistId: existing.artistId },
          title: data.songName
        }
      });
      trackId = track?.id || null;
    }

    await prisma.royaltyPerSong.update({
      where: { id },
      data: {
        ...data,
        trackId
      }
    });
    
    revalidatePath("/admin/royalty-per-song");
    revalidatePath("/dashboard/royalty-per-song");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update royalty" };
  }
}

export async function deleteRoyaltyPerSong(id: string) {
  try {
    await prisma.royaltyPerSong.delete({ where: { id } });
    revalidatePath("/admin/royalty-per-song");
    revalidatePath("/dashboard/royalty-per-song");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete royalty" };
  }
}
