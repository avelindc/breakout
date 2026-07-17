import { PrismaClient } from "@prisma/client";
import { Check, X, Download, PlayCircle, Music } from "lucide-react";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { ImageModal } from "@/components/ImageModal";
import { ReleaseActionButtons } from "./ReleaseActionButtons";

const prisma = new PrismaClient();

export default async function AdminReleasesPage() {
  const pendingReleases = await prisma.release.findMany({
    where: { status: 'PENDING' },
    include: { artist: { include: { user: true } }, tracks: true },
    orderBy: { createdAt: 'asc' }
  });

  const approvedReleases = await prisma.release.findMany({
    where: { status: 'APPROVED' },
    include: { artist: { include: { user: true } }, tracks: true },
    orderBy: { updatedAt: 'desc' },
    take: 20
  });



  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Music Review</h1>
          <p className="text-gray-500 text-sm">Review pending uploads from artists.</p>
        </div>
      </div>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            Pending Reviews ({pendingReleases.length})
          </h2>
          
          {pendingReleases.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
              No pending releases to review.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table Header */}
              <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="w-20">Id</div>
                <div className="flex-1">Release Info</div>
                <div className="w-40">Track & Audio</div>
                <div className="w-32">Release Date</div>
                <div className="w-40 flex justify-end">Actions</div>
              </div>

              {pendingReleases.map(release => (
                <div key={release.id} className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:border-blue-300 group">
                  <div className="w-20 text-gray-500 font-medium text-sm">
                    #{release.id.slice(-4).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 flex items-center gap-3">
                    <ImageModal src={release.coverArtworkUrl} alt={release.title} />
                    <div className="overflow-hidden pr-2">
                      <div className="font-bold text-gray-900 truncate" title={release.title}>{release.title}</div>
                      <div className="text-xs text-gray-500 truncate" title={release.primaryArtist}>{release.primaryArtist} • {release.genre}</div>
                    </div>
                  </div>
                  
                  <div className="w-40 flex items-center gap-2">
                    {release.tracks[0] && (
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-gray-700 truncate" title={release.tracks[0].title}>{release.tracks[0].title}</span>
                          <a href={release.tracks[0].audioUrl} target="_blank" download className="text-blue-600 hover:bg-blue-50 p-1 rounded transition" title="Download Audio">
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                        <audio controls src={release.tracks[0].audioUrl} className="h-6 w-32 max-w-full" style={{ transform: 'scale(0.8)', transformOrigin: 'left center' }} />
                      </div>
                    )}
                  </div>
                  
                  <div className="w-32 text-gray-500 text-sm">
                    {new Date(release.releaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                  
                  <div className="w-40 flex justify-end gap-2">
                    <ReleaseActionButtons 
                      releaseId={release.id} 
                      artistUserId={release.artist.userId}
                      userName={release.artist.user.name || "Artist"} 
                      userEmail={release.artist.user.email} 
                      title={release.title} 
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Recently Approved (Latest 20)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {approvedReleases.map(release => (
              <div key={release.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition group">
                <div className="aspect-square bg-gray-100 w-full relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={release.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-gray-900 truncate text-lg mb-1">{release.title}</h4>
                  <p className="text-sm font-medium text-gray-600 truncate">{release.primaryArtist}</p>
                  <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">Approved: {new Date(release.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
