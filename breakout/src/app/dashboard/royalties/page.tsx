import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { DollarSign, DownloadCloud } from "lucide-react";

const prisma = new PrismaClient();

export default async function UserRoyaltiesPage() {
  const session = await auth();
  
  const user = await prisma.user.findUnique({
    where: { id: session?.user?.id },
    include: { artists: { include: { royalties: { orderBy: { createdAt: 'desc' } } } } }
  });

  const royalties = user?.artists?.flatMap(a => a.royalties).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) || [];
  const totalRevenue = royalties.reduce((acc, curr) => acc + curr.totalRevenue, 0);

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Royalty Statements</h1>
          <p className="text-gray-400">View your earnings and stream data.</p>
        </div>
        <button className="px-5 py-2.5 rounded-lg glass border border-white/10 text-white font-semibold hover:bg-white/5 transition flex items-center gap-2">
          <DownloadCloud className="w-4 h-4" /> Download CSV
        </button>
      </div>

      <div className="glass-card p-8 mb-10 bg-gradient-to-br from-[#7000FF]/20 to-transparent border-[#7000FF]/30">
        <p className="text-gray-400 font-medium mb-1">Lifetime Earnings</p>
        <h2 className="text-5xl font-bold text-white">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
      </div>

      <div className="glass-card overflow-hidden">
        {royalties.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>No royalty statements available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-sm text-gray-400">
                  <th className="p-5 font-medium">Period</th>
                  <th className="p-5 font-medium">Song</th>
                  <th className="p-5 font-medium text-right">Spotify</th>
                  <th className="p-5 font-medium text-right">Apple</th>
                  <th className="p-5 font-medium text-right">YouTube</th>
                  <th className="p-5 font-medium text-right">TikTok</th>
                  <th className="p-5 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {royalties.map(r => (
                  <tr key={r.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition">
                    <td className="p-5 font-medium text-gray-300">{r.month}/{r.year}</td>
                    <td className="p-5 font-bold text-white">{r.songName}</td>
                    <td className="p-5 text-right text-gray-400">{r.spotifyStreams.toLocaleString()}</td>
                    <td className="p-5 text-right text-gray-400">{r.appleMusicStreams.toLocaleString()}</td>
                    <td className="p-5 text-right text-gray-400">{r.youtubeStreams.toLocaleString()}</td>
                    <td className="p-5 text-right text-gray-400">{r.tiktokStreams.toLocaleString()}</td>
                    <td className="p-5 text-right font-bold text-[#00F0FF]">Rp {r.totalRevenue.toLocaleString('id-ID')}</td>
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
