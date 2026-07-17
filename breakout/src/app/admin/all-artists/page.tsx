import { PrismaClient } from "@prisma/client";
import { Users } from "lucide-react";
import Link from "next/link";

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
  // This prevents the list from being cluttered with newly registered users who haven't done anything yet.
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
          <div className="min-w-[900px] space-y-3">
            {/* Table Header */}
            <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <div className="w-20">ID</div>
              <div className="flex-1">Stage Name</div>
              <div className="flex-1">Managed By (User)</div>
              <div className="w-32 text-center">Releases</div>
              <div className="w-40">Created At</div>
            </div>

            {artists.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                No artists found.
              </div>
            )}

            {/* Artist Rows */}
            {artists.map((artist) => (
              <div 
                key={artist.id} 
                className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:bg-gray-50 group"
              >
                <div className="w-20 text-gray-500 font-medium text-sm">
                  #{artist.id.slice(-4).toUpperCase()}
                </div>
                
                <div className="flex-1 pr-4">
                  <Link href={`/admin/artists/${artist.userId}`} className="flex items-center gap-3 w-max">
                    {artist.avatarUrl || artist.user.image ? (
                      <img 
                        src={artist.avatarUrl || artist.user.image!} 
                        alt={artist.stageName} 
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.stageName}`}
                        alt={artist.stageName} 
                        className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0"
                      />
                    )}
                    <span className="font-bold text-gray-900 truncate hover:underline">{artist.stageName}</span>
                  </Link>
                </div>
                
                <div className="flex-1 text-gray-500 text-sm pr-4 truncate flex flex-col">
                  <span className="font-medium text-gray-700">{artist.user.name || "Unknown"}</span>
                  <span className="text-xs">{artist.user.email}</span>
                </div>
                
                <div className="w-32 text-center font-semibold text-gray-900">
                  {artist.releases.length}
                </div>
                
                <div className="w-40 text-gray-500 text-sm">
                  {new Date(artist.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
