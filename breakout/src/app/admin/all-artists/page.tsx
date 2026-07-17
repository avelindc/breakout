import { PrismaClient } from "@prisma/client";
import { AllArtistsClient } from "./AllArtistsClient";

const prisma = new PrismaClient();

export default async function AllArtistsPage() {
  // Get all artists with their user and releases
  const allArtists = await prisma.artist.findMany({
    include: {
      user: {
        include: {
          artists: {
            orderBy: { createdAt: 'asc' },
            select: { id: true }
          }
        }
      },
      releases: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  // Filter artists:
  // Show additional artists OR primary artists that have at least one release.
  const artists = allArtists.filter(artist => {
    const primaryArtistId = artist.user?.artists[0]?.id;
    const isAdditionalArtist = artist.id !== primaryArtistId;
    const hasReleases = artist.releases.length > 0;
    return isAdditionalArtist || hasReleases;
  });

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Daftar Semua Artis</h1>
        <p className="text-gray-500 text-sm">Menampilkan artis tambahan dan artis utama yang sudah memiliki rilis lagu</p>

        <div className="mt-8 overflow-x-auto pb-4 scrollbar-hide">
          <AllArtistsClient artists={artists as any} />
        </div>
      </div>
    </div>
  );
}
