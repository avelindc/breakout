import { PrismaClient } from "@prisma/client";
import { addRoyaltyAction } from "@/app/actions/royalties";
import { DollarSign, Save } from "lucide-react";
import { RoyaltyForm } from "@/components/RoyaltyForm";

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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
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
                        Rp {r.totalRevenue.toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Global Detailed Royalties Table (Neon Style) */}
      <div className="mt-16 bg-[#09090b] rounded-[2rem] p-1 relative overflow-hidden shadow-2xl">
        {/* Neon effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#f000ff]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#0047FF]/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="glass-card relative z-10 border-[#f000ff]/20 overflow-hidden rounded-[2rem]">
          <div className="p-6 sm:p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-wide flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f000ff] shadow-[0_0_12px_#f000ff] animate-pulse" />
                Global Analytics <span className="text-gray-500 font-medium text-xl">/ All Artists</span>
              </h2>
              <p className="text-gray-400 text-sm mt-1.5 ml-5">Detailed breakdown of streams and revenue across all platforms.</p>
            </div>
            <div className="text-xs font-bold text-gray-400 bg-black/40 px-4 py-2 rounded-xl border border-white/10 uppercase tracking-widest">
              {allRoyalties.length} Entries
            </div>
          </div>
          
          {allRoyalties.length === 0 ? (
            <div className="p-20 text-center text-gray-400">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-[#f000ff]/40" />
              <p className="text-lg">No royalty data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                    <th className="p-5 pl-8">Period</th>
                    <th className="p-5">Artist & Track</th>
                    <th className="p-5 text-right">Spotify</th>
                    <th className="p-5 text-right">Apple</th>
                    <th className="p-5 text-right">YouTube</th>
                    <th className="p-5 text-right">TikTok</th>
                    <th className="p-5 pr-8 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {allRoyalties.map(r => {
                    const profileImage = r.artist.avatarUrl || r.artist.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.artist.stageName}`;
                    return (
                      <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-[#f000ff]/5 transition-colors group">
                        <td className="p-5 pl-8">
                          <span className="bg-white/10 text-gray-300 font-bold px-3 py-1.5 rounded-md text-xs border border-white/5 group-hover:border-[#f000ff]/30 transition-colors">
                            {new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/10 group-hover:border-[#f000ff]/50 transition-colors shrink-0 shadow-lg">
                              <img src={profileImage} alt={r.artist.stageName} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-white text-sm group-hover:text-[#f000ff] transition-colors">{r.songName}</p>
                              <p className="text-xs text-gray-400 mt-1">{r.artist.stageName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-right text-gray-400 font-mono text-sm group-hover:text-white transition-colors">{r.spotifyStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-400 font-mono text-sm group-hover:text-white transition-colors">{r.appleMusicStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-400 font-mono text-sm group-hover:text-white transition-colors">{r.youtubeStreams.toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-400 font-mono text-sm group-hover:text-white transition-colors">{r.tiktokStreams.toLocaleString()}</td>
                        <td className="p-5 pr-8 text-right">
                          <span className="inline-block bg-gradient-to-r from-[#f000ff]/20 to-[#00f0ff]/20 border border-[#f000ff]/30 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-[0_0_10px_rgba(240,0,255,0.1)] group-hover:shadow-[0_0_15px_rgba(240,0,255,0.3)] transition-all">
                            Rp {r.totalRevenue.toLocaleString('id-ID')}
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
