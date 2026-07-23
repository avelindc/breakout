"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isMaintenanceActive } from "@/lib/maintenance";
import { sendTelegramReleaseNotification } from "@/lib/telegramBot";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, BUCKET_RELEASES, R2_PUBLIC_URL_RELEASES } from "@/lib/r2";

const prisma = new PrismaClient();

export async function getMusicUploadUrlsAction(artistId: string, coverExt: string, audioExt: string, coverType: string = "image/jpeg", audioType: string = "audio/wav") {
  try {
    const active = await isMaintenanceActive();
    const session = await auth();
    if (active && session?.user?.role !== "ADMIN") {
      return { error: "Sistem sedang dalam pemeliharaan (Maintenance Mode)." };
    }

    const timestamp = Date.now();
    const coverPath = `covers/${artistId}-${timestamp}.${coverExt}`;
    const audioPath = `audio/${artistId}-${timestamp}.${audioExt}`;
    
    // Generate R2 presigned URLs
    const coverCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: coverPath,
      ContentType: coverType
    });
    const signOptions = {
      expiresIn: 3600,
      unhoistableHeaders: new Set(["x-amz-sdk-checksum-algorithm", "x-amz-checksum-crc32"])
    };
    const coverSignedUrl = await getSignedUrl(r2Client, coverCommand, signOptions);
    
    const audioCommand = new PutObjectCommand({
      Bucket: BUCKET_RELEASES,
      Key: audioPath,
      ContentType: audioType
    });
    const audioSignedUrl = await getSignedUrl(r2Client, audioCommand, signOptions);

    console.log("=== GENERATED R2 URLS ===");
    console.log("Cover URL:", coverSignedUrl);
    console.log("Audio URL:", audioSignedUrl);

    return { 
      success: true, 
      cover: { url: coverSignedUrl, path: coverPath, token: "" },
      audio: { url: audioSignedUrl, path: audioPath, token: "" }
    };
  } catch (error) {
    console.error("getUploadUrls error:", error);
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

    // Default to a placeholder if not set, or a constructed standard r2.dev domain
    // Assuming the format is something like https://pub-[id].r2.dev or a custom domain
    const r2Domain = R2_PUBLIC_URL_RELEASES || "https://r2.breakoutmusic.online"; 
    const coverArtworkUrl = `${r2Domain}/${coverPath}`;
    const audioUrl = `${r2Domain}/${audioPath}`;

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
