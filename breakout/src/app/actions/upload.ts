"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";
import { uploadMusicFiles } from "@/lib/r2-helpers";

const prisma = new PrismaClient();

export async function uploadMusicFilesAction(formData: FormData) {
  try {
    const active = await isMaintenanceActive();
    const session = await auth();
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    // Get files and metadata from form data
    const coverFile = formData.get("cover") as File;
    const audioFile = formData.get("audio") as File;
    const artistId = formData.get("artistId") as string;
    
    if (!coverFile || !audioFile) {
      return { error: "Both cover and audio files are required" };
    }

    if (!artistId) {
      return { error: "Artist ID is required" };
    }

    console.log("=== uploadMusicFilesAction STARTING ===");
    console.log("Cover file:", coverFile.name, coverFile.type, `${Math.round(coverFile.size / 1024)}KB`);
    console.log("Audio file:", audioFile.name, audioFile.type, `${Math.round(audioFile.size / 1024 / 1024)}MB`);

    // Build absolute URL for API call
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000';

    // Upload cover first
    console.log("=== Uploading cover ===");
    const coverFormData = new FormData();
    coverFormData.append('file', coverFile);
    coverFormData.append('type', 'cover');
    coverFormData.append('artistId', artistId);

    const coverResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: coverFormData
    });

    if (!coverResponse.ok) {
      const errorText = await coverResponse.text();
      console.error("Cover upload failed:", coverResponse.status, errorText);
      return { error: `Cover upload failed: HTTP ${coverResponse.status}` };
    }

    let coverData;
    try {
      coverData = await coverResponse.json();
    } catch (e) {
      console.error("Cover response JSON parse failed");
      return { error: "Invalid response from cover upload" };
    }

    if (!coverData.success || !coverData.url) {
      console.error("Cover response missing success/url:", coverData);
      return { error: "Cover upload returned invalid response" };
    }

    console.log("✅ Cover uploaded:", coverData.url);

    // Upload audio
    console.log("=== Uploading audio ===");
    const audioFormData = new FormData();
    audioFormData.append('file', audioFile);
    audioFormData.append('type', 'audio');
    audioFormData.append('artistId', artistId);

    const audioResponse = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      body: audioFormData
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error("Audio upload failed:", audioResponse.status, errorText);
      return { error: `Audio upload failed: HTTP ${audioResponse.status}` };
    }

    let audioData;
    try {
      audioData = await audioResponse.json();
    } catch (e) {
      console.error("Audio response JSON parse failed");
      return { error: "Invalid response from audio upload" };
    }

    if (!audioData.success || !audioData.url) {
      console.error("Audio response missing success/url:", audioData);
      return { error: "Audio upload returned invalid response" };
    }

    console.log("✅ Audio uploaded:", audioData.url);

    console.log("=== uploadMusicFilesAction SUCCESS ===");
    return { 
      success: true, 
      cover: { 
        url: coverData.url, 
        key: coverData.key,
      },
      audio: { 
        url: audioData.url, 
        key: audioData.key,
      }
    };
  } catch (error: any) {
    console.error("uploadMusicFilesAction error:", error);
    return { error: error.message || "Gagal mengupload file musik." };
  }
}

export async function submitMusicMetadataAction(data: any) {
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
      tiktokClipStart,
      coverUrl,
      audioUrl
    } = data;
    
    // Validate URLs are provided
    if (!coverUrl || !audioUrl) {
      return { error: "Cover and audio URLs are required" };
    }

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

    // Use the URLs provided from server-side upload
    console.log("=== SAVING TO DATABASE ===");
    console.log("Cover URL:", coverUrl);
    console.log("Audio URL:", audioUrl);

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
