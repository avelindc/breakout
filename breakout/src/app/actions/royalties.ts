"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function addRoyaltyAction(formData: FormData) {
  const session = await auth();
  
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { error: "Unauthorized" };
  }

  const artistId = formData.get("artistId") as string;
  const songName = (formData.get("songName") as string) || "Global Royalty";
  const month = parseInt(formData.get("month") as string);
  const year = parseInt(formData.get("year") as string);
  const totalRevenue = parseFloat(formData.get("totalRevenue") as string);
  
  const spotifyStreams = parseInt(formData.get("spotifyStreams") as string) || 0;
  const appleMusicStreams = parseInt(formData.get("appleMusicStreams") as string) || 0;
  const youtubeStreams = parseInt(formData.get("youtubeStreams") as string) || 0;
  const tiktokStreams = parseInt(formData.get("tiktokStreams") as string) || 0;
  const amazonStreams = parseInt(formData.get("amazonStreams") as string) || 0;
  const otherStreams = parseInt(formData.get("otherStreams") as string) || 0;

  if (!artistId || !month || !year || isNaN(totalRevenue)) {
    return { error: "Missing required fields" };
  }

  try {
    await prisma.royalty.create({
      data: {
        artistId,
        songName,
        month,
        year,
        totalRevenue,
        spotifyStreams,
        appleMusicStreams,
        youtubeStreams,
        tiktokStreams,
        amazonStreams,
        otherStreams
      }
    });

    const artist = await prisma.artist.findUnique({ where: { id: artistId } });
    
    if (artist) {
      await prisma.notification.create({
        data: {
          userId: artist.userId,
          title: "New Royalty Statement",
          message: `Your royalty statement for ${songName} (${month}/${year}) has been generated.`
        }
      });
    }

    revalidatePath("/admin/royalties");
    revalidatePath("/dashboard/royalties");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to add royalty data" };
  }
}
