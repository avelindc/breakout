"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
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

import { createClient } from "@supabase/supabase-js";

// Helper to upload file to supabase
async function uploadToSupabase(file: File, folder: string) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) throw new Error("Supabase credentials missing");
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const ext = file.name.split('.').pop();
  const fileName = `${folder}/catalog-${Date.now()}-${Math.floor(Math.random()*1000)}.${ext}`;
  
  const buffer = Buffer.from(await file.arrayBuffer());
  
  const { data, error } = await supabase.storage
    .from('releases') // reusing releases bucket
    .upload(fileName, buffer, { contentType: file.type, upsert: false });
    
  if (error) throw new Error(`Upload failed: ${error.message}`);
  
  const { data: { publicUrl } } = supabase.storage
    .from('releases')
    .getPublicUrl(fileName);
    
  return publicUrl;
}

export async function createCatalogSongAction(formData: FormData) {
  try {
    await requireAdmin();

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const vokal = formData.get("vokal") as string;
    const publisher = formData.get("publisher") as string;
    const genre = formData.get("genre") as string;
    const driveLink = formData.get("driveLink") as string;
    const isActive = (formData.getAll("isActive") as string[]).includes("true");
    const isDownloadable = (formData.getAll("isDownloadable") as string[]).includes("true");

    const coverFile = formData.get("coverFile") as File | null;
    const audioFile = formData.get("audioFile") as File | null;

    if (!title || !artist) {
      return { error: "Judul dan Artis wajib diisi" };
    }
    if (!audioFile || audioFile.size === 0) {
      return { error: "File MP3 wajib diupload untuk lagu baru." };
    }

    let coverUrl = null;
    let audioUrl = null;

    if (coverFile && coverFile.size > 0) coverUrl = await uploadToSupabase(coverFile, 'covers');
    if (audioFile && audioFile.size > 0) audioUrl = await uploadToSupabase(audioFile, 'audio');

    await prisma.catalogSong.create({
      data: {
        title, artist,
        vokal: vokal || null,
        publisher: publisher || null,
        genre: genre || null,
        driveLink: driveLink || null,
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
    return { error: error.message || "Gagal menambah lagu" };
  }
}

export async function updateCatalogSongAction(id: string, formData: FormData) {
  try {
    await requireAdmin();

    const song = await prisma.catalogSong.findUnique({ where: { id } });
    if (!song) return { error: "Lagu tidak ditemukan" };

    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    const vokal = formData.get("vokal") as string;
    const publisher = formData.get("publisher") as string;
    const genre = formData.get("genre") as string;
    const driveLink = formData.get("driveLink") as string;
    const isActive = (formData.getAll("isActive") as string[]).includes("true");
    const isDownloadable = (formData.getAll("isDownloadable") as string[]).includes("true");

    const coverFile = formData.get("coverFile") as File | null;
    const audioFile = formData.get("audioFile") as File | null;

    let coverUrl = song.coverUrl;
    let audioUrl = song.audioUrl;

    if (coverFile && coverFile.size > 0) coverUrl = await uploadToSupabase(coverFile, 'covers');
    if (audioFile && audioFile.size > 0) audioUrl = await uploadToSupabase(audioFile, 'audio');

    await prisma.catalogSong.update({
      where: { id },
      data: {
        title: title || song.title,
        artist: artist || song.artist,
        vokal: vokal || null,
        publisher: publisher || null,
        genre: genre || null,
        driveLink: driveLink || null,
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
    return { error: error.message || "Gagal mengupdate lagu" };
  }
}

export async function deleteCatalogSongAction(id: string) {
  try {
    await requireAdmin();
    await prisma.catalogSong.delete({ where: { id } });
    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus lagu" };
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
    return { error: error.message || "Gagal menghapus semua katalog" };
  }
}

export async function toggleCatalogSongStatusAction(id: string, field: 'isActive') {
  try {
    await requireAdmin();
    const song = await prisma.catalogSong.findUnique({ where: { id } });
    if (!song) return { error: "Lagu tidak ditemukan" };

    await prisma.catalogSong.update({
      where: { id },
      data: { [field]: !song[field] }
    });

    revalidatePath("/admin/catalog");
    revalidatePath("/dashboard/catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal mengubah status" };
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
    
    // Only users should see active songs
    if (!isAdmin) {
      where.isActive = true;
    }
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
        { vokal: { contains: search, mode: "insensitive" } },
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
    return { error: error.message || "Gagal mengambil data katalog" };
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
