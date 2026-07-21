import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { DollarSign, DownloadCloud, Activity, Music, Smartphone, MonitorPlay, Headset } from "lucide-react";
import { RoyaltyBarChart, RoyaltyDonutChart } from "@/components/RoyaltyCharts";
import { DownloadCsvButton } from "@/components/DownloadCsvButton";

const prisma = new PrismaClient();

export default async function UserRoyaltiesPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artists: { include: { royalties: { orderBy: { createdAt: 'desc' } } } } }
  });

  const royalties = user?.artists?.flatMap(a => a.royalties.map(r => ({ ...r, artist: a }))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];
  const totalRevenue = royalties.reduce((acc, curr) => acc + curr.totalRevenue, 0);

  const totalSpotify = royalties.reduce((acc, curr) => acc + curr.spotifyStreams, 0);
  const totalApple = royalties.reduce((acc, curr) => acc + curr.appleMusicStreams, 0);
  const totalYoutube = royalties.reduce((acc, curr) => acc + curr.youtubeStreams, 0);
  const totalTiktok = royalties.reduce((acc, curr) => acc + curr.tiktokStreams, 0);
  
  const totalStreams = totalSpotify + totalApple + totalYoutube + totalTiktok + royalties.reduce((acc, curr) => acc + curr.amazonStreams + curr.otherStreams, 0);

  const getPercent = (value: number) => {
    if (totalStreams === 0) return 0;
    return Math.round((value / totalStreams) * 100);
  };

  const revenueByPeriod = royalties.reduce((acc, curr) => {
    const period = `${curr.month}/${curr.year.toString().slice(2)}`;
    acc[period] = (acc[period] || 0) + curr.totalRevenue;
    return acc;
  }, {} as Record<string, number>);
  
  const chartData = Object.keys(revenueByPeriod)
    .sort((a, b) => {
       const [mA, yA] = a.split('/');
       const [mB, yB] = b.split('/');
       return (parseInt(yA) - parseInt(yB)) || (parseInt(mA) - parseInt(mB));
    })
    .map(key => ({
      name: key,
      revenue: revenueByPeriod[key]
    }));

  const donutData = [
    { name: 'Spotify', value: totalSpotify, color: '#22c55e' },
    { name: 'Apple', value: totalApple, color: '#ef4444' },
    { name: 'YouTube', value: totalYoutube, color: '#dc2626' },
    { name: 'TikTok', value: totalTiktok, color: '#3b82f6' },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-10 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#f000ff]/20 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute top-10 right-10 w-40 h-40 bg-[#0047FF]/20 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight text-white">
              Analytics <span className="bg-gradient-to-r from-[#f000ff] to-[#00f0ff] text-transparent bg-clip-text">Overview</span>
            </h1>
            <p className="text-gray-400 font-medium">Track your global streams and revenue data.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Main Stats Card */}
        <div className="lg:col-span-2 glass-card relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f000ff]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#f000ff]/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-[#f000ff]/30 transition-colors duration-500" />
          
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row gap-8 justify-between h-full">
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2 text-[#f000ff]">
                <DollarSign className="w-5 h-5" />
                <span className="font-bold tracking-wider text-sm uppercase">Total Lifetime Earnings</span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                Rp {totalRevenue.toLocaleString('id-ID')}
              </h2>
              
              <div className="flex items-center gap-2 mt-auto text-[#00f0ff]">
                <Activity className="w-5 h-5" />
                <span className="font-bold tracking-wider text-sm uppercase">Total Global Streams</span>
              </div>
              <p className="text-3xl font-black text-white mt-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                {totalStreams.toLocaleString('id-ID')}
              </p>
            </div>
            
            {/* Chart representation */}
            <div className="hidden sm:block w-1/2">
               <RoyaltyBarChart data={chartData} />
            </div>
          </div>
        </div>

        {/* Platforms Breakdown Card */}
        <div className="glass-card p-6 sm:p-8 relative overflow-hidden flex flex-col">
           <div className="absolute inset-0 bg-gradient-to-br from-[#0047FF]/10 to-transparent opacity-50" />
           <div className="relative flex flex-col h-full">
             <h3 className="font-bold text-white mb-4 flex items-center gap-2 shrink-0">
               <Music className="w-4 h-4 text-[#00f0ff]" /> Sentiments
             </h3>
             
             <div className="flex-1 flex flex-col justify-between">
               <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-2">
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]" />
                   <span className="text-xs text-gray-300">Spotify</span>
                   <span className="text-xs font-bold text-white ml-auto">{getPercent(totalSpotify)}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_5px_#ef4444]" />
                   <span className="text-xs text-gray-300">Apple</span>
                   <span className="text-xs font-bold text-white ml-auto">{getPercent(totalApple)}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-red-600 shadow-[0_0_5px_#dc2626]" />
                   <span className="text-xs text-gray-300">YouTube</span>
                   <span className="text-xs font-bold text-white ml-auto">{getPercent(totalYoutube)}%</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_5px_#3b82f6]" />
                   <span className="text-xs text-gray-300">TikTok</span>
                   <span className="text-xs font-bold text-white ml-auto">{getPercent(totalTiktok)}%</span>
                 </div>
               </div>
               
               <RoyaltyDonutChart data={donutData} />
             </div>
           </div>
        </div>
      </div>

      <div className="mt-16 bg-white/60 backdrop-blur-md rounded-[2rem] relative overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
        <div className="relative z-10 overflow-hidden">
          <div className="p-6 sm:p-8 border-b border-gray-100 bg-white/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-wide flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.5)] animate-pulse" />
                Detailed Analytics
              </h2>
              <p className="text-gray-500 text-sm mt-1.5 ml-5">Detailed breakdown of streams and revenue across all platforms.</p>
            </div>
            <div className="flex items-center gap-3">
              <DownloadCsvButton data={royalties} />
              <div className="text-xs font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 uppercase tracking-widest shadow-sm">
                {royalties.length} Entries
              </div>
            </div>
          </div>
          
          {royalties.length === 0 ? (
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
                    <th className="p-5 text-right">Facebook</th>
                    <th className="p-5 text-right">Instagram</th>
                    <th className="p-5 text-right">Cut</th>
                    <th className="p-5 pr-8 text-right">Net Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {royalties.map(r => {
                    const profileImage = r.artist.avatarUrl || r.artist.user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.artist.stageName}`;
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
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{((r.platformData as any)?.facebook || 0).toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-mono text-sm group-hover:text-gray-900 transition-colors">{((r.platformData as any)?.instagram || 0).toLocaleString()}</td>
                        <td className="p-5 text-right text-gray-500 font-bold text-sm whitespace-nowrap">
                          {(r.platformData as any)?.cutPercentage ? (
                            <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">
                              - Rp {Math.round(((r.platformData as any).rawTotalRevenue || 0) * ((r.platformData as any).cutPercentage / 100)).toLocaleString('id-ID')}
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
