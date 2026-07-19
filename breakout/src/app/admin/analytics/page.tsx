import AdminAnalyticsClient from "./AnalyticsClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminAnalyticsPage() {
  const activeTracks = await prisma.track.count();
  const activeArtists = await prisma.artist.count();

  const royalties = await prisma.royalty.findMany();

  let totalRevenue = 0;
  let totalSpotify = 0;
  let totalApple = 0;
  let totalYoutube = 0;
  let totalTiktok = 0;
  let totalLainnya = 0;

  // Track revenue by month for the current year
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = Array(12).fill(0);

  royalties.forEach(r => {
    totalRevenue += r.totalRevenue;
    totalSpotify += r.spotifyStreams;
    totalApple += r.appleMusicStreams;
    totalYoutube += r.youtubeStreams;
    totalTiktok += r.tiktokStreams;
    totalLainnya += (r.amazonStreams + r.otherStreams);

    if (r.year === currentYear && r.month >= 1 && r.month <= 12) {
      monthlyRevenue[r.month - 1] += r.totalRevenue;
    }
  });

  const totalStreams = totalSpotify + totalApple + totalYoutube + totalTiktok + totalLainnya;

  const rawPlatformData = [
    { name: 'Spotify', value: totalSpotify },
    { name: 'Apple Music', value: totalApple },
    { name: 'YouTube', value: totalYoutube },
    { name: 'TikTok', value: totalTiktok },
    { name: 'Lainnya', value: totalLainnya },
  ];

  // Convert to percentages
  let platformData = rawPlatformData.map(p => ({
    name: p.name,
    value: totalStreams > 0 ? Math.round((p.value / totalStreams) * 100) : 0
  })).filter(p => p.value > 0);

  // Fallback if no streams yet
  if (platformData.length === 0) {
    platformData = [
      { name: 'Spotify', value: 45 },
      { name: 'Apple Music', value: 25 },
      { name: 'YouTube', value: 15 },
      { name: 'TikTok', value: 10 },
      { name: 'Lainnya', value: 5 },
    ];
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentMonth = new Date().getMonth();
  
  // Show data up to current month
  let revenueData = months.map((month, index) => ({
    month,
    revenue: monthlyRevenue[index]
  })).filter((_, index) => index <= currentMonth);

  // Fallback if no revenue data yet
  if (revenueData.every(d => d.revenue === 0)) {
    revenueData = [
      { month: 'Feb', revenue: 3000000 },
      { month: 'Mar', revenue: 2000000 },
      { month: 'Apr', revenue: 4780000 },
      { month: 'May', revenue: 3890000 },
      { month: 'Jun', revenue: 6390000 },
      { month: 'Jul', revenue: 4490000 },
    ];
  }

  const data = {
    totalStreams,
    totalRevenue,
    activeTracks,
    activeArtists,
    revenueData,
    platformData
  };

  return <AdminAnalyticsClient data={data} />;
}
