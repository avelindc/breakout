import { PrismaClient } from "@prisma/client";
import { AdminOverviewClient } from "./AdminOverviewClient";

const prisma = new PrismaClient();

export default async function AdminOverviewPage() {
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

  const recentWithdrawals = await prisma.withdrawRequest.findMany({
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  });

  const recentArtists = await prisma.user.findMany({
    where: { role: 'USER' },
    take: 4,
    orderBy: { createdAt: 'desc' },
    select: { name: true, image: true }
  });

  const data = {
    totalArtists,
    pendingArtists,
    totalReleases,
    pendingReleases,
    totalRevenue,
    pendingWithdrawals,
    recentWithdrawals,
    recentArtists: recentArtists.map(a => ({ name: a.name || 'Unknown', image: a.image }))
  };

  return <AdminOverviewClient data={data} />;
}
