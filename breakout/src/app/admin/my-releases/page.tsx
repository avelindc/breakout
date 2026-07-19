import { PrismaClient } from "@prisma/client";
import { MyReleasesList } from "./MyReleasesList";

const prisma = new PrismaClient();

export default async function AdminMyReleasesPage() {
  // Fetch only approved (released/active catalog) releases
  const approvedReleases = await prisma.release.findMany({
    where: { status: 'APPROVED', isImported: false },
    include: { 
      artist: { include: { user: true } }, 
      tracks: true 
    },
    orderBy: { updatedAt: 'desc' }
  });

  const serializedReleases = approvedReleases.map(release => ({
    id: release.id,
    title: release.title,
    genre: release.genre,
    language: release.language,
    primaryArtist: release.primaryArtist,
    featuredArtist: release.featuredArtist,
    releaseDate: release.releaseDate.toISOString(),
    coverArtworkUrl: release.coverArtworkUrl,
    status: release.status,
    artistUserId: release.artist.userId,
    artistName: release.artist.user.name || "Artist",
    artistEmail: release.artist.user.email,
    tracks: release.tracks.map(t => ({
      id: t.id,
      title: t.title,
      audioUrl: t.audioUrl,
      composer: t.composer || null,
      producer: t.producer || null,
      lyrics: t.lyrics || null,
      isrc: t.isrc || null,
      upc: t.upc || null,
      tiktokClipStart: t.tiktokClipStart || null,
    }))
  }));

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Releases</h1>
          <p className="text-gray-500 text-sm">Kelola katalog musik aktif yang sudah disetujui untuk didistribusikan.</p>
        </div>
      </div>

      {approvedReleases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 shadow-sm font-semibold">
          Belum ada rilisan aktif yang disetujui.
        </div>
      ) : (
        <MyReleasesList releases={serializedReleases} />
      )}
    </div>
  );
}
