import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { StreamingClient } from "./StreamingClient";

const prisma = new PrismaClient();

export default async function UserStreamingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artists: {
        include: {
          releases: {
            include: { tracks: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const artistIds = user?.artists.map((a) => a.id) || [];
  const allRoyalties = artistIds.length > 0 ? await prisma.royalty.findMany({
    where: { artistId: { in: artistIds } },
  }) : [];

  let realTotal = 0;
  let realRevenue = 0;
  const globalPlatformMap: Record<string, number> = {};

  allRoyalties.forEach((r) => {
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
        realTotal += (s as number);
      }
    } else {
      globalPlatformMap['Spotify'] = (globalPlatformMap['Spotify'] || 0) + r.spotifyStreams;
      globalPlatformMap['Apple Music'] = (globalPlatformMap['Apple Music'] || 0) + r.appleMusicStreams;
      globalPlatformMap['YouTube Music'] = (globalPlatformMap['YouTube Music'] || 0) + r.youtubeStreams;
      globalPlatformMap['TikTok'] = (globalPlatformMap['TikTok'] || 0) + r.tiktokStreams;
      globalPlatformMap['Amazon Music'] = (globalPlatformMap['Amazon Music'] || 0) + r.amazonStreams;
      globalPlatformMap['Lainnya'] = (globalPlatformMap['Lainnya'] || 0) + r.otherStreams;
      realTotal += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    }
  });

  const globalPlatforms = Object.entries(globalPlatformMap).map(([n, v]) => ({ name: n, value: v }));

  const approvedReleases = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "APPROVED" } })
    : 0;

  const royaltyBySong: Record<string, { platforms: Record<string, number>; revenue: number; totalStreams: number }> = {};
  const monthlyMap: Record<string, { label: string; streams: number; revenue: number }> = {};

  allRoyalties.forEach((r) => {
    const key = r.songName.trim().toLowerCase();
    if (!royaltyBySong[key]) royaltyBySong[key] = { platforms: {}, revenue: 0, totalStreams: 0 };
    royaltyBySong[key].revenue += r.totalRevenue;
    
    let rowStr = 0;
    if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
      for (const [p, s] of Object.entries(r.platformData)) {
        let plat = p;
        if (p.toLowerCase() === 'spotify') plat = 'Spotify';
        if (p.toLowerCase() === 'apple music' || p.toLowerCase() === 'apple') plat = 'Apple Music';
        royaltyBySong[key].platforms[plat] = (royaltyBySong[key].platforms[plat] || 0) + (s as number);
        rowStr += (s as number);
      }
    } else {
      royaltyBySong[key].platforms['Spotify'] = (royaltyBySong[key].platforms['Spotify'] || 0) + r.spotifyStreams;
      royaltyBySong[key].platforms['Apple Music'] = (royaltyBySong[key].platforms['Apple Music'] || 0) + r.appleMusicStreams;
      royaltyBySong[key].platforms['YouTube Music'] = (royaltyBySong[key].platforms['YouTube Music'] || 0) + r.youtubeStreams;
      royaltyBySong[key].platforms['TikTok'] = (royaltyBySong[key].platforms['TikTok'] || 0) + r.tiktokStreams;
      royaltyBySong[key].platforms['Amazon Music'] = (royaltyBySong[key].platforms['Amazon Music'] || 0) + r.amazonStreams;
      royaltyBySong[key].platforms['Lainnya'] = (royaltyBySong[key].platforms['Lainnya'] || 0) + r.otherStreams;
      rowStr += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    }
    
    royaltyBySong[key].totalStreams += rowStr;

    const mKey = `${r.year}-${String(r.month).padStart(2, "0")}`;
    const d = new Date(r.year, r.month - 1);
    const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
    if (!monthlyMap[mKey]) monthlyMap[mKey] = { label, streams: 0, revenue: 0 };
    monthlyMap[mKey].streams  += rowStr;
    monthlyMap[mKey].revenue  += r.totalRevenue;
  });

  const sortedMonthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  const globalDailyStreams = buildDailyFromMonthly(sortedMonthly, realTotal);

  const allTracks: TrackData[] = [];
  const now = new Date();

  for (const artist of (user?.artists || [])) {
    for (const release of artist.releases) {
      const relDate = new Date(release.releaseDate);
      const daysSince = Math.floor((now.getTime() - relDate.getTime()) / 86_400_000);
      const releaseKey = release.title.trim().toLowerCase();

      if (release.tracks.length > 0) {
        for (const track of release.tracks) {
          const trackKey = track.title.trim().toLowerCase();
          const roy = royaltyBySong[trackKey] || royaltyBySong[releaseKey] || null;

          const total = roy?.totalStreams ?? 0;
          const revenue = roy?.revenue ?? 0;
          const spotify = roy?.platforms['Spotify'] ?? 0;
          const apple = roy?.platforms['Apple Music'] ?? 0;

          allTracks.push({
            id:           track.id,
            rank:         allTracks.length + 1,
            title:        track.title,
            artist:       release.primaryArtist,
            isrc:         track.isrc || `IDZ${String(allTracks.length + 1).padStart(9, "0")}`,
            album:        release.title,
            releaseDate:  relDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
            cover:        release.coverArtworkUrl,
            isNew:        daysSince <= 30,
            isTrending:   false,
            totalStreams: total,
            revenue,
            listeners:    Math.round((spotify + apple) * 0.7),
            saves:        Math.round(spotify * 0.05),
            hasRealData:  !!roy,
            platforms:    roy ? Object.entries(roy.platforms).map(([n,v]) => ({name: n, value: v})) : [],
            dailyStreams: buildDailyFromTotal(total, 30),
            countries:    buildCountries(total),
            cities:       buildCities(total),
          });
        }
      } else {
        const roy = royaltyBySong[releaseKey] || null;

        const total = roy?.totalStreams ?? 0;
        const revenue = roy?.revenue ?? 0;
        const spotify = roy?.platforms['Spotify'] ?? 0;
        const apple = roy?.platforms['Apple Music'] ?? 0;

        allTracks.push({
          id:           release.id,
          rank:         allTracks.length + 1,
          title:        release.title,
          artist:       release.primaryArtist,
          isrc:         `IDZ${String(allTracks.length + 1).padStart(9, "0")}`,
          album:        release.title,
          releaseDate:  relDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
          cover:        release.coverArtworkUrl,
          isNew:        daysSince <= 30,
          isTrending:   false,
          totalStreams: total,
          revenue,
          listeners:    Math.round((spotify + apple) * 0.7),
          saves:        Math.round(spotify * 0.05),
          hasRealData:  !!roy,
          platforms:    roy ? Object.entries(roy.platforms).map(([n,v]) => ({name: n, value: v})) : [],
          dailyStreams: buildDailyFromTotal(total, 30),
          countries:    buildCountries(total),
          cities:       buildCities(total),
        });
      }
    }
  }

  allTracks.sort((a, b) => b.totalStreams - a.totalStreams);
  allTracks.forEach((t, i) => {
    t.rank = i + 1;
    t.isTrending = i < 3 && t.totalStreams > 0;
  });

  const finalTracks = allTracks;

  const globalStats = {
    totalStreams: realTotal,
    monthlyListeners: Math.round(realTotal * 0.15),
    followers:        Math.round(realTotal * 0.029),
    saves:            Math.round((globalPlatformMap['Spotify'] || 0) * 0.05),
    revenue:          realRevenue,
    watchTimeHours:   Math.round(realTotal * 0.00145),
    totalPlaylists:   Math.max(1, approvedReleases * 3) || 0,
    activeReleases:   approvedReleases || 0,
  };

  return (
    <StreamingClient
      allTracks={finalTracks}
      globalStats={globalStats}
      globalDailyStreams={globalDailyStreams}
      globalPlatforms={globalPlatforms}
      hasRealData={realTotal > 0}
      userName={session.user.name || "Artist"}
    />
  );
}

