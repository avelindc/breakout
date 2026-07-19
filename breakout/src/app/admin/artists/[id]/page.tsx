import { PrismaClient } from "@prisma/client";
// import { redirect } from "next/navigation";
import { ArtistDetailClient } from "./ArtistDetailClient";

const prisma = new PrismaClient();

export default async function AdminArtistDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      artists: {
        include: {
          royalties: true,
          releases: {
            include: {
              tracks: {
                include: {
                  streams: true
                }
              }
            }
          }
        }
      },
      withdrawRequests: {
        where: {
          status: { in: ['PAID', 'APPROVED'] }
        }
      }
    }
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] text-center text-white">
        <h2 className="text-2xl font-bold mb-4">Account Deleted</h2>
        <p className="text-gray-400 mb-6">This artist account and all associated data have been permanently removed.</p>
        <a href="/admin/artists" className="px-6 py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition">
          Return to Artists List
        </a>
      </div>
    );
  }

  // Calculate statistics
  let totalReleases = 0;
  let totalTracks = 0;
  let totalRoyalties = 0;
  let totalStreams = 0;

  user.artists.forEach(artist => {
    totalReleases += artist.releases.length;
    artist.releases.forEach(release => {
      totalTracks += release.tracks.length;
      release.tracks.forEach(track => {
        totalStreams += track.streams.reduce((acc, stream) => acc + stream.playCount, 0);
      });
    });
    totalRoyalties += artist.royalties.reduce((acc, royalty) => acc + royalty.totalRevenue, 0);
  });

  const totalWithdrawals = user.withdrawRequests.reduce((acc, req) => acc + req.amount, 0);

  // Flatten tracks for easier display in client, injecting release info
  const allTracks = user.artists.flatMap(artist => 
    artist.releases.flatMap(release => 
      release.tracks.map(track => ({
        ...track,
        release: {
          id: release.id,
          title: release.title,
          type: release.type,
          status: release.status,
          releaseDate: release.releaseDate,
          coverArtworkUrl: release.coverArtworkUrl,
          genre: release.genre
        }
      }))
    )
  );

  return (
    <ArtistDetailClient 
      user={user} 
      allTracks={allTracks}
      stats={{
        totalReleases,
        totalTracks,
        totalRoyalties,
        totalStreams,
        totalWithdrawals
      }}
    />
  );
}
