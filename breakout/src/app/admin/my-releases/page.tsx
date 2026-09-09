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

  const serializedReleases = approvedReleases.map(release => {
    const releaseDateStr = release.releaseDate instanceof Date && !isNaN(release.releaseDate.getTime())
      ? release.releaseDate.toISOString()
      : new Date().toISOString();

    return {
      id: release.id,
      title: release.title,
      genre: release.genre,
      language: release.language,
      primaryArtist: release.primaryArtist,
      featuredArtist: release.featuredArtist || null,
      releaseDate: releaseDateStr,
      coverArtworkUrl: release.coverArtworkUrl,
      status: release.status,
      artistUserId: release.artist?.userId || "",
      artistName: release.artist?.user?.name || "Artist",
      artistEmail: release.artist?.user?.email || "",
      tracks: (release.tracks || []).map(t => ({
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
    };
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Releases (Katalog Aktif)</h1>
          <p className="text-gray-500 text-sm">Kelola rilisan musik resmi yang telah disetujui & didistribusikan.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-50 border border-purple-100 text-purple-700 rounded-2xl text-xs font-bold shadow-sm">
            🎵 Total: <span className="font-extrabold text-sm">{approvedReleases.length}</span> Rilisan
          </div>
        </div>
      </div>

      <MyReleasesList releases={serializedReleases} />
    </div>
  );
}
