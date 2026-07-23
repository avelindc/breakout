"use server";

import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();

export async function getCoverUploadUrlAction(ext: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  // @ts-ignore
  if (session.user.role !== "ADMIN") return { error: "Admin access required" };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!supabaseUrl || !supabaseKey) return { error: "Supabase credentials missing" };

  const supabase = createClient(supabaseUrl, supabaseKey);
  const path = `covers/import-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage
    .from("releases")
    .createSignedUploadUrl(path);
  if (error || !data) return { error: "Failed to generate cover upload URL" };

  return { success: true, path, signedUrl: data.signedUrl, token: data.token };
}

export async function importExistingReleaseAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  // @ts-ignore
  if (session.user.role !== "ADMIN") return { error: "Admin access required" };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";

  try {
    // --- Required fields ---
    const artistName = (formData.get("artistName") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const genre = (formData.get("genre") as string)?.trim();
    const language = (formData.get("language") as string)?.trim();
    const releaseDateStr = formData.get("releaseDate") as string;
    const coverPath = formData.get("coverPath") as string;

    if (!artistName || !title || !genre || !language || !releaseDateStr || !coverPath) {
      return { error: "Semua field wajib harus diisi (artis, judul, genre, bahasa, tanggal, cover)." };
    }

    // --- Optional fields ---
    const album = (formData.get("album") as string)?.trim() || null;
    const releaseType = (formData.get("releaseType") as string) || "SINGLE";
    const distributor = (formData.get("distributor") as string)?.trim() || null;
    const upc = (formData.get("upc") as string)?.trim() || null;
    const isrc = (formData.get("isrc") as string)?.trim() || null;
    const spotifyUrl = (formData.get("spotifyUrl") as string)?.trim() || null;
    const appleMusicUrl = (formData.get("appleMusicUrl") as string)?.trim() || null;
    const youtubeMusicUrl = (formData.get("youtubeMusicUrl") as string)?.trim() || null;
    const tiktokUrl = (formData.get("tiktokUrl") as string)?.trim() || null;
    const targetArtistId = (formData.get("artistId") as string)?.trim() || null;

    const releaseDate = new Date(releaseDateStr);
    const coverArtworkUrl = `${supabaseUrl}/storage/v1/object/public/releases/${coverPath}`;

    // Find or use the specified artist. If no artistId given, find/create by name.
    let artistRecord: { id: string } | null = null;

    if (targetArtistId) {
      artistRecord = await prisma.artist.findUnique({ where: { id: targetArtistId } });
    }

    if (!artistRecord) {
      // Try to find by stage name
      artistRecord = await prisma.artist.findFirst({
        where: { stageName: { equals: artistName, mode: "insensitive" } }
      });
    }

    if (!artistRecord) {
      // Create a placeholder artist linked to admin user
      const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (!adminUser) return { error: "Admin user not found" };

      artistRecord = await prisma.artist.create({
        data: {
          userId: adminUser.id,
          stageName: artistName,
        }
      });
    }

    const release = await prisma.release.create({
      data: {
        artistId: artistRecord.id,
        title,
        type: releaseType as any,
        genre,
        language,
        primaryArtist: artistName,
        releaseDate,
        coverArtworkUrl,
        status: "RELEASED",
        isImported: true,
        upc,
        distributor,
        spotifyUrl,
        appleMusicUrl,
        youtubeMusicUrl,
        tiktokUrl,
        tracks: {
          create: {
            title,
            audioUrl: "",    // No audio needed for existing releases
            isrc,
            upc,
          }
        }
      }
    });

    revalidatePath("/dashboard/releases");
    revalidatePath("/dashboard/catalog");
    revalidatePath("/admin/releases");
    revalidatePath("/admin/existing-releases");

    return { success: true, releaseId: release.id };
  } catch (error: any) {
    console.error("Import release error:", error);
    return { error: error.message || "Gagal mengimport release." };
  }
}

export async function getArtistsForImportAction() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  // @ts-ignore
  if (session.user.role !== "ADMIN") return { error: "Admin access required" };

  const artists = await prisma.artist.findMany({
    select: { id: true, stageName: true, user: { select: { name: true, email: true } } },
    orderBy: { stageName: "asc" }
  });
  return { success: true, artists };
}

export async function deleteImportedReleaseAction(releaseId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  // @ts-ignore
  if (session.user.role !== "ADMIN") return { error: "Admin access required" };

  const release = await prisma.release.findUnique({ where: { id: releaseId } });
  if (!release || !release.isImported) return { error: "Release tidak ditemukan atau bukan release import." };

  await prisma.release.delete({ where: { id: releaseId } });

  revalidatePath("/admin/existing-releases");
  revalidatePath("/dashboard/releases");

  return { success: true };
}
