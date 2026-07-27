"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";
import { generateMusicUploadUrls, getMusicPublicUrls } from "@/lib/r2-helpers";

const prisma = new PrismaClient();

export async function getMusicUploadUrlsAction(artistId: string, coverExt: string, audioExt: string, coverType: string = "image/jpeg", audioType: string = "audio/wav") {
  try {
    const active = await isMaintenanceActive();
    const session = await auth();
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    // Generate R2 presigned upload URLs for cover and audio
    const uploadResult = await generateMusicUploadUrls(artistId, coverExt, audioExt);
    
    if (!uploadResult.success) {
      return { error: uploadResult.error || "Failed to generate R2 upload URLs" };
    }

    console.log("=== GENERATED R2 URLS ===");
    console.log("Cover URL:", uploadResult.cover?.url);
    console.log("Audio URL:", uploadResult.audio?.url);

    return { 
      success: true, 
      cover: { 
        url: uploadResult.cover!.url, 
        path: uploadResult.cover!.path, 
        token: null // R2 doesn't use tokens like Supabase
      },
      audio: { 
        url: uploadResult.audio!.url, 
        path: uploadResult.audio!.path, 
        token: null // R2 doesn't use tokens like Supabase
      }
    };
  } catch (error) {
    console.error("getMusicUploadUrlsAction error:", error);
    return { error: "Gagal menyiapkan penyimpanan lagu di R2." };
  }
}

export async function submitMusicMetadataAction(data: any, coverPath: string, audioPath: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const active = await isMaintenanceActive();
  if (active && session?.user?.role !== "ADMIN") {
    return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artists: true }
  });

  if (!user || user.artists.length === 0) {
    return { error: "No artist profile found. Please create an artist first." };
  }

  try {
    const {
      title,
      genre,
      language,
      primaryArtistId,
      featuredArtist,
      composer,
      producer,
      lyrics,
      isrc,
      upc,
      releaseDateStr,
      tiktokClipStart
    } = data;
    
    // Find the specific artist the user selected
    const selectedArtist = user.artists.find((a: any) => a.id === primaryArtistId);
    if (!selectedArtist) {
      return { error: "Invalid artist selected." };
    }
    
    const primaryArtist = selectedArtist.stageName;
    const releaseDate = new Date(releaseDateStr);
    
    if (!title || !genre || !language || !releaseDateStr) {
      return { error: "Missing required fields" };
    }

    // Get R2 public URLs for the uploaded files
    const { coverUrl, audioUrl } = await getMusicPublicUrls(coverPath, audioPath);

    try {
      // Create Release & Track in DB
      const release = await prisma.release.create({
        data: {
          artistId: selectedArtist.id,
          title,
          type: "SINGLE",
          genre,
          language,
          primaryArtist,
          featuredArtist,
          releaseDate,
          coverArtworkUrl: coverUrl,
          status: "PENDING",
          tracks: {
            create: {
              title,
              audioUrl,
              composer,
              producer,
              lyrics,
              isrc,
              upc,
              tiktokClipStart
            }
          }
        }
      });

      revalidatePath("/dashboard");
      revalidatePath("/dashboard/releases");
      revalidatePath("/admin/releases");

      // Send Telegram Notification and save message ID
      const telegramMessageId = await sendTelegramReleaseNotification(
        release.id,
        primaryArtist,
        title,
        session.user.email || "Unknown",
        releaseDateStr,
        coverUrl,
        audioUrl,
        upc || "",
        isrc || "",
        composer || ""
      ).catch(e => {
        console.error("Telegram notify err:", e);
        return null;
      });

      if (telegramMessageId) {
        await prisma.release.update({
          where: { id: release.id },
          data: { telegramMessageId: telegramMessageId.toString() }
        });
      }

      return { success: true, releaseId: release.id };
    } catch (error: any) {
      console.error("submitMusicMetadataAction Error:", error);
      return { error: `Server Database Error: ${error.message || "Unknown error"}` };
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    return { error: error.message || "Failed to upload release" };
  }
}
