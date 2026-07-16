import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Disc, Plus, Settings } from "lucide-react";
import Link from "next/link";

const prisma = new PrismaClient();

export default async function MyReleasesPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artist: { include: { releases: { orderBy: { createdAt: 'desc' } } } } }
  });

  const releases = user?.artist?.releases || [];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Releases</h1>
          <p className="text-gray-500 text-sm">{releases.length} releases found</p>
        </div>
        <Link href="/dashboard/upload" className="px-5 py-2.5 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Release
        </Link>
      </div>

      {releases.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center shadow-sm">
          <Disc className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Releases Found</h2>
          <p className="text-gray-500 mb-6 max-w-md">You haven't uploaded any music yet. Start your journey by uploading your first track.</p>
          <Link href="/dashboard/upload" className="px-6 py-3 rounded-full bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition">
            Upload Music
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="flex items-center px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="w-20">Id</div>
            <div className="flex-1">Title</div>
            <div className="w-40">Type</div>
            <div className="w-32">Release Date</div>
            <div className="w-32">Status</div>
            <div className="w-20 flex justify-end">Action</div>
          </div>

          {/* Rows */}
          {releases.map((release) => (
            <div 
              key={release.id} 
              className="flex items-center px-6 py-4 bg-white rounded-2xl border border-gray-100 shadow-sm transition hover:bg-blue-600 hover:border-blue-600 hover:shadow-blue-500/20 group cursor-pointer"
            >
              <div className="w-20 text-gray-500 font-medium text-sm group-hover:text-blue-100">
                #{release.id.slice(-4).toUpperCase()}
              </div>
              
              <div className="flex-1 flex items-center gap-3">
                <img src={release.coverArtworkUrl} alt={release.title} className="w-10 h-10 rounded-lg bg-gray-100 object-cover shadow-sm" />
                <div>
                  <div className="font-bold text-gray-900 group-hover:text-white transition">{release.title}</div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-200 mt-0.5">
                    {release.primaryArtist} {release.featuredArtist ? `ft. ${release.featuredArtist}` : ''} • {release.genre}
                  </div>
                </div>
              </div>
              
              <div className="w-40 text-gray-500 text-sm group-hover:text-blue-100">
                {release.type}
              </div>
              
              <div className="w-32 text-gray-500 text-sm group-hover:text-blue-100">
                {new Date(release.releaseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              
              <div className="w-32 flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  release.status === 'APPROVED' ? 'bg-green-400 group-hover:bg-green-300' : 
                  release.status === 'PENDING' ? 'bg-yellow-400 group-hover:bg-yellow-300' : 
                  'bg-red-400 group-hover:bg-red-300'
                }`}></span>
                <span className={`font-medium text-sm ${
                  release.status === 'APPROVED' ? 'text-green-500 group-hover:text-green-300' : 
                  release.status === 'PENDING' ? 'text-yellow-500 group-hover:text-yellow-300' : 
                  'text-red-500 group-hover:text-red-300'
                }`}>
                  {release.status === 'APPROVED' ? 'Released' : release.status === 'PENDING' ? 'Pending' : 'Rejected'}
                </span>
              </div>
              
              <div className="w-20 flex justify-end gap-2">
                <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 group-hover:text-white group-hover:hover:bg-white/20 transition">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
