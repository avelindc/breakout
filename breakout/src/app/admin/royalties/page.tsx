import { PrismaClient } from "@prisma/client";
import { addRoyaltyAction } from "@/app/actions/royalties";
import { DollarSign, Save } from "lucide-react";
import { RoyaltyForm } from "@/components/RoyaltyForm";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";

const prisma = new PrismaClient();

export default async function AdminRoyaltiesPage() {
  const artists = await prisma.artist.findMany({
    where: {
      releases: {
        some: {} // Only include artists who have at least one release
      }
    },
    include: { releases: true },
    orderBy: { stageName: 'asc' }
  });

  const recentRoyalties = await prisma.royalty.findMany({
    include: { artist: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const allRoyalties = await prisma.royalty.findMany({
    include: { artist: { include: { user: true } } },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Royalty Management</h1>
        <p className="text-gray-500">Input stream counts and revenue for artists.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/60 backdrop-blur-xl rounded-[24px] border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 relative z-10">
            <DollarSign className="w-5 h-5 text-green-600" />
            Add Royalty Data
          </h2>

          <RoyaltyForm artists={artists} />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-between">
            <span>Recent Entries</span>
            <span className="text-xs font-medium bg-gray-100 text-gray-500 px-3 py-1 rounded-full">{recentRoyalties.length} latest</span>
          </h2>
          <div className="space-y-3">
            {recentRoyalties.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-500">No data yet.</p>
              </div>
            ) : (
              recentRoyalties.map((r) => {
                const profileImage = r.artist.avatarUrl || r.artist.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.artist.stageName}`;
                
                return (
                  <div key={r.id} className="group flex justify-between items-center p-4 bg-gray-50 hover:bg-blue-50/50 rounded-xl border border-transparent hover:border-blue-100 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden shadow-sm shrink-0 border-2 border-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profileImage} alt={r.artist.stageName} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors line-clamp-1">{r.songName}</h4>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{r.artist.stageName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-bold rounded-full">
                          {new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col justify-center ml-2 shrink-0">
                      <p className="text-[10px] text-gray-400 font-medium mb-1">Total Revenue</p>
                      <p className="font-bold text-green-600 bg-green-50 px-2 sm:px-3 py-1.5 rounded-lg border border-green-100 text-sm">
                        Rp {Math.round(r.totalRevenue).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Global Detailed Royalties Table (Glassmorphism Style) */}
      <div className="mt-16 bg-white/60 backdrop-blur-md rounded-[2rem] relative overflow-hidden shadow-sm border border-gray-100">
        <div className="relative z-10 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-white/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-wide flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse" />
                Global Analytics <span className="text-gray-400 font-medium text-xl">/ All Artists</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1.5 ml-5">Detailed breakdown of streams and revenue across all platforms.</p>
            </div>
            <div className="flex items-center gap-3">
              <DownloadCsvButton data={allRoyalties} />
              <div className="text-xs font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 uppercase tracking-widest shadow-sm">
                {allRoyalties.length} Entries
              </div>
            </div>
          </div>
          
          {allRoyalties.length === 0 ? (
            <div className="p-20 text-center text-gray-400">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-purple-200" />
              <p className="text-lg">No royalty data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500 font-bold">
                    <th className="p-5 pl-8">Period</th>
                    <th className="p-5">Artist & Track</th>
                    <th className="p-5 text-right">Spotify</th>
                    <th className="p-5 text-right">Apple</th>
                    <th className="p-5 text-right">YouTube</th>
                    <th className="p-5 text-right">TikTok</th>
                    <th className="p-5 text-right">Cut (%)</th>
                    <th className="p-5 pr-8 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {allRoyalties.map(r => {
                    const profileImage = r.artist.avatarUrl || r.artist.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.artist.stageName}`;
                    return (
                      <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-purple-50/50 transition-colors group">
                        <td className="p-5 pl-8">
                          <span className="bg-white text-gray-600 font-bold px-3 py-1.5 rounded-md text-xs border border-gray-200 group-hover:border-purple-200 transition-colors shadow-sm">
                            {new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white group-hover:border-purple-200 transition-colors shrink-0 shadow-sm">
                              <img src={profileImage} alt={r.artist.stageName} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{r.songName}</p>
                              <p className="text-xs font-medium text-gray-500 mt-1">{r.artist.stageName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{r.spotifyStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{r.appleMusicStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{r.youtubeStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{r.tiktokStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-bold text-sm">
                          {(r.platformData as any)?.cutPercentage ? (
                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">
                              {(r.platformData as any).cutPercentage}%
                            </span>
                          ) : "-"}
                        </td>
                        <td className="p-5 pr-8 text-right">
                          <span className="inline-block bg-purple-50 border border-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-lg text-sm shadow-sm group-hover:bg-purple-100 transition-all">
                            Rp {Math.round(r.totalRevenue).toLocaleString('id-ID')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
