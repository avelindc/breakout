"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export type ParsedRow = {
  isrc?: string;
  upc?: string;
  title?: string;
  artist?: string;
  streams?: number;
  revenue?: number;
  platform?: string;
  country?: string;
  date?: string;
};

export async function processImportStreamingBatch(
  fileName: string,
  rows: ParsedRow[]
) {
  try {
    let successCount = 0;
    let failedCount = 0;
    let duplicateCount = 0;

    const unmatchedData: any[] = [];
    const matchedData: Record<string, any> = {};

    // Collect all ISRCs and UPCs to lookup
    const isrcs = Array.from(new Set(rows.map(r => r.isrc?.trim()).filter(Boolean) as string[]));
    const upcs = Array.from(new Set(rows.map(r => r.upc?.trim()).filter(Boolean) as string[]));
    
    console.log("[IMPORT DEBUG] Looking up ISRCs:", isrcs);
    console.log("[IMPORT DEBUG] Looking up UPCs:", upcs);

    // Find tracks
    const tracks = await prisma.track.findMany({
      where: { 
        OR: [
          { isrc: { in: isrcs } },
          { upc: { in: upcs } },
          { release: { upc: { in: upcs } } }
        ]
      },
      include: { release: { select: { artistId: true, upc: true } } }
    });

    console.log(`[IMPORT DEBUG] Found ${tracks.length} tracks in database matching criteria.`);

    const trackByIsrc = new Map<string, typeof tracks[0]>();
    const trackByUpc = new Map<string, typeof tracks[0]>();
    
    tracks.forEach(t => {
      if (t.isrc) trackByIsrc.set(t.isrc, t);
      if (t.upc) trackByUpc.set(t.upc, t);
      if (t.release?.upc) trackByUpc.set(t.release.upc, t);
    });

    // Aggregate royalties in memory
    // key: "artistId|songName|month|year"
    const royaltyAgg = new Map<string, {
      artistId: string;
      songName: string;
      month: number;
      year: number;
      spotify: number;
      apple: number;
      youtube: number;
      tiktok: number;
      amazon: number;
      other: number;
      revenue: number;
    }>();

    for (const row of rows) {
      const isrcRaw = row.isrc?.trim();
      const upcRaw = row.upc?.trim();

      if (!isrcRaw && !upcRaw) {
        failedCount++;
        unmatchedData.push({
          isrc: "", upc: "", title: row.title || "", artist: row.artist || "", reason: "ISRC dan UPC Kosong"
        });
        continue;
      }

      // Try ISRC first, then UPC
      let track = isrcRaw ? trackByIsrc.get(isrcRaw) : undefined;
      if (!track && upcRaw) {
        track = trackByUpc.get(upcRaw);
      }

      if (!track) {
        failedCount++;
        unmatchedData.push({
          isrc: isrcRaw || "", upc: upcRaw || "", title: row.title || "", artist: row.artist || "", reason: "ISRC / UPC Tidak Ditemukan di Database"
        });
        console.log(`[IMPORT DEBUG] Failed to match row - ISRC: ${isrcRaw}, UPC: ${upcRaw}, Title: ${row.title}`);
        continue;
      }

      console.log(`[IMPORT DEBUG] Successfully matched row - ISRC: ${isrcRaw}, UPC: ${upcRaw} to Track: ${track.title}`);
      successCount++;

      // Parse Date to get month and year
      const d = row.date ? new Date(row.date) : new Date();
      let month = d.getMonth() + 1;
      let year = d.getFullYear();
      if (isNaN(month) || isNaN(year)) {
        month = new Date().getMonth() + 1;
        year = new Date().getFullYear();
      }

      const key = `${track.release.artistId}|${track.title}|${month}|${year}`;
      if (!royaltyAgg.has(key)) {
        royaltyAgg.set(key, {
          artistId: track.release.artistId,
          songName: track.title,
          month,
          year,
          spotify: 0, apple: 0, youtube: 0, tiktok: 0, amazon: 0, other: 0, revenue: 0
        });
      }

      const agg = royaltyAgg.get(key)!;
      const streams = row.streams || 0;
      const revenue = row.revenue || 0;
      agg.revenue += revenue;

      const p = (row.platform || "").toLowerCase();
      if (p.includes("spotify")) agg.spotify += streams;
      else if (p.includes("apple")) agg.apple += streams;
      else if (p.includes("youtube")) agg.youtube += streams;
      else if (p.includes("tiktok")) agg.tiktok += streams;
      else if (p.includes("amazon")) agg.amazon += streams;
      else agg.other += streams;
    }

    // Upsert into Database
    for (const agg of royaltyAgg.values()) {
      const existing = await prisma.royalty.findFirst({
        where: {
          artistId: agg.artistId,
          songName: agg.songName,
          month: agg.month,
          year: agg.year
        }
      });

      if (existing) {
        await prisma.royalty.update({
          where: { id: existing.id },
          data: {
            spotifyStreams: existing.spotifyStreams + agg.spotify,
            appleMusicStreams: existing.appleMusicStreams + agg.apple,
            youtubeStreams: existing.youtubeStreams + agg.youtube,
            tiktokStreams: existing.tiktokStreams + agg.tiktok,
            amazonStreams: existing.amazonStreams + agg.amazon,
            otherStreams: existing.otherStreams + agg.other,
            totalRevenue: existing.totalRevenue + agg.revenue
          }
        });
      } else {
        await prisma.royalty.create({
          data: {
            artistId: agg.artistId,
            songName: agg.songName,
            month: agg.month,
            year: agg.year,
            spotifyStreams: agg.spotify,
            appleMusicStreams: agg.apple,
            youtubeStreams: agg.youtube,
            tiktokStreams: agg.tiktok,
            amazonStreams: agg.amazon,
            otherStreams: agg.other,
            totalRevenue: agg.revenue
          }
        });
      }
    }

    // Save Import Log
    const status = failedCount === 0 ? "SUCCESS" : successCount === 0 ? "FAILED" : "PARTIAL";
    
    const importLog = await prisma.importLog.create({
      data: {
        fileName,
        totalRows: rows.length,
        successCount,
        failedCount,
        duplicateCount,
        status,
        unmatchedSongs: {
          create: unmatchedData.map(u => ({
            isrc: u.isrc,
            upc: u.upc,
            title: u.title,
            artist: u.artist,
            reason: u.reason
          }))
        }
      }
    });

    revalidatePath("/admin/streaming");
    revalidatePath("/admin/analytics");
    revalidatePath("/dashboard/streaming");
    
    return { success: true, log: importLog, unmatched: unmatchedData };

  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getImportLogs() {
  try {
    return await prisma.importLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: { unmatchedSongs: true }
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function deleteImportLog(id: string) {
  try {
    await prisma.importLog.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
