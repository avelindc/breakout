import { PrismaClient } from "@prisma/client";
import { AdminStreamingClient } from "./AdminStreamingClient";

const prisma = new PrismaClient();

export default async function AdminStreamingPage() {
  const [
    totalArtists, totalReleases, pendingReleases, approvedReleases, rejectedReleases,
    totalTracks, totalWithdrawals
  ] = await Promise.all([
    prisma.artist.count(),
    prisma.release.count(),
    prisma.release.count({ where: { status: "PENDING" } }),
    prisma.release.count({ where: { status: "APPROVED" } }),
    prisma.release.count({ where: { status: "REJECTED" } }),
    prisma.track.count(),
    prisma.withdrawRequest.count(),
  ]);

  const pendingWithdrawAgg = await prisma.withdrawRequest.aggregate({
    _sum: { amount: true },
    where: { status: "PENDING" },
  });
  const completedWithdrawAgg = await prisma.withdrawRequest.aggregate({
    _sum: { amount: true },
    where: { status: "PAID" },
  });

  console.time("fetchData");
  const dbArtists = await prisma.artist.findMany({
    include: {
      releases: {
        include: { tracks: { select: { id: true, title: true, isrc: true } } },
        orderBy: { createdAt: "desc" },
      },
      royalties: {
        orderBy: { createdAt: "desc" },
      },
      user: { select: { status: true } },
    },
  });
  console.timeEnd("fetchData");

  console.time("processGlobal");
  let realRevenue = 0;
  let realTotalStreams = 0;
  const globalPlatformMap: Record<string, number> = {};
  
  const allRoyalties = dbArtists.flatMap(a => a.royalties);
  allRoyalties.forEach(r => {
    realRevenue += r.totalRevenue;
    
    if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
      for (const [p, s] of Object.entries(r.platformData)) {
        let plat = p;
        if (p.toLowerCase() === 'spotify') plat = 'Spotify';
        if (p.toLowerCase() === 'apple music' || p.toLowerCase() === 'apple') plat = 'Apple Music';
        if (p.toLowerCase() === 'youtube') plat = 'YouTube Music';
        if (p.toLowerCase() === 'tiktok') plat = 'TikTok';
        if (p.toLowerCase() === 'amazon' || p.toLowerCase() === 'amazon music') plat = 'Amazon Music';
        globalPlatformMap[plat] = (globalPlatformMap[plat] || 0) + (s as number);
        realTotalStreams += (s as number);
      }
    } else {
      globalPlatformMap['Spotify'] = (globalPlatformMap['Spotify'] || 0) + r.spotifyStreams;
      globalPlatformMap['Apple Music'] = (globalPlatformMap['Apple Music'] || 0) + r.appleMusicStreams;
      globalPlatformMap['YouTube Music'] = (globalPlatformMap['YouTube Music'] || 0) + r.youtubeStreams;
      globalPlatformMap['TikTok'] = (globalPlatformMap['TikTok'] || 0) + r.tiktokStreams;
      globalPlatformMap['Amazon Music'] = (globalPlatformMap['Amazon Music'] || 0) + r.amazonStreams;
      globalPlatformMap['Lainnya'] = (globalPlatformMap['Lainnya'] || 0) + r.otherStreams;
      realTotalStreams += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    }
  });

  const activeArtistsCount   = dbArtists.filter(a => a.user.status === "APPROVED").length;
  const verifiedArtistsCount = dbArtists.length;
  const premiumArtistsCount  = Math.max(1, Math.round(dbArtists.length * 0.2));

  const overview = {
    totalArtists, activeArtistsCount, verifiedArtistsCount, premiumArtistsCount,
    totalReleases, pendingReleases, approvedReleases, rejectedReleases,
    totalTracks, totalWithdrawals,
    pendingWithdraw: pendingWithdrawAgg._sum.amount || 0,
    completedWithdraw: completedWithdrawAgg._sum.amount || 0,
    totalStreams: realTotalStreams,
    monthlyStreams: Math.round(realTotalStreams / 6),
    totalRevenue: realRevenue,
  };
  console.timeEnd("processGlobal");

  console.time("processArtistsAndTracks");
  const now = new Date();
  const allTracks: TrackData[] = [];
  const artists: ArtistData[] = [];

  for (const artist of dbArtists) {
    const artistRoyalties = artist.royalties;
    const royaltyBySong: Record<string, { platforms: Record<string, number>; revenue: number; totalStreams: number }> = {};
    
    let aRevenue = 0;
    let aTotalStreams = 0;
    const aPlatformMap: Record<string, number> = {};

    artistRoyalties.forEach(r => {
      aRevenue += r.totalRevenue;
      
      const key = r.songName.trim().toLowerCase();
      if (!royaltyBySong[key]) royaltyBySong[key] = { platforms: {}, revenue: 0, totalStreams: 0 };
      royaltyBySong[key].revenue += r.totalRevenue;
      
      let rowStr = 0;
      if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
        for (const [p, s] of Object.entries(r.platformData)) {
          let plat = p;
          if (p.toLowerCase() === 'spotify') plat = 'Spotify';
          if (p.toLowerCase() === 'apple music' || p.toLowerCase() === 'apple') plat = 'Apple Music';
          
          aPlatformMap[plat] = (aPlatformMap[plat] || 0) + (s as number);
          royaltyBySong[key].platforms[plat] = (royaltyBySong[key].platforms[plat] || 0) + (s as number);
          rowStr += (s as number);
        }
      } else {
        aPlatformMap['Spotify'] = (aPlatformMap['Spotify'] || 0) + r.spotifyStreams;
        aPlatformMap['Apple Music'] = (aPlatformMap['Apple Music'] || 0) + r.appleMusicStreams;
        aPlatformMap['YouTube Music'] = (aPlatformMap['YouTube Music'] || 0) + r.youtubeStreams;
        aPlatformMap['TikTok'] = (aPlatformMap['TikTok'] || 0) + r.tiktokStreams;
        aPlatformMap['Amazon Music'] = (aPlatformMap['Amazon Music'] || 0) + r.amazonStreams;
        aPlatformMap['Lainnya'] = (aPlatformMap['Lainnya'] || 0) + r.otherStreams;
        
        royaltyBySong[key].platforms['Spotify'] = (royaltyBySong[key].platforms['Spotify'] || 0) + r.spotifyStreams;
        royaltyBySong[key].platforms['Apple Music'] = (royaltyBySong[key].platforms['Apple Music'] || 0) + r.appleMusicStreams;
        royaltyBySong[key].platforms['YouTube Music'] = (royaltyBySong[key].platforms['YouTube Music'] || 0) + r.youtubeStreams;
        royaltyBySong[key].platforms['TikTok'] = (royaltyBySong[key].platforms['TikTok'] || 0) + r.tiktokStreams;
        royaltyBySong[key].platforms['Amazon Music'] = (royaltyBySong[key].platforms['Amazon Music'] || 0) + r.amazonStreams;
        royaltyBySong[key].platforms['Lainnya'] = (royaltyBySong[key].platforms['Lainnya'] || 0) + r.otherStreams;
        
        rowStr += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
      }
      
      aTotalStreams += rowStr;
      royaltyBySong[key].totalStreams += rowStr;
    });

    const artistData: ArtistData = {
      id: artist.id,
      rank: 0,
      name: artist.stageName,
      avatar: artist.avatarUrl,
      trackCount: 0,
      totalStreams: aTotalStreams,
      revenue: aRevenue,
      listeners: Math.round(((aPlatformMap["Spotify"]||0) + (aPlatformMap["Apple Music"]||0)) * 0.7),
      followers: Math.round(aTotalStreams * 0.029),
      playlists: Math.max(1, artist.releases.length * 3),
      hasRealData: aTotalStreams > 0,
      platforms: Object.entries(aPlatformMap).map(([n, v]) => ({name: n, value: v})),
      dailyStreams: buildDailyFromTotal(artist.id, aTotalStreams, 30),
      countries: buildCountries(aTotalStreams),
      cities: buildCities(aTotalStreams),
    };

    for (const release of artist.releases) {
      const relDate = new Date(release.releaseDate);
      const daysSince = Math.floor((now.getTime() - relDate.getTime()) / 86_400_000);
      const releaseKey = release.title.trim().toLowerCase();

      const processItem = (id: string, title: string, isrc: string | null) => {
        artistData.trackCount++;
        const royKey = title.trim().toLowerCase();
        const roy = royaltyBySong[royKey] || royaltyBySong[releaseKey] || null;

        const total = roy?.totalStreams ?? 0;
        const revenue = roy?.revenue ?? 0;
        const spotify = roy?.platforms['Spotify'] ?? 0;
        const apple = roy?.platforms['Apple Music'] ?? 0;

        allTracks.push({
          id,
          artistId: artist.id,
          title,
          artist: artist.stageName,
          isrc: isrc || `IDZ${String(allTracks.length + 1).padStart(9, "0")}`,
          album: release.title,
          releaseDate: relDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
          cover: release.coverArtworkUrl,
          isNew: daysSince <= 30,
          isTrending: false,
          totalStreams: total,
          revenue,
          listeners: Math.round((spotify + apple) * 0.7),
          saves: Math.round(spotify * 0.05),
          hasRealData: !!roy,
          platforms: roy ? Object.entries(roy.platforms).map(([n,v]) => ({name: n, value: v})) : [],
          dailyStreams: buildDailyFromTotal(id, total, 30),
          countries: buildCountries(total),
          cities: buildCities(total),
        });
      };

      if (release.tracks.length > 0) {
        release.tracks.forEach(t => processItem(t.id, t.title, t.isrc));
      } else {
        processItem(release.id, release.title, null);
      }
    }

    artists.push(artistData);
  }

  artists.sort((a, b) => b.totalStreams - a.totalStreams);
  artists.forEach((a, i) => a.rank = i + 1);

  allTracks.sort((a, b) => b.totalStreams - a.totalStreams);
  allTracks.forEach((t, i) => {
    t.isTrending = i < 10 && t.totalStreams > 0;
  });

  const finalArtists = artists;
  const finalTracks = allTracks;

  const globalPlatforms17 = Object.entries(globalPlatformMap).map(([n, v]) => ({name: n, value: v as number}));

  let mRevenue = 0;
  const m1 = await prisma.royalty.findMany({ where: { month: now.getMonth() + 1, year: now.getFullYear() } });
  m1.forEach(r => mRevenue += r.totalRevenue);
  
  const monthlyRevenue = [];
  const monthlyStreams = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const mName = d.toLocaleString('id-ID', { month: 'short' });

    const agg = await prisma.royalty.aggregate({
      _sum: { totalRevenue: true },
      where: { month: m, year: y },
    });

    let str = 0;
    const mRoyalties = await prisma.royalty.findMany({ where: { month: m, year: y } });
    mRoyalties.forEach(r => {
      if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
        str += Object.values(r.platformData).reduce((a:any, b:any) => a+b, 0);
      } else {
        str += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
      }
    });

    monthlyRevenue.push({ month: mName, revenue: agg._sum.totalRevenue || 0 });
    monthlyStreams.push({ month: mName, streams: str });
  }

  const globalDailyStreams = buildDailyFromTotal("global", realTotalStreams, 30);
  
  console.timeEnd("processArtistsAndTracks");

  artists.sort((a, b) => b.totalStreams - a.totalStreams);
  artists.forEach((a, i) => a.rank = i + 1);
  const topArtists = artists.slice(0, 100);
  
  allTracks.sort((a, b) => b.totalStreams - a.totalStreams);
  allTracks.forEach((t, i) => {
    t.isTrending = i < 10 && t.totalStreams > 0;
  });
  const topTracks = allTracks.slice(0, 100);

  return (
    <div className="min-h-screen fundflow-bg">
      <AdminStreamingClient
      data={{
        overview,
        globalPlatforms: globalPlatforms17,
        monthlyRevenue,
        monthlyStreams,
        globalDailyStreams,
        artists: topArtists,
        allTracks: topTracks,
      }}
    />
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================
export type ArtistData = {
  id: string; rank: number; name: string; avatar: string | null;
  trackCount: number; totalStreams: number; revenue: number;
  listeners: number; followers: number; playlists: number;
  hasRealData: boolean;
  platforms: {name: string; value: number}[];
  dailyStreams: { date: string; streams: number }[];
  countries: { name: string; flag: string; pct: number; streams: number }[];
  cities: { name: string; country: string; streams: number }[];
};

export type TrackData = {
  id: string; artistId: string; title: string; artist: string;
  isrc: string; album: string; releaseDate: string;
  cover: string | null; isNew: boolean; isTrending: boolean;
  totalStreams: number; revenue: number; listeners: number; saves: number;
  hasRealData: boolean;
  platforms: {name: string; value: number}[];
  dailyStreams: { date: string; streams: number }[];
  countries: { name: string; flag: string; pct: number; streams: number }[];
  cities: { name: string; country: string; streams: number }[];
};

// ============================================================================
// Helpers
// ============================================================================
function buildDailyFromTotal(id: string, total: number, days: number) {
  if (total === 0) return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, streams: 0 };
  });
  const avg = Math.round(total / days);
  const result = [];
  const today = new Date();
  
  let numId = 0;
  for (let i = 0; i < id.length; i++) numId += id.charCodeAt(i);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const noise = Math.sin((numId + i * 17) % 10) * 0.3 + 1;
    result.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, streams: Math.max(0, Math.round(avg * noise)) });
  }
  return result;
}

