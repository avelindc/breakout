"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

async function requireAdmin() {
  const session = await auth();
  // @ts-ignore
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

// ─── IMPORT FROM EXCEL ─────────────────────────────────────────────────────────
export async function importPublisherCatalogExcelAction(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Tidak ada file yang diupload" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });

    if (workbook.SheetNames.length === 0) return { error: "File Excel kosong" };

    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as any[];

    if (rawData.length === 0) return { error: "Tidak ada data dalam file Excel" };

    const getVal = (row: any, keys: string[]) => {
      for (const key of Object.keys(row)) {
        if (keys.some(k => key.toLowerCase().trim().includes(k.toLowerCase()))) {
          return row[key] ? String(row[key]).trim() : null;
        }
      }
      return null;
    };

    const validRows: any[] = [];
    for (const row of rawData) {
      const title = getVal(row, ["judul", "title", "song", "lagu", "track"]);
      const artist = getVal(row, ["artis", "artist", "pengarang", "pencipta", "creator"]);
      if (!title || !artist) continue;

      validRows.push({
        title,
        artist,
        publisher: getVal(row, ["publisher", "label", "penerbit"]),
        composer: getVal(row, ["composer", "komposer", "arranger", "arr"]),
        isrc: getVal(row, ["isrc"]),
        upc: getVal(row, ["upc"]),
        album: getVal(row, ["album"]),
        year: getVal(row, ["year", "tahun", "rilis"]),
      });
    }

    if (validRows.length === 0) return { error: "Tidak ada baris data yang valid (Judul & Artis wajib ada)" };

    const BATCH = 500;
    let count = 0;
    for (let i = 0; i < validRows.length; i += BATCH) {
      await prisma.publisherCatalogSong.createMany({ data: validRows.slice(i, i + BATCH) });
      count += validRows.slice(i, i + BATCH).length;
    }

    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true, count };
  } catch (error: any) {
    return { error: error.message || "Gagal import Excel" };
  }
}

// ─── IMPORT FROM PDF ───────────────────────────────────────────────────────────
export async function importPublisherCatalogPdfAction(formData: FormData) {
  try {
    await requireAdmin();

    const file = formData.get("file") as File | null;
    if (!file) return { error: "Tidak ada file yang diupload" };

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dynamic import to avoid build issues
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
    const data = await pdfParse(buffer);
    const text = data.text;

    if (!text || text.trim().length === 0) return { error: "PDF tidak memiliki teks yang dapat dibaca" };

    // Parse lines: look for patterns like "Title - Artist - Publisher"
    const lines = text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 3);
    const rows: any[] = [];

    for (const line of lines) {
      // Try tab-separated or pipe-separated or dash-separated
      let parts: string[] = [];
      if (line.includes("\t")) {
        parts = line.split("\t").map((p: string) => p.trim());
      } else if (line.includes("|")) {
        parts = line.split("|").map((p: string) => p.trim());
      } else if (line.includes(" - ")) {
        parts = line.split(" - ").map((p: string) => p.trim());
      } else {
        continue; // skip non-structured lines
      }

      if (parts.length >= 2 && parts[0] && parts[1]) {
        rows.push({
          title: parts[0] || null,
          artist: parts[1] || null,
          publisher: parts[2] || null,
          composer: parts[3] || null,
          isrc: parts[4] || null,
          upc: parts[5] || null,
          album: parts[6] || null,
          year: parts[7] || null,
        });
      }
    }

    if (rows.length === 0) {
      return { error: "Tidak dapat mengenali format data dalam PDF. Gunakan format: Judul - Artis - Publisher (dipisah tanda -)" };
    }

    const BATCH = 500;
    let count = 0;
    for (let i = 0; i < rows.length; i += BATCH) {
      await prisma.publisherCatalogSong.createMany({ data: rows.slice(i, i + BATCH) });
      count += rows.slice(i, i + BATCH).length;
    }

    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true, count };
  } catch (error: any) {
    return { error: error.message || "Gagal import PDF" };
  }
}

// ─── CRUD ──────────────────────────────────────────────────────────────────────
export async function createPublisherCatalogSongAction(formData: FormData) {
  try {
    await requireAdmin();
    const title = formData.get("title") as string;
    const artist = formData.get("artist") as string;
    if (!title || !artist) return { error: "Judul dan Artis wajib diisi" };

    await prisma.publisherCatalogSong.create({
      data: {
        title,
        artist,
        publisher: (formData.get("publisher") as string) || null,
        composer: (formData.get("composer") as string) || null,
        isrc: (formData.get("isrc") as string) || null,
        upc: (formData.get("upc") as string) || null,
        album: (formData.get("album") as string) || null,
        year: (formData.get("year") as string) || null,
      },
    });

    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menambah lagu" };
  }
}

export async function updatePublisherCatalogSongAction(id: string, formData: FormData) {
  try {
    await requireAdmin();
    await prisma.publisherCatalogSong.update({
      where: { id },
      data: {
        title: (formData.get("title") as string) || undefined,
        artist: (formData.get("artist") as string) || undefined,
        publisher: (formData.get("publisher") as string) || null,
        composer: (formData.get("composer") as string) || null,
        isrc: (formData.get("isrc") as string) || null,
        upc: (formData.get("upc") as string) || null,
        album: (formData.get("album") as string) || null,
        year: (formData.get("year") as string) || null,
      },
    });

    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal mengupdate lagu" };
  }
}

export async function deletePublisherCatalogSongAction(id: string) {
  try {
    await requireAdmin();
    await prisma.publisherCatalogSong.delete({ where: { id } });
    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus lagu" };
  }
}

export async function deleteAllPublisherCatalogAction() {
  try {
    await requireAdmin();
    await prisma.publisherCatalogSong.deleteMany({});
    revalidatePath("/admin/publisher-catalog");
    revalidatePath("/dashboard/publisher-catalog");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Gagal menghapus semua data" };
  }
}

// ─── READ ──────────────────────────────────────────────────────────────────────
export async function getPublisherCatalogAction({
  page = 1,
  limit = 20,
  search = "",
  publisher = "",
  artist = "",
}: {
  page?: number;
  limit?: number;
  search?: string;
  publisher?: string;
  artist?: string;
}) {
  try {
    const skip = (page - 1) * limit;
    const where: any = {};

    const conditions: any[] = [];
    if (search) {
      conditions.push(
        { title: { contains: search, mode: "insensitive" } },
        { artist: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
        { isrc: { contains: search, mode: "insensitive" } }
      );
    }
    if (conditions.length > 0) where.OR = conditions;
    if (publisher) where.publisher = { contains: publisher, mode: "insensitive" };
    if (artist) where.artist = { contains: artist, mode: "insensitive" };

    const [songs, total] = await Promise.all([
      prisma.publisherCatalogSong.findMany({ where, skip, take: limit, orderBy: { title: "asc" } }),
      prisma.publisherCatalogSong.count({ where }),
    ]);

    return { success: true, songs, total };
  } catch (error: any) {
    return { error: error.message || "Gagal mengambil data" };
  }
}

export async function getPublisherCatalogFiltersAction() {
  try {
    const publishers = await prisma.publisherCatalogSong.findMany({
      distinct: ["publisher"],
      select: { publisher: true },
      where: { publisher: { not: null } },
    });
    return {
      success: true,
      publishers: publishers.map((p) => p.publisher).filter(Boolean).sort() as string[],
    };
  } catch (error: any) {
    return { error: error.message };
  }
}
