"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, BUCKET_RELEASES } from "@/lib/r2";
import { getR2PublicUrl } from "@/lib/r2-helpers";

const prisma = new PrismaClient();

/**
 * Generate presigned URLs for direct upload to R2
 * This bypasses serverless function body size limits
 */
export async function getUploadPresignedUrlsAction(
  coverFileName: string,
  audioFileName: string,
  artistId: string
) {
  try {
    console.log("\n=== GET PRESIGNED URLS ===");
    
    const active = await isMaintenanceActive();
    const session = await auth();
    
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    if (!session?.user?.id) {
      return { error: "Unauthorized" };
    }

    const timestamp = Date.now();
    
    // Generate keys
    const coverExt = coverFileName.split('.').pop();
    const audioExt = audioFileName.split('.').pop();
    const coverKey = `covers/${artistId}-${timestamp}.${coverExt}`;
    const audioKey = `audio/${artistId}-${timestamp + 1}.${audioExt}`;
    
    console.log("Cover key:", coverKey);
    console.log("Audio key:", audioKey);
    
    // Create presigned URLs (valid for 10 minutes)
    const coverCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: coverKey,
      ContentType: coverFileName.match(/\.(jpg|jpeg)$/i) ? 'image/jpeg' : 'image/png',
    });
    
    const audioCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: audioKey,
      ContentType: 'audio/mpeg',
    });
    
    const coverPresignedUrl = await getSignedUrl(r2Client, coverCommand, { expiresIn: 600 });
    const audioPresignedUrl = await getSignedUrl(r2Client, audioCommand, { expiresIn: 600 });
    
    // Generate public URLs
    const coverPublicUrl = await getR2PublicUrl(BUCKET_RELEASES, coverKey);
    const audioPublicUrl = await getR2PublicUrl(BUCKET_RELEASES, audioKey);
    
    console.log("✅ Presigned URLs generated");
    console.log("Cover public URL:", coverPublicUrl);
    console.log("Audio public URL:", audioPublicUrl);
    
    return {
      success: true,
      cover: {
        presignedUrl: coverPresignedUrl,
        publicUrl: coverPublicUrl,
        key: coverKey
      },
      audio: {
        presignedUrl: audioPresignedUrl,
        publicUrl: audioPublicUrl,
        key: audioKey
      }
    };
  } catch (error: any) {
    console.error("Error generating presigned URLs:", error);
    return { error: `Failed to generate upload URLs: ${error.message}` };
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
