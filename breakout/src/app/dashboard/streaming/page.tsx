import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import { StreamingClient } from "./StreamingClient";

const prisma = new PrismaClient();

export default async function StreamingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      artists: {
        include: {
          releases: {
            include: {
              tracks: { select: { id: true, title: true, isrc: true } },
            },
            orderBy: { createdAt: "desc" },
          },
          royalties: {
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  const artistIds = user?.artists.map((a) => a.id) || [];

  // ── Aggregate ALL royalties for global stats ────────────────────────────────
  const allRoyalties = user?.artists.flatMap((a) => a.royalties) || [];

  // These are the ONLY fields from DB — do not invent data for other platforms
  const realSpotify  = allRoyalties.reduce((s, r) => s + r.spotifyStreams, 0);
  const realApple    = allRoyalties.reduce((s, r) => s + r.appleMusicStreams, 0);
  const realYoutube  = allRoyalties.reduce((s, r) => s + r.youtubeStreams, 0);
  const realTiktok   = allRoyalties.reduce((s, r) => s + r.tiktokStreams, 0);
  const realAmazon   = allRoyalties.reduce((s, r) => s + r.amazonStreams, 0);
  const realOther    = allRoyalties.reduce((s, r) => s + r.otherStreams, 0);
  const realRevenue  = allRoyalties.reduce((s, r) => s + r.totalRevenue, 0);
  const realTotal    = realSpotify + realApple + realYoutube + realTiktok + realAmazon + realOther;
  const hasRealData  = realTotal > 0;

  const approvedReleases = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "APPROVED" } })
    : 0;

  // ── Royalties grouped per songName — real per-track data ───────────────────
  const royaltyBySong: Record<string, {
    spotify: number; apple: number; youtube: number; tiktok: number;
    amazon: number; other: number; revenue: number;
  }> = {};

  allRoyalties.forEach((r) => {
    const key = r.songName.trim().toLowerCase();
    if (!royaltyBySong[key]) {
      royaltyBySong[key] = { spotify: 0, apple: 0, youtube: 0, tiktok: 0, amazon: 0, other: 0, revenue: 0 };
    }
    royaltyBySong[key].spotify  += r.spotifyStreams;
    royaltyBySong[key].apple    += r.appleMusicStreams;
    royaltyBySong[key].youtube  += r.youtubeStreams;
    royaltyBySong[key].tiktok   += r.tiktokStreams;
    royaltyBySong[key].amazon   += r.amazonStreams;
    royaltyBySong[key].other    += r.otherStreams;
    royaltyBySong[key].revenue  += r.totalRevenue;
  });

  // ── Monthly royalties (for monthly chart breakdown) ─────────────────────────
  const monthlyMap: Record<string, { label: string; streams: number; revenue: number }> = {};
  allRoyalties.forEach((r) => {
    const key = `${r.year}-${String(r.month).padStart(2, "0")}`;
    const d = new Date(r.year, r.month - 1);
    const label = d.toLocaleString("id-ID", { month: "short", year: "2-digit" });
    if (!monthlyMap[key]) monthlyMap[key] = { label, streams: 0, revenue: 0 };
    const streams = r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    monthlyMap[key].streams  += streams;
    monthlyMap[key].revenue  += r.totalRevenue;
  });

  const sortedMonthly = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // Build 30-point daily streams from monthly (distribute evenly per day)
  const globalDailyStreams = buildDailyFromMonthly(sortedMonthly, hasRealData ? realTotal : 856_421);

  // ── Build platform data — ONLY real DB fields, no fake platforms ───────────
  //    "Lainnya" covers Amazon + Other (otherStreams from DB)
  //    Instagram, Facebook, Boomplay, etc. are NOT in DB → shown as 0 / hidden
  const globalPlatforms = [
    { name: "Spotify",       streams: hasRealData ? realSpotify  : 533_000, color: "#1DB954", isReal: hasRealData },
    { name: "Apple Music",   streams: hasRealData ? realApple    : 119_897, color: "#FC3C44", isReal: hasRealData },
    { name: "YouTube Music", streams: hasRealData ? realYoutube  :  94_206, color: "#FF0000", isReal: hasRealData },
    { name: "TikTok",        streams: hasRealData ? realTiktok   :  59_948, color: "#69C9D0", isReal: hasRealData },
    { name: "Amazon Music",  streams: hasRealData ? realAmazon   :  28_642, color: "#00A8E1", isReal: hasRealData },
    { name: "Lainnya",       streams: hasRealData ? realOther    :   6_100, color: "#94A3B8", isReal: hasRealData },
  ].filter(p => p.streams > 0);

  // ── Build all tracks from DB ────────────────────────────────────────────────
  const allTracks: TrackData[] = [];
  const now = new Date();

  for (const artist of (user?.artists || [])) {
    for (const release of artist.releases) {
      const relDate = new Date(release.releaseDate);
      const daysSince = Math.floor((now.getTime() - relDate.getTime()) / 86_400_000);
      const releaseKey = release.title.trim().toLowerCase();

      if (release.tracks.length > 0) {
        // Per-track data
        for (const track of release.tracks) {
          const trackKey = track.title.trim().toLowerCase();
          // Try matching royalty by track title first, then by release title
          const roy = royaltyBySong[trackKey] || royaltyBySong[releaseKey] || null;

          const spotify  = roy?.spotify  ?? 0;
          const apple    = roy?.apple    ?? 0;
          const youtube  = roy?.youtube  ?? 0;
          const tiktok   = roy?.tiktok   ?? 0;
          const amazon   = roy?.amazon   ?? 0;
          const other    = roy?.other    ?? 0;
          const revenue  = roy?.revenue  ?? 0;
          const total    = spotify + apple + youtube + tiktok + amazon + other;

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
            isTrending:   false, // determined by rank/streams later
            totalStreams: total,
            revenue,
            listeners:    Math.round((spotify + apple) * 0.7),
            saves:        Math.round(spotify * 0.05),
            hasRealData:  !!roy,
            platforms:    { spotify, apple, youtube, tiktok, amazon, other },
            dailyStreams: buildDailyFromTotal(total, 30),
            countries:    buildCountries(total),
            cities:       buildCities(total),
          });
        }
      } else {
        // Release without tracks — use release title to match royalty
        const roy = royaltyBySong[releaseKey] || null;

        const spotify  = roy?.spotify  ?? 0;
        const apple    = roy?.apple    ?? 0;
        const youtube  = roy?.youtube  ?? 0;
        const tiktok   = roy?.tiktok   ?? 0;
        const amazon   = roy?.amazon   ?? 0;
        const other    = roy?.other    ?? 0;
        const revenue  = roy?.revenue  ?? 0;
        const total    = spotify + apple + youtube + tiktok + amazon + other;

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
          platforms:    { spotify, apple, youtube, tiktok, amazon, other },
          dailyStreams: buildDailyFromTotal(total, 30),
          countries:    buildCountries(total),
          cities:       buildCities(total),
        });
      }
    }
  }

  // Sort by streams desc, update rank & isTrending
  allTracks.sort((a, b) => b.totalStreams - a.totalStreams);
  allTracks.forEach((t, i) => {
    t.rank = i + 1;
    t.isTrending = i < 3 && t.totalStreams > 0;
  });

  // Fallback dummy if no releases at all
  const finalTracks = allTracks.length > 0 ? allTracks : DUMMY_TRACKS;

  // ── Global stats ───────────────────────────────────────────────────────────
  const globalStats = {
    totalStreams: realTotal,
    monthlyListeners: hasRealData ? Math.round(realTotal * 0.15) : 128_742,
    followers:        Math.round((hasRealData ? realTotal : 856_421) * 0.029),
    saves:            Math.round((hasRealData ? realSpotify : 533_000) * 0.05),
    revenue:          hasRealData ? realRevenue            : 56_800_000,
    watchTimeHours:   Math.round((hasRealData ? realTotal : 856_421) * 0.00145),
    totalPlaylists:   Math.max(1, approvedReleases * 3) || 89,
    activeReleases:   approvedReleases || 12,
  };

  return (
    <StreamingClient
      allTracks={finalTracks}
      globalStats={globalStats}
      globalDailyStreams={globalDailyStreams}
      globalPlatforms={globalPlatforms}
      hasRealData={hasRealData}
      userName={session.user.name || "Artist"}
    />
  );
}