const COUNTRY_WEIGHTS = [
  { name: "Indonesia",     flag: "🇮🇩", w: 0.248 },
  { name: "United States", flag: "🇺🇸", w: 0.187 },
  { name: "Brazil",        flag: "🇧🇷", w: 0.094 },
  { name: "India",         flag: "🇮🇳", w: 0.068 },
  { name: "United Kingdom",flag: "🇬🇧", w: 0.042 },
  { name: "Philippines",   flag: "🇵🇭", w: 0.037 },
  { name: "Malaysia",      flag: "🇲🇾", w: 0.029 },
  { name: "Thailand",      flag: "🇹🇭", w: 0.032 },
  { name: "Mexico",        flag: "🇲🇽", w: 0.040 },
  { name: "Vietnam",       flag: "🇻🇳", w: 0.025 },
  { name: "Germany",       flag: "🇩🇪", w: 0.021 },
  { name: "Japan",         flag: "🇯🇵", w: 0.019 },
  { name: "France",        flag: "🇫🇷", w: 0.016 },
];

function buildCountries(total: number) {
  return COUNTRY_WEIGHTS.map(c => ({
    name: c.name, flag: c.flag,
    pct:  +(c.w * 100).toFixed(1),
    streams: Math.round(total * c.w),
  }));
}

const CITY_WEIGHTS = [
  { name: "Jakarta",     country: "Indonesia",   w: 0.104 },
  { name: "Surabaya",    country: "Indonesia",   w: 0.049 },
  { name: "Los Angeles", country: "USA",         w: 0.045 },
  { name: "São Paulo",   country: "Brazil",      w: 0.036 },
  { name: "New York",    country: "USA",         w: 0.034 },
  { name: "Bandung",     country: "Indonesia",   w: 0.031 },
  { name: "Manila",      country: "Philippines", w: 0.026 },
  { name: "Mumbai",      country: "India",       w: 0.023 },
];

function buildCities(total: number) {
  return CITY_WEIGHTS.map(c => ({
    name: c.name, country: c.country,
    streams: Math.round(total * c.w),
  }));
}
