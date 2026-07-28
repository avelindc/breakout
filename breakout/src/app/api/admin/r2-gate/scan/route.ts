import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filesToMigrate: any[] = [];
    const supabaseDomain = "supabase.co";

    // 1. Releases
    const releases = await prisma.release.findMany({
      where: { coverArtworkUrl: { contains: supabaseDomain } },
      select: { id: true, coverArtworkUrl: true, title: true }
    });
    releases.forEach(r => filesToMigrate.push({
      table: 'Release', id: r.id, column: 'coverArtworkUrl', url: r.coverArtworkUrl, name: `Cover: ${r.title}`
    }));

    // 2. Tracks
    const tracks = await prisma.track.findMany({
      where: { audioUrl: { contains: supabaseDomain } },
      select: { id: true, audioUrl: true, title: true }
    });
    tracks.forEach(t => filesToMigrate.push({
      table: 'Track', id: t.id, column: 'audioUrl', url: t.audioUrl, name: `Audio: ${t.title}`
    }));

    // 3. Users
    const users = await prisma.user.findMany({
      where: { OR: [{ image: { contains: supabaseDomain } }, { ktpUrl: { contains: supabaseDomain } }] },
      select: { id: true, image: true, ktpUrl: true, name: true }
    });
    users.forEach(u => {
      if (u.image?.includes(supabaseDomain)) filesToMigrate.push({ table: 'User', id: u.id, column: 'image', url: u.image, name: `Avatar: ${u.name}` });
      if (u.ktpUrl?.includes(supabaseDomain)) filesToMigrate.push({ table: 'User', id: u.id, column: 'ktpUrl', url: u.ktpUrl, name: `KTP: ${u.name}` });
    });

    // 4. Artists
    const artists = await prisma.artist.findMany({
      where: { avatarUrl: { contains: supabaseDomain } },
      select: { id: true, avatarUrl: true, stageName: true }
    });
    artists.forEach(a => filesToMigrate.push({
      table: 'Artist', id: a.id, column: 'avatarUrl', url: a.avatarUrl, name: `Artist Avatar: ${a.stageName}`
    }));

    // 5. Contracts
    const contracts = await prisma.contract.findMany({
      where: { OR: [{ pdfUrl: { contains: supabaseDomain } }, { signatureUrl: { contains: supabaseDomain } }] },
      select: { id: true, pdfUrl: true, signatureUrl: true }
    });
    contracts.forEach(c => {
      if (c.pdfUrl?.includes(supabaseDomain)) filesToMigrate.push({ table: 'Contract', id: c.id, column: 'pdfUrl', url: c.pdfUrl, name: `Contract PDF: ${c.id}` });
      if (c.signatureUrl?.includes(supabaseDomain)) filesToMigrate.push({ table: 'Contract', id: c.id, column: 'signatureUrl', url: c.signatureUrl, name: `Signature: ${c.id}` });
    });

    // 6. Messages
    const messages = await prisma.message.findMany({
      where: { attachment: { contains: supabaseDomain } },
      select: { id: true, attachment: true }
    });
    messages.forEach(m => filesToMigrate.push({
      table: 'Message', id: m.id, column: 'attachment', url: m.attachment!, name: `Attachment: ${m.id}`
    }));

    // (Settings excluded because it contains JSON strings with multiple URLs)

    // 7. CatalogSong
    const catalog = await prisma.catalogSong.findMany({
      where: { OR: [{ coverUrl: { contains: supabaseDomain } }, { audioUrl: { contains: supabaseDomain } }] },
      select: { id: true, coverUrl: true, audioUrl: true, title: true }
    });
    catalog.forEach(c => {
      if (c.coverUrl?.includes(supabaseDomain)) filesToMigrate.push({ table: 'CatalogSong', id: c.id, column: 'coverUrl', url: c.coverUrl, name: `CatCover: ${c.title}` });
      if (c.audioUrl?.includes(supabaseDomain)) filesToMigrate.push({ table: 'CatalogSong', id: c.id, column: 'audioUrl', url: c.audioUrl, name: `CatAudio: ${c.title}` });
    });

    return NextResponse.json({ success: true, count: filesToMigrate.length, files: filesToMigrate });
  } catch (error: any) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
