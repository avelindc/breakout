import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { Users, Music, DollarSign, Clock, Disc, PlayCircle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { OverviewChart } from "@/components/OverviewChart";
import { TrafficSourcesChart, ShareOfVoiceChart } from "@/components/DonutCharts";
import { redirect } from "next/navigation";
import { UserOverviewClient } from "./UserOverviewClient";

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

  const data = {
    totalReleases,
    pendingReleases,
    totalRevenue,
    availableBalance,
    totalStreams,
    recentWithdrawals: withdrawRequests.slice(0, 3) // get 3 most recent
  };

  return <UserOverviewClient data={data} user={session.user} />;
}