// ============================================================================
// Types
// ============================================================================
export type TrackData = {
  id: string; rank: number; title: string; artist: string;
  isrc: string; album: string; releaseDate: string;
  cover: string | null; isNew: boolean; isTrending: boolean;
  totalStreams: number; revenue: number; listeners: number; saves: number;
  hasRealData: boolean;
  platforms: {name: string; value: number}[];
  dailyStreams: { date: string; streams: number }[];
  countries:   { name: string; flag: string; pct: number; streams: number }[];
  cities:      { name: string; country: string; streams: number }[];
};

// ============================================================================
// Helpers
// ============================================================================
function buildDailyFromTotal(total: number, days: number) {
  if (total === 0) return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, streams: 0 };
  });
  const avg = Math.round(total / days);
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const noise = Math.sin((i * 17) % 10) * 0.3 + 1;
    result.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, streams: Math.max(0, Math.round(avg * noise)) });
  }
  return result;
}

function buildDailyFromMonthly(
  monthly: { label: string; streams: number }[],
  fallbackTotal: number,
): { date: string; streams: number }[] {
  if (monthly.length === 0) return buildDailyFromTotal(fallbackTotal, 30);
  const lastMonth = monthly[monthly.length - 1];
  return buildDailyFromTotal(lastMonth.streams, 30);
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
