"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to assert admin
async function requireAdmin() {
  const session = await auth();
  // @ts-ignore
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    throw new Error("Unauthorized");
  }
}

export async function createCatalogSongAction(formData: FormData) {
  try {
    await requireAdmin();

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const publisher = formData.get("publisher") as string;
    const genre = formData.get("genre") as string;
    const isDownloadable = formData.get("isDownloadable") === "true";
    const isActive = formData.get("isActive") !== "false"; // default true
    
    const coverFile = formData.get("cover") as File | null;
    const audioFile = formData.get("audio") as File | null;

    if (!title || !artist) {
      return { error: "Title and artist are required" };
    }

    if (!supabase) {
      return { error: "Supabase credentials missing" };
    }

    let coverUrl = null;
    let audioUrl = null;

    const timestamp = Date.now();

    // Upload Cover
    if (coverFile && coverFile.size > 0) {
      const coverPath = `catalog/covers/${timestamp}_${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: coverData, error: coverError } = await supabase.storage
        .from("releases")
        .upload(coverPath, coverFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (coverError) return { error: `Failed to upload cover: ${coverError.message}` };
      coverUrl = `${supabaseUrl}/storage/v1/object/public/releases/${coverPath}`;
    }

    // Upload Audio
    if (audioFile && audioFile.size > 0) {
      const audioPath = `catalog/audio/${timestamp}_${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data: audioData, error: audioError } = await supabase.storage
        .from("releases")
        .upload(audioPath, audioFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (audioError) return { error: `Failed to upload audio: ${audioError.message}` };
      audioUrl = `${supabaseUrl}/storage/v1/object/public/releases/${audioPath}`;
    }

    await prisma.catalogSong.create({
      data: {
        title,
        artist,
        publisher,
        genre,
        coverUrl,
        audioUrl,
        isDownloadable,
        isActive,
      }
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    
    return { success: true };

  } catch (error: any) {
    console.error("Create catalog song error:", error);
    return { error: error.message || "Failed to create catalog song" };
  }
}

export async function updateCatalogSongAction(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const song = await prisma.catalogSong.findUnique({ where: { id } });
    if (!song) return { error: "Song not found" };

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const publisher = formData.get("publisher") as string;
    const genre = formData.get("genre") as string;
    const isDownloadable = formData.get("isDownloadable") === "true";
    const isActive = formData.get("isActive") !== "false";
    
    const coverFile = formData.get("cover") as File | null;
    const audioFile = formData.get("audio") as File | null;

    if (!supabase) return { error: "Supabase credentials missing" };

    let coverUrl = song.coverUrl;
    let audioUrl = song.audioUrl;
    const timestamp = Date.now();

    // Upload Cover if new one provided
    if (coverFile && coverFile.size > 0) {
      const coverPath = `catalog/covers/${timestamp}_${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: coverError } = await supabase.storage
        .from("releases")
        .upload(coverPath, coverFile, { cacheControl: "3600", upsert: false });

      if (coverError) return { error: `Failed to upload cover: ${coverError.message}` };
      coverUrl = `${supabaseUrl}/storage/v1/object/public/releases/${coverPath}`;
    }

    // Upload Audio if new one provided
    if (audioFile && audioFile.size > 0) {
      const audioPath = `catalog/audio/${timestamp}_${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error: audioError } = await supabase.storage
        .from("releases")
        .upload(audioPath, audioFile, { cacheControl: "3600", upsert: false });

      if (audioError) return { error: `Failed to upload audio: ${audioError.message}` };
      audioUrl = `${supabaseUrl}/storage/v1/object/public/releases/${audioPath}`;
    }

    await prisma.catalogSong.update({
      where: { id },
      data: {
        title: title || song.title,
        artist: artist || song.artist,
        publisher,
        genre,
        coverUrl,
        audioUrl,
        isDownloadable,
        isActive,
      }
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    
    return { success: true };

  } catch (error: any) {
    console.error("Update catalog song error:", error);
    return { error: error.message || "Failed to update catalog song" };
  }
}

export async function deleteCatalogSongAction(id: string) {
  try {
    await requireAdmin();
    const song = await prisma.catalogSong.findUnique({ where: { id } });
    if (!song) return { error: "Song not found" };

    // Optional: Delete from Supabase storage if needed to save space
    // If coverUrl exists, extract path and delete
    if (supabase && song.coverUrl && song.coverUrl.includes('/storage/v1/object/public/releases/')) {
      const path = song.coverUrl.split('/storage/v1/object/public/releases/')[1];
      if (path) await supabase.storage.from('releases').remove([path]);
    }
    if (supabase && song.audioUrl && song.audioUrl.includes('/storage/v1/object/public/releases/')) {
      const path = song.audioUrl.split('/storage/v1/object/public/releases/')[1];
      if (path) await supabase.storage.from('releases').remove([path]);
    }

    await prisma.catalogSong.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete song" };
  }
}

export async function toggleCatalogSongStatusAction(id: string, field: 'isActive' | 'isDownloadable') {
  try {
    await requireAdmin();
    const song = await prisma.catalogSong.findUnique({ where: { id } });
    if (!song) return { error: "Song not found" };

    await prisma.catalogSong.update({
      where: { id },
      data: {
        [field]: !song[field]
      }
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to toggle status" };
  }
}

export async function getCatalogSongsAction({
  page = 1,
  limit = 20,
  search = "",
  publisher = "",
  genre = "",
  isAdmin = false
}: {
  page?: number;
  limit?: number;
  search?: string;
  publisher?: string;
  genre?: string;
  isAdmin?: boolean;
}) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {};
    
    // Only users should see active songs, admins can see all
    if (!isAdmin) {
      where.isActive = true;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } }
      ];
    }
    if (publisher) where.publisher = publisher;
    if (genre) where.genre = genre;

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

export async function deleteAllCatalogAction() {
  try {
    await requireAdmin();
    await prisma.catalogSong.deleteMany({});
    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete all catalog songs" };
  }
}

export async function getCatalogFiltersAction() {
  try {
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