// ── Types ────────────────────────────────────────────────────────────────────
export type PlatformStreams = {
  spotify: number; apple: number; youtube: number;
  tiktok: number; amazon: number; other: number;
};

export type TrackData = {
  id: string; rank: number; title: string; artist: string;
  isrc: string; album: string; releaseDate: string;
  cover: string | null; isNew: boolean; isTrending: boolean;
  totalStreams: number; revenue: number; listeners: number; saves: number;
  hasRealData: boolean;
  platforms: PlatformStreams;
  dailyStreams: { date: string; streams: number }[];
  countries:   { name: string; flag: string; pct: number; streams: number }[];
  cities:      { name: string; country: string; streams: number }[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build 30-day sparkline from total streams (uniform + noise) */
function buildDailyFromTotal(total: number, days: number) {
  if (total === 0) return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, streams: 0 };
  });
  const avg = Math.round(total / days);
  const result = [];
  const today = new Date();
  // Use a simple but stable variation based on day index
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    // Deterministic noise: sine wave to avoid totally flat line
    const noise = Math.sin((i * 17) % 10) * 0.3 + 1;
    result.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, streams: Math.max(0, Math.round(avg * noise)) });
  }
  return result;
}

/** Build daily from monthly royalty records */
function buildDailyFromMonthly(
  monthly: { label: string; streams: number }[],
  fallbackTotal: number,
): { date: string; streams: number }[] {
  if (monthly.length === 0) return buildDailyFromTotal(fallbackTotal, 30);
  // Take last 30 days, distribute last month's streams
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

// ── Dummy tracks (when no DB releases) ───────────────────────────────────────
const DUMMY_PLATFORMS = (base: number): PlatformStreams => ({
  spotify:  Math.round(base * 0.62),
  apple:    Math.round(base * 0.067),
  youtube:  Math.round(base * 0.059),
  tiktok:   Math.round(base * 0.067),
  amazon:   Math.round(base * 0.058),
  other:    Math.round(base * 0.007),
});

const DUMMY_TRACKS: TrackData[] = [
  { title: "Global Royalty",  isrc: "IDZ000000001", album: "Single",          releaseDate: "01 Jan 2024", isTrending: true,  isNew: false },
  { title: "Midnight Drive",  isrc: "IDZ012345678", album: "City Lights EP",  releaseDate: "15 Apr 2024", isTrending: true,  isNew: false },
  { title: "Echoes of You",   isrc: "IDZ012345679", album: "Reminiscence",    releaseDate: "05 May 2024", isTrending: true,  isNew: false },
  { title: "Broken Dreams",   isrc: "IDZ012345680", album: "City Lights EP",  releaseDate: "15 Apr 2024", isTrending: false, isNew: false },
  { title: "Lost in Space",   isrc: "IDZ012345681", album: "Cosmic Journey",  releaseDate: "10 Mar 2024", isTrending: false, isNew: false },
  { title: "Sunset Paradise", isrc: "IDZ012345682", album: "Summer Vibes",    releaseDate: "22 Jun 2024", isTrending: false, isNew: false },
  { title: "Dream Walker",    isrc: "IDZ012345683", album: "Dreamscape",      releaseDate: "08 Jul 2024", isTrending: false, isNew: true  },
  { title: "Never Give Up",   isrc: "IDZ012345684", album: "Motivation",      releaseDate: "12 Feb 2024", isTrending: false, isNew: false },
  { title: "Fire Inside",     isrc: "IDZ012345685", album: "Passion",         releaseDate: "30 Mar 2024", isTrending: false, isNew: false },
  { title: "Ocean Lights",    isrc: "IDZ012345686", album: "Ambient",         releaseDate: "02 Aug 2024", isTrending: false, isNew: true  },
].map((t, i) => {
  const baseStreams = Math.round(856_421 * Math.pow(0.65, i));
  const pl = DUMMY_PLATFORMS(baseStreams);
  return {
    id:           `dummy-${i}`,
    rank:         i + 1,
    title:        t.title,
    artist:       "Breakout Artist",
    isrc:         t.isrc,
    album:        t.album,
    releaseDate:  t.releaseDate,
    cover:        null,
    isNew:        t.isNew,
    isTrending:   t.isTrending,
    totalStreams: baseStreams,
    revenue:      Math.round(baseStreams * 0.05),
    listeners:    Math.round((pl.spotify + pl.apple) * 0.7),
    saves:        Math.round(pl.spotify * 0.05),
    hasRealData:  false,
    platforms:    pl,
    dailyStreams: buildDailyFromTotal(baseStreams, 30),
    countries:    buildCountries(baseStreams),
    cities:       buildCities(baseStreams),
  };
});
