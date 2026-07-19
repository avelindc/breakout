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
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 sm:px-6 lg:px-8 w-full">
      <div className="mb-8 bg-white p-5 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-full overflow-hidden">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Daftar Semua Artis</h1>
        <p className="text-gray-500 text-xs sm:text-sm">Menampilkan artis tambahan dan artis utama yang sudah memiliki rilis lagu</p>

        <div className="mt-6 sm:mt-8 overflow-x-auto pb-4 scrollbar-hide w-full">
          <AllArtistsClient artists={artists as any} />
        </div>
      </div>
    </div>
  );
}
