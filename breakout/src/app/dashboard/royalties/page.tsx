import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { DollarSign, DownloadCloud, Activity, Music, Smartphone, MonitorPlay, Headset } from "lucide-react";
import { RoyaltyBarChart, RoyaltyDonutChart } from "@/components/RoyaltyCharts";

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
          <button className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-[#f000ff]/50 hover:shadow-[0_0_15px_rgba(240,0,255,0.3)] transition-all duration-300 flex items-center gap-2 shrink-0">
            <DownloadCloud className="w-4 h-4" /> Export CSV
          </button>
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

      <div className="glass-card overflow-hidden border-[#f000ff]/20">
        <div className="p-5 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white tracking-wide">Detailed Royalty Reports</h3>
          <div className="text-xs font-medium text-gray-400 bg-black/40 px-3 py-1.5 rounded-full border border-white/10">
            {royalties.length} Entries
          </div>
        </div>
        
        {royalties.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <DollarSign className="w-16 h-16 mx-auto mb-4 text-[#f000ff]/40" />
            <p className="text-lg">No royalty statements available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-black/20 border-b border-white/5 text-[11px] uppercase tracking-wider text-gray-400 font-bold">
                  <th className="p-4 pl-6">Period</th>
                  <th className="p-4">Track Details</th>
                  <th className="p-4 text-right">Spotify</th>
                  <th className="p-4 text-right">Apple</th>
                  <th className="p-4 text-right">YouTube</th>
                  <th className="p-4 text-right">TikTok</th>
                  <th className="p-4 pr-6 text-right">Net Revenue</th>
                </tr>
              </thead>
              <tbody>
                {royalties.map(r => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-[#f000ff]/5 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="bg-white/10 text-gray-300 font-bold px-2.5 py-1 rounded-md text-xs border border-white/5 group-hover:border-[#f000ff]/30 transition-colors">
                        {new Date(r.year, r.month - 1).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-white text-sm group-hover:text-[#f000ff] transition-colors">{r.songName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{r.artist.stageName}</p>
                    </td>
                    <td className="p-4 text-right text-gray-400 font-mono text-sm">{r.spotifyStreams.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-400 font-mono text-sm">{r.appleMusicStreams.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-400 font-mono text-sm">{r.youtubeStreams.toLocaleString()}</td>
                    <td className="p-4 text-right text-gray-400 font-mono text-sm">{r.tiktokStreams.toLocaleString()}</td>
                    <td className="p-4 pr-6 text-right">
                      <span className="inline-block bg-gradient-to-r from-[#f000ff]/20 to-[#00f0ff]/20 border border-[#f000ff]/30 text-white font-bold px-3 py-1.5 rounded-lg text-sm shadow-[0_0_10px_rgba(240,0,255,0.1)] group-hover:shadow-[0_0_15px_rgba(240,0,255,0.3)] transition-all">
                        Rp {r.totalRevenue.toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
