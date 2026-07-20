import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Disc, Music, User, Calendar, Tag, Hash, FileAudio, Settings } from "lucide-react";

const prisma = new PrismaClient();

export default async function ReleaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const release = await prisma.release.findUnique({
    where: { id: id },
    include: {
      artist: true,
      tracks: true,
    }
  });

  if (!release) notFound();

  // Verify ownership
  if (release.artist.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10 px-4 md:px-0">
      <Link href="/dashboard/releases" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold mb-6 transition">
        <ArrowLeft className="w-5 h-5" /> Back to My Releases
      </Link>

      {/* Header Card */}
      <div className="bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white p-6 md:p-10 rounded-[2rem] shadow-xl border border-white/10 mb-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-40 h-40 md:w-56 md:h-56 shrink-0 rounded-2xl overflow-hidden shadow-2xl bg-white/10">
          <img src={release.coverArtworkUrl} alt={release.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">{release.type}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              release.status === 'RELEASED' || release.status === 'APPROVED' ? 'bg-green-500/20 text-green-300' : 
              release.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-300' : 
              release.status === 'REVIEW' ? 'bg-blue-500/20 text-blue-300' : 
              release.status === 'PROCESSING' ? 'bg-orange-500/20 text-orange-300' : 
              'bg-red-500/20 text-red-300'
            }`}>
              {release.status}
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-2 leading-tight truncate">{release.title}</h1>
          <div className="text-xl font-medium text-white/90 mb-6 flex items-center gap-2 truncate">
            <User className="w-5 h-5 shrink-0" /> <span className="truncate">{release.primaryArtist} {release.featuredArtist ? `ft. ${release.featuredArtist}` : ''}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm font-medium text-white/80">
            <div>
              <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Genre</div>
              <div className="flex items-center gap-1.5 truncate"><Music className="w-4 h-4 shrink-0" /> {release.genre}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Language</div>
              <div className="flex items-center gap-1.5 truncate"><Tag className="w-4 h-4 shrink-0" /> {release.language}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">Release Date</div>
              <div className="flex items-center gap-1.5 truncate"><Calendar className="w-4 h-4 shrink-0" /> {new Date(release.releaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs mb-1 uppercase tracking-wider">ID Release</div>
              <div className="flex items-center gap-1.5 font-mono truncate"><Hash className="w-4 h-4 shrink-0" /> #{release.id.slice(-6).toUpperCase()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Tracks Section */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2 mb-4"><FileAudio className="w-6 h-6 text-blue-600" /> Tracks</h2>
          
          <div className="space-y-4">
            {release.tracks.map((track, i) => (
              <div key={track.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{i + 1}. {track.title}</h3>
                    <p className="text-sm text-gray-500 font-medium mt-1">TikTok Clip Start: <span className="text-gray-800 font-mono bg-gray-100 px-2 py-0.5 rounded">{track.tiktokClipStart || "00:00"}</span></p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 w-full mt-2">
                  <audio controls className="w-full h-12 outline-none" preload="none">
                    <source src={track.audioUrl} type="audio/mpeg" />
                    <source src={track.audioUrl} type="audio/wav" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                  {track.composer && (
                    <div className="min-w-0">
                      <span className="text-gray-500 text-xs block mb-0.5 truncate">Composer</span>
                      <span className="font-semibold text-gray-900 block truncate">{track.composer}</span>
                    </div>
                  )}
                  {track.producer && (
                    <div className="min-w-0">
                      <span className="text-gray-500 text-xs block mb-0.5 truncate">Producer</span>
                      <span className="font-semibold text-gray-900 block truncate">{track.producer}</span>
                    </div>
                  )}
                  {track.isrc && (
                    <div className="min-w-0">
                      <span className="text-gray-500 text-xs block mb-0.5 truncate">ISRC</span>
                      <span className="font-mono font-semibold text-gray-900 block truncate">{track.isrc}</span>
                    </div>
                  )}
                  {track.upc && (
                    <div className="min-w-0">
                      <span className="text-gray-500 text-xs block mb-0.5 truncate">UPC</span>
                      <span className="font-mono font-semibold text-gray-900 block truncate">{track.upc}</span>
                    </div>
                  )}
                </div>
                
                {track.lyrics && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="text-gray-500 text-xs block mb-2 uppercase tracking-wider font-bold">Lyrics</span>
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-60 overflow-y-auto">{track.lyrics}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-500" /> Administrative Info</h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Status</div>
                <div className="font-semibold text-gray-900">{release.status}</div>
              </div>
              
              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Created At</div>
                <div className="font-semibold text-gray-900">{release.createdAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</div>
              </div>

              <div>
                <div className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Last Updated</div>
                <div className="font-semibold text-gray-900">{release.updatedAt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
