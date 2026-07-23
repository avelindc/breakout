"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function getMusicUploadUrlsAction(artistId: string, coverExt: string, audioExt: string, coverType: string = "image/jpeg", audioType: string = "audio/wav") {
  try {
    const active = await isMaintenanceActive();
    const session = await auth();
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    
    if (!supabaseUrl || !supabaseKey) {
      return { error: "Supabase credentials missing" };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const timestamp = Date.now();
    const coverPath = `covers/${artistId}-${timestamp}.${coverExt}`;
    const audioPath = `audio/${artistId}-${timestamp}.${audioExt}`;
    
    const { data: coverData, error: coverError } = await supabase.storage
      .from('releases')
      .createSignedUploadUrl(coverPath);
      
    if (coverError || !coverData) return { error: "Failed to generate cover upload URL" };

    const { data: audioData, error: audioError } = await supabase.storage
      .from('releases')
      .createSignedUploadUrl(audioPath);
      
    if (audioError || !audioData) return { error: "Failed to generate audio upload URL" };

    console.log("=== GENERATED SUPABASE URLS ===");
    console.log("Cover URL:", coverData.signedUrl);
    console.log("Audio URL:", audioData.signedUrl);

    return { 
      success: true, 
      cover: { url: coverData.signedUrl, path: coverPath, token: coverData.token },
      audio: { url: audioData.signedUrl, path: audioPath, token: audioData.token }
    };
  } catch (error) {
    console.error("getUploadUrls error:", error);
    return { error: "Gagal menyiapkan penyimpanan lagu di Supabase." };
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

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const coverArtworkUrl = `${supabaseUrl}/storage/v1/object/public/releases/${coverPath}`;
    const audioUrl = `${supabaseUrl}/storage/v1/object/public/releases/${audioPath}`;

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
          coverArtworkUrl,
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
        coverArtworkUrl,
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
