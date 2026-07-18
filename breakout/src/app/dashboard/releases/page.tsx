import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Disc, Plus, Settings } from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function MyReleasesPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artists: { include: { releases: { orderBy: { createdAt: 'desc' } } } } }
  });

  const releases = user?.artists?.flatMap(a => a.releases).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10 px-4 md:px-0">
      <div className="mb-6 md:mb-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">My Releases</h1>
          <p className="text-gray-500 text-sm font-medium">{releases.length} releases found</p>
        </div>
        <Link href="/dashboard/upload" className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" /> New Release
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-10 md:p-16 flex flex-col items-center justify-center text-center shadow-sm">
          <Disc className="w-16 h-16 text-gray-300 mb-5" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Releases Found</h2>
          <p className="text-gray-500 mb-8 max-w-md">You haven't uploaded any music yet. Start your journey by uploading your first track.</p>
          <Link href="/dashboard/upload" className="px-8 py-3.5 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition">
            Upload Music
          </Link>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-3">
          {/* Table Header (Desktop Only) */}
          <div className="hidden md:flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="w-20 shrink-0">Id</div>
            <div className="flex-1 min-w-0 pr-4">Title</div>
            <div className="w-32 lg:w-40 shrink-0">Type</div>
            <div className="w-32 shrink-0">Release Date</div>
            <div className="w-28 lg:w-32 shrink-0">Status</div>
            <div className="w-20 shrink-0 flex justify-end">Action</div>
          </div>

          {/* Rows / Cards */}
          {releases.map((release) => (
            <div 
              key={release.id} 
              className="flex flex-col md:flex-row md:items-center p-5 md:px-6 md:py-4 bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)] transition hover:opacity-95 group cursor-pointer gap-5 md:gap-0 h-auto"
            >
              {/* Mobile View: Artwork + Title + Artist */}
              <div className="flex items-start gap-4 md:hidden w-full">
                <img src={release.coverArtworkUrl} alt={release.title} className="w-16 h-16 rounded-xl bg-white/10 object-cover shadow-sm shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white transition text-lg leading-tight line-clamp-2">{release.title}</div>
                  <div className="text-sm text-white/80 mt-1 truncate">
                    {release.primaryArtist} {release.featuredArtist ? `ft. ${release.featuredArtist}` : ''}
                  </div>
                </div>
              </div>

              {/* Mobile View: Metadata (Type, Genre, Date, Status, ID) */}
              <div className="flex flex-col gap-2.5 md:hidden w-full bg-white/10 rounded-xl p-4">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-white/60 shrink-0">Type</span>
                  <span className="text-sm font-bold text-white text-right break-words">{release.type}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-white/60 shrink-0">Genre</span>
                  <span className="text-sm font-bold text-white text-right break-words">{release.genre}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-white/60 shrink-0">Release Date</span>
                  <span className="text-sm font-bold text-white text-right shrink-0">
                    {new Date(release.releaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-sm font-semibold text-white/60 shrink-0">Status</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${
                      release.status === 'APPROVED' ? 'bg-green-400' : 
                      release.status === 'PENDING' ? 'bg-yellow-400' : 
                      'bg-red-400'
                    }`}></span>
                    <span className={`font-bold text-sm ${
                      release.status === 'APPROVED' ? 'text-green-300' : 
                      release.status === 'PENDING' ? 'text-yellow-300' : 
                      'text-red-300'
                    }`}>
                      {release.status === 'APPROVED' ? 'Released' : release.status === 'PENDING' ? 'Pending' : 'Rejected'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-start gap-2 pt-2.5 mt-0.5 border-t border-white/10">
                  <span className="text-sm font-semibold text-white/60 shrink-0">ID Release</span>
                  <span className="text-sm font-mono font-bold text-white shrink-0">#{release.id.slice(-6).toUpperCase()}</span>
                </div>
              </div>

              {/* Desktop View: ID */}
              <div className="hidden md:block w-20 text-white/80 font-bold text-sm font-mono shrink-0">
                #{release.id.slice(-6).toUpperCase()}
              </div>
              
              {/* Desktop View: Cover + Title + Artist */}
              <div className="hidden md:flex flex-1 items-center gap-4 min-w-0 pr-4">
                <img src={release.coverArtworkUrl} alt={release.title} className="w-12 h-12 rounded-xl bg-white/10 object-cover shadow-sm shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-white transition truncate text-base">{release.title}</div>
                  <div className="text-xs font-medium text-white/80 mt-0.5 truncate">
                    {release.primaryArtist} {release.featuredArtist ? `ft. ${release.featuredArtist}` : ''} • {release.genre}
                  </div>
                </div>
              </div>
              
              {/* Desktop View: Type */}
              <div className="hidden md:block w-32 lg:w-40 text-white/90 font-semibold text-sm shrink-0">
                {release.type}
              </div>
              
              {/* Desktop View: Release Date */}
              <div className="hidden md:block w-32 text-white/90 font-semibold text-sm shrink-0">
                {new Date(release.releaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              
              {/* Desktop View: Status */}
              <div className="hidden md:flex w-28 lg:w-32 items-center gap-2 shrink-0">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  release.status === 'APPROVED' ? 'bg-green-400' : 
                  release.status === 'PENDING' ? 'bg-yellow-400' : 
                  'bg-red-400'
                }`}></span>
                <span className={`font-bold text-sm truncate ${
                  release.status === 'APPROVED' ? 'text-green-300' : 
                  release.status === 'PENDING' ? 'text-yellow-300' : 
                  'text-red-300'
                }`}>
                  {release.status === 'APPROVED' ? 'Released' : release.status === 'PENDING' ? 'Pending' : 'Rejected'}
                </span>
              </div>
              
              {/* Action Buttons (Mobile & Desktop) */}
              <div className="flex md:w-20 justify-end gap-2 w-full shrink-0">
                <button className="w-full md:w-10 h-11 md:h-10 flex items-center justify-center gap-2 rounded-xl bg-white/10 text-white hover:bg-white hover:text-[#8a2be2] transition font-bold text-sm">
                  <Settings className="w-4 h-4 shrink-0" /> <span className="md:hidden">Settings</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
