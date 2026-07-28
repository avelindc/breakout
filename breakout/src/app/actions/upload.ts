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

    console.log("=== uploadMusicFilesAction DIRECT R2 UPLOAD ===");
    console.log("Cover:", coverFile.name, `${Math.round(coverFile.size / 1024)}KB`);
    console.log("Audio:", audioFile.name, `${Math.round(audioFile.size / 1024 / 1024)}MB`);
    console.log("Artist ID:", artistId);

    // Import R2 directly
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { r2Client, BUCKET_RELEASES } = await import("@/lib/r2");
    const { getR2PublicUrl } = await import("@/lib/r2-helpers");

    // Upload cover
    console.log("Uploading cover to R2...");
    const timestamp = Date.now();
    const coverExt = coverFile.name.split('.').pop();
    const coverKey = `covers/${artistId}-${timestamp}.${coverExt}`;
    
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
    const coverCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: coverKey,
      Body: coverBuffer,
      ContentType: coverFile.type,
    });

    try {
      await r2Client.send(coverCommand);
      console.log("✅ Cover uploaded to R2:", coverKey);
    } catch (r2Error: any) {
      console.error("❌ R2 cover upload error:", r2Error.message);
      return { error: `Failed to upload cover: ${r2Error.message}` };
    }

    // Upload audio  
    console.log("Uploading audio to R2...");
    const audioExt = audioFile.name.split('.').pop();
    const audioKey = `audio/${artistId}-${timestamp + 1}.${audioExt}`;
    
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: audioFile.type,
    });

    try {
      await r2Client.send(audioCommand);
      console.log("✅ Audio uploaded to R2:", audioKey);
    } catch (r2Error: any) {
      console.error("❌ R2 audio upload error:", r2Error.message);
      return { error: `Failed to upload audio: ${r2Error.message}` };
    }

    // Generate public URLs
    const coverUrl = await getR2PublicUrl(BUCKET_RELEASES, coverKey);
    const audioUrl = await getR2PublicUrl(BUCKET_RELEASES, audioKey);

    console.log("✅ Cover URL:", coverUrl);
    console.log("✅ Audio URL:", audioUrl);

    return { 
      success: true, 
      cover: { url: coverUrl, key: coverKey },
      audio: { url: audioUrl, key: audioKey }
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
