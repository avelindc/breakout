"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import * as XLSX from 'xlsx';
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// Helper to assert admin
async function requireAdmin() {
  const session = await auth();
  // @ts-ignore
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error("Unauthorized");
  }
}

export async function uploadCatalogExcelAction(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) {
      return { error: "No file provided" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    if (workbook.SheetNames.length === 0) {
      return { error: "Excel file is empty" };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Parse to JSON. Assuming first row is header.
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    
    if (rawData.length === 0) {
      return { error: "No data found in the Excel file" };
    }

    let successCount = 0;
    
    // We will use a transaction to insert/update in bulk.
    // However, Prisma doesn't have a simple upsertMany.
    // We will do a batch of individual upserts since data could be tens of thousands.
    // Wait, for tens of thousands, looping 1000 at a time with Promise.all is better.
    
    const BATCH_SIZE = 500;
    
    // First, map and clean the data
    const validRows = [];
    for (const row of rawData as any[]) {
      const getVal = (keys: string[]) => {
        for (const key of Object.keys(row)) {
          if (keys.includes(key.toLowerCase().trim())) {
            return row[key] ? String(row[key]).trim() : null;
          }
        }
        return null;
      };

      const title = getVal(['judul lagu', 'judul', 'title', 'song title', 'track']);
      const artist = getVal(['nama artis', 'artis', 'artist', 'primary artist']);
      const publisher = getVal(['publisher', 'label']);
      const genre = getVal(['genre']);
      const isrc = getVal(['isrc']);
      const duration = getVal(['durasi', 'duration', 'time']);
      const year = getVal(['tahun', 'year']);

      if (!title || !artist) continue;
      validRows.push({ title, artist, publisher, genre, isrc, duration, year });
    }
    
    if (validRows.length === 0) {
      return { error: "No valid data found in the Excel file" };
    }

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      
      const isrcs = batch.map(r => r.isrc).filter(Boolean) as string[];
      const titleArtistPairs = batch.map(r => ({ title: r.title, artist: r.artist }));

      // Fetch existing records for this batch
      const existingRecords = await prisma.catalogSong.findMany({
        where: {
          OR: [
            ...(isrcs.length > 0 ? [{ isrc: { in: isrcs } }] : []),
            ...titleArtistPairs.map(p => ({
              title: { equals: p.title, mode: 'insensitive' as const },
              artist: { equals: p.artist, mode: 'insensitive' as const }
            }))
          ]
        },
        select: { id: true, isrc: true, title: true, artist: true }
      });

      const isrcMap = new Map();
      const titleArtistMap = new Map();
      
      for (const record of existingRecords) {
        if (record.isrc) isrcMap.set(record.isrc, record);
        titleArtistMap.set(`${record.title.toLowerCase()}||${record.artist.toLowerCase()}`, record);
      }

      const toCreate = [];
      const toUpdate = [];

      for (const row of batch) {
        let existing = null;
        if (row.isrc && isrcMap.has(row.isrc)) {
          existing = isrcMap.get(row.isrc);
        } else {
          const key = `${row.title.toLowerCase()}||${row.artist.toLowerCase()}`;
          if (titleArtistMap.has(key)) {
            existing = titleArtistMap.get(key);
          }
        }

        if (existing) {
          toUpdate.push({ id: existing.id, data: row });
        } else {
          toCreate.push(row);
          // To prevent duplicates within the same batch
          if (row.isrc) isrcMap.set(row.isrc, { id: 'temp' });
          titleArtistMap.set(`${row.title.toLowerCase()}||${row.artist.toLowerCase()}`, { id: 'temp' });
        }
      }

      // Execute creations
      if (toCreate.length > 0) {
        await prisma.catalogSong.createMany({
          data: toCreate,
        });
        successCount += toCreate.length;
      }

      // Execute updates
      if (toUpdate.length > 0) {
        await Promise.all(toUpdate.map(item => 
          prisma.catalogSong.update({
            where: { id: item.id },
            data: item.data
          }).catch(e => console.error("Error updating", e))
        ));
        successCount += toUpdate.length;
      }
    }

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    
    return { success: true, count: successCount };

  } catch (error: any) {
    console.error("Excel upload error:", error);
    return { error: error.message || "Failed to process Excel file" };
  }
}

export async function getCatalogSongsAction({
  page = 1,
  limit = 20,
  search = "",
  publisher = "",
  genre = "",
  artist = ""
}: {
  page?: number;
  limit?: number;
  search?: string;
  publisher?: string;
  genre?: string;
  artist?: string;
}) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } }
      ];
    }
    if (publisher) where.publisher = publisher;
    if (genre) where.genre = genre;
    if (artist) where.artist = artist;

    const [songs, total] = await Promise.all([
      prisma.catalogSong.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' }
      }),
      prisma.catalogSong.count({ where })
    ]);

    return { success: true, songs, total };
  } catch (error: any) {
    return { error: error.message || "Failed to fetch catalog" };
  }
}

export async function getCatalogFiltersAction() {
  try {
    // Get unique publishers, genres, artists for dropdowns
    // Since prisma distinct is slow on large tables, we might just fetch the most common ones or use distinct.
    const publishers = await prisma.catalogSong.findMany({
      distinct: ['publisher'],
      select: { publisher: true },
      where: { publisher: { not: null } }
    });
    
    const genres = await prisma.catalogSong.findMany({
      distinct: ['genre'],
      select: { genre: true },
      where: { genre: { not: null } }
    });
    
    return {
      success: true,
      publishers: publishers.map(p => p.publisher).filter(Boolean).sort(),
      genres: genres.map(g => g.genre).filter(Boolean).sort()
    };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCatalogSongAction(id: string) {
  try {
    await requireAdmin();
    await prisma.catalogSong.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete song" };
  }
}

export async function deleteAllCatalogAction() {
  try {
    await requireAdmin();
    await prisma.catalogSong.deleteMany({});
    revalidatePath("/admin/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to clear catalog" };
  }
}
