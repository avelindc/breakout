"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";

const prisma = new PrismaClient();

export async function uploadMusicFilesServerAction(
  coverFile: File, 
  audioFile: File, 
  artistId: string
) {
  try {
    console.log("\n=== START uploadMusicFilesServerAction ===");
    
    const active = await isMaintenanceActive();
    const session = await auth();
    console.log("Session:", session?.user?.id);
    console.log("Active:", active);
    
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    console.log("Files received:");
    console.log("- Cover:", coverFile?.name, `${Math.round(coverFile?.size / 1024)}KB`);
    console.log("- Audio:", audioFile?.name, `${Math.round(audioFile?.size / 1024 / 1024)}MB`);
    console.log("- Artist ID:", artistId);
    
    if (!coverFile || !audioFile) {
      console.log("ERROR: Missing files");
      return { error: "Both cover and audio files are required" };
    }

    if (!artistId) {
      console.log("ERROR: Missing artist ID");
      return { error: "Artist ID is required" };
    }

    console.log("✓ All files present");

    // Import R2 modules
    console.log("Importing R2 modules...");
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const r2Module = await import("@/lib/r2");
    const r2HelpersModule = await import("@/lib/r2-helpers");
    
    const r2Client = r2Module.r2Client;
    const BUCKET_RELEASES = r2Module.BUCKET_RELEASES;
    const getR2PublicUrl = r2HelpersModule.getR2PublicUrl;
    
    console.log("✓ Modules imported");
    console.log("BUCKET_RELEASES:", BUCKET_RELEASES);

    // Upload cover
    console.log("\n--- UPLOADING COVER ---");
    const timestamp = Date.now();
    const coverExt = coverFile.name.split('.').pop();
    const coverKey = `covers/${artistId}-${timestamp}.${coverExt}`;
    
    console.log("Cover key:", coverKey);
    
    const coverBuffer = Buffer.from(await coverFile.arrayBuffer());
    console.log("Cover buffer size:", coverBuffer.length);
    
    const coverCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: coverKey,
      Body: coverBuffer,
      ContentType: coverFile.type,
    });

    console.log("Sending cover to R2...");
    try {
      const coverResponse = await r2Client.send(coverCommand);
      console.log("✅ Cover uploaded:", coverResponse);
    } catch (r2Error: any) {
      console.error("❌ R2 ERROR:", r2Error.constructor.name);
      console.error("Error message:", r2Error.message);
      console.error("Error code:", r2Error.Code || r2Error.code);
      console.error("Full error:", r2Error);
      return { error: `Cover R2 error: ${r2Error.Code || r2Error.message}` };
    }

    // Upload audio  
    console.log("\n--- UPLOADING AUDIO ---");
    const audioExt = audioFile.name.split('.').pop();
    const audioKey = `audio/${artistId}-${timestamp + 1}.${audioExt}`;
    
    console.log("Audio key:", audioKey);
    
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    console.log("Audio buffer size:", audioBuffer.length);
    
    const audioCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: audioKey,
      Body: audioBuffer,
      ContentType: audioFile.type,
    });

    console.log("Sending audio to R2...");
    try {
      const audioResponse = await r2Client.send(audioCommand);
      console.log("✅ Audio uploaded:", audioResponse);
    } catch (r2Error: any) {
      console.error("❌ R2 ERROR:", r2Error.constructor.name);
      console.error("Error message:", r2Error.message);
      console.error("Error code:", r2Error.Code || r2Error.code);
      console.error("Full error:", r2Error);
      return { error: `Audio R2 error: ${r2Error.Code || r2Error.message}` };
    }

    // Generate public URLs
    console.log("\n--- GENERATING URLS ---");
    let coverUrl, audioUrl;
    try {
      coverUrl = await getR2PublicUrl(BUCKET_RELEASES, coverKey);
      audioUrl = await getR2PublicUrl(BUCKET_RELEASES, audioKey);
      console.log("✅ Cover URL:", coverUrl);
      console.log("✅ Audio URL:", audioUrl);
    } catch (urlError: any) {
      console.error("❌ URL Generation error:", urlError.message);
      return { error: `URL generation error: ${urlError.message}` };
    }

    console.log("\n=== END uploadMusicFilesServerAction (SUCCESS) ===\n");
    
    return { 
      success: true, 
      cover: { url: coverUrl, key: coverKey },
      audio: { url: audioUrl, key: audioKey }
    };
  } catch (error: any) {
    console.error("\n=== UNCAUGHT ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    return { error: `Upload error: ${error.message}` };
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
