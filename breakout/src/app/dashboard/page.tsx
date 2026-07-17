import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Users, Music, DollarSign, Clock, Disc, PlayCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { OverviewChart } from "@/components/OverviewChart";
import { TrafficSourcesChart, ShareOfVoiceChart } from "@/components/DonutCharts";
import { redirect } from "next/navigation";

const prisma = new PrismaClient();

export default async function UserDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artists: true }
  });

  const artistIds = user?.artists.map(a => a.id) || [];

  const totalReleases = artistIds.length > 0 ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: 'APPROVED' } }) : 0;
  const pendingReleases = artistIds.length > 0 ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: 'PENDING' } }) : 0;

  const totalRevenueData = artistIds.length > 0 ? await prisma.royalty.aggregate({
    _sum: { totalRevenue: true },
    where: { artistId: { in: artistIds } }
  }) : { _sum: { totalRevenue: 0 } };
  
  const totalRevenue = totalRevenueData._sum.totalRevenue || 0;
  
  const withdrawRequests = await prisma.withdrawRequest.findMany({
    where: { userId: session.user.id }
  });
  
  const totalWithdrawn = withdrawRequests.filter(req => req.status === 'PAID').reduce((acc, req) => acc + req.amount, 0);
  const pendingWithdrawal = withdrawRequests.filter(req => req.status === 'PENDING').reduce((acc, req) => acc + req.amount, 0);
  
  const availableBalance = totalRevenue - totalWithdrawn - pendingWithdrawal;
  
  const totalStreamsData = artistIds.length > 0 ? await prisma.royalty.aggregate({
    _sum: { spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true, tiktokStreams: true, amazonStreams: true, otherStreams: true },
    where: { artistId: { in: artistIds } }
  }) : null;

  const totalStreams = totalStreamsData 
    ? (totalStreamsData._sum.spotifyStreams || 0) + (totalStreamsData._sum.appleMusicStreams || 0) + (totalStreamsData._sum.youtubeStreams || 0) + (totalStreamsData._sum.tiktokStreams || 0) + (totalStreamsData._sum.amazonStreams || 0) + (totalStreamsData._sum.otherStreams || 0)
    : 0;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Artist Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.name}`} alt="Profile" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="w-full lg:w-3/5">
          <OverviewChart hasData={totalStreams > 0} />
        </div>

        <div className="w-full lg:w-2/5 grid grid-cols-2 gap-4">
          {/* Card 1: Gradient */}
          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <PlayCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">+24%</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-1">{totalStreams.toLocaleString()}</h3>
              <p className="text-white/80 text-xs font-medium">Total Streams</p>
            </div>
          </div>

          {/* Card 2: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 12.5%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">Rp {availableBalance.toLocaleString('id-ID')}</h3>
              <p className="text-gray-400 text-xs font-medium">Available Balance</p>
            </div>
          </div>

          {/* Card 3: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Disc className="w-4 h-4 text-pink-500" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalReleases}</h3>
              <p className="text-gray-400 text-xs font-medium">Active Releases</p>
            </div>
          </div>

          {/* Card 4: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{pendingReleases}</h3>
              <p className="text-gray-400 text-xs font-medium">Pending Approvals</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficSourcesChart hasData={totalStreams > 0} />
        <ShareOfVoiceChart hasData={totalStreams > 0} />
      </div>
    </div>
  );
}
