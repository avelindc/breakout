import AdminAnalyticsClient from "./AnalyticsClient";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function AdminAnalyticsPage() {
  const activeTracks = await prisma.track.count();
  const activeArtists = await prisma.artist.count();

  const royalties = await prisma.royalty.findMany();

  let totalRevenue = 0;
  let totalStreams = 0;
  const platformMap: Record<string, number> = {};

  // Track revenue by month for the current year
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = Array(12).fill(0);

  royalties.forEach(r => {
    totalRevenue += r.totalRevenue;
    
    let rowStreams = 0;
    if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
      const pd = r.platformData as Record<string, number>;
      for (const [p, s] of Object.entries(pd)) {
        let platName = p;
        if (p.toLowerCase() === 'spotify') platName = 'Spotify';
        if (p.toLowerCase() === 'apple music' || p.toLowerCase() === 'apple') platName = 'Apple Music';
        if (p.toLowerCase() === 'youtube') platName = 'YouTube';
        if (p.toLowerCase() === 'tiktok') platName = 'TikTok';
        if (p.toLowerCase() === 'amazon' || p.toLowerCase() === 'amazon music') platName = 'Amazon Music';
        
        platformMap[platName] = (platformMap[platName] || 0) + s;
        rowStreams += s;
      }
    } else {
      platformMap['Spotify'] = (platformMap['Spotify'] || 0) + r.spotifyStreams;
      platformMap['Apple Music'] = (platformMap['Apple Music'] || 0) + r.appleMusicStreams;
      platformMap['YouTube'] = (platformMap['YouTube'] || 0) + r.youtubeStreams;
      platformMap['TikTok'] = (platformMap['TikTok'] || 0) + r.tiktokStreams;
      platformMap['Amazon Music'] = (platformMap['Amazon Music'] || 0) + r.amazonStreams;
      platformMap['Lainnya'] = (platformMap['Lainnya'] || 0) + r.otherStreams;
      rowStreams = r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    }
    
    totalStreams += rowStreams;

    if (r.year === currentYear && r.month >= 1 && r.month <= 12) {
      monthlyRevenue[r.month - 1] += r.totalRevenue;
    }
  });

  const rawPlatformData = Object.entries(platformMap)
    .map(([name, value]) => ({ name, value }))
    .filter(p => p.value > 0)
    .sort((a, b) => b.value - a.value);

  // Convert to percentages
  let platformData = rawPlatformData.map(p => ({
    name: p.name,
    value: totalStreams > 0 ? (p.value / totalStreams) * 100 : 0
  }));

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
