import { PrismaClient } from "@prisma/client";
import { Users, Music, DollarSign, Clock, Calendar, ArrowUpRight, ArrowDownRight, Hourglass } from "lucide-react";
import { OverviewChart } from "@/components/OverviewChart";
import { TrafficSourcesChart, ShareOfVoiceChart } from "@/components/DonutCharts";
import { auth } from "@/auth";

const prisma = new PrismaClient();

export default async function AdminOverviewPage() {
  const session = await auth();

  const totalArtists = await prisma.user.count({ where: { role: 'USER' } });
  const pendingArtists = await prisma.user.count({ where: { role: 'USER', status: 'PENDING' } });
  
  const totalReleases = await prisma.release.count({ where: { status: 'APPROVED' } });
  const pendingReleases = await prisma.release.count({ where: { status: 'PENDING' } });

  const totalRevenueData = await prisma.royalty.aggregate({
    _sum: { totalRevenue: true }
  });
  const totalRevenue = totalRevenueData._sum.totalRevenue || 0;

  const pendingWithdrawalsData = await prisma.withdrawRequest.aggregate({
    _sum: { amount: true },
    where: { status: 'PENDING' }
  });
  const pendingWithdrawals = pendingWithdrawalsData._sum.amount || 0;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
            <img src={session.user?.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"} alt="Admin" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="w-full lg:w-3/5">
          <OverviewChart />
        </div>

        <div className="w-full lg:w-2/5 grid grid-cols-2 gap-4">
          {/* Card 1: Gradient */}
          <div className="bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-500 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full">+12%</span>
            </div>
            <div>
              <h3 className="text-3xl font-bold mb-1">{totalArtists}</h3>
              <p className="text-white/80 text-xs font-medium">Total Artists</p>
            </div>
          </div>

          {/* Card 2: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 4.2%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{pendingArtists}</h3>
              <p className="text-gray-400 text-xs font-medium">Pending Approvals</p>
            </div>
          </div>

          {/* Card 3: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Music className="w-4 h-4 text-pink-500" />
              </div>
              <span className="text-xs font-semibold text-red-500 flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3" /> 2.1%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{totalReleases}</h3>
              <p className="text-gray-400 text-xs font-medium">Total Releases</p>
            </div>
          </div>

          {/* Card 4: White */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
                <Hourglass className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 8.4%
              </span>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{pendingReleases}</h3>
              <p className="text-gray-400 text-xs font-medium">Pending Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrafficSourcesChart />
        <ShareOfVoiceChart />
      </div>
    </div>
  );
}
