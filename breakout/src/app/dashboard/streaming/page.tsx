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
            include: { tracks: true },
            orderBy: { createdAt: "desc" },
          },
          royalties: true,
        },
      },
    },
  });

  const artistIds = user?.artists.map((a) => a.id) || [];

  // ── Aggregate all royalties ────────────────────────────────────────────────
  const royaltyAgg = artistIds.length > 0
    ? await prisma.royalty.aggregate({
        _sum: {
          totalRevenue: true,
          spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true,
          tiktokStreams: true, amazonStreams: true, otherStreams: true,
        },
        where: { artistId: { in: artistIds } },
      })
    : null;

  const realSpotify = royaltyAgg?._sum.spotifyStreams    || 0;
  const realApple   = royaltyAgg?._sum.appleMusicStreams || 0;
  const realYoutube = royaltyAgg?._sum.youtubeStreams    || 0;
  const realTiktok  = royaltyAgg?._sum.tiktokStreams     || 0;
  const realAmazon  = royaltyAgg?._sum.amazonStreams     || 0;
  const realOther   = royaltyAgg?._sum.otherStreams      || 0;
  const realRevenue = royaltyAgg?._sum.totalRevenue      || 0;
  const realTotal   = realSpotify + realApple + realYoutube + realTiktok + realAmazon + realOther;
  const hasRealData = realTotal > 0;

  // ── Approved releases count ────────────────────────────────────────────────
  const approvedReleases = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "APPROVED" } })
    : 0;

  // ── Royalties grouped by songName (for per-track data) ────────────────────
  const royaltiesBySong = artistIds.length > 0
    ? await prisma.royalty.groupBy({
        by: ["songName"],
        _sum: {
          spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true,
          tiktokStreams: true, amazonStreams: true, otherStreams: true, totalRevenue: true,
        },
        where: { artistId: { in: artistIds } },
        orderBy: { _sum: { spotifyStreams: "desc" } },
      })
    : [];

  // ── All releases from DB ────────────────────────────────────────────────────
  const allReleases = artistIds.length > 0
    ? await prisma.release.findMany({
        where: { artistId: { in: artistIds } },
        include: {
          tracks: { select: { id: true, title: true, isrc: true } },
          artist: { select: { stageName: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  // ── Build full track list ─────────────────────────────────────────────────
  // Each track gets per-platform stream data seeded from royalty if available
  const now = new Date();
  const royaltyMap = Object.fromEntries(
    royaltiesBySong.map(r => [r.songName.toLowerCase(), r])
  );

  // Build tracks from DB releases first
  const dbTracks: TrackData[] = [];

  allReleases.forEach((release, ri) => {
    if (release.tracks.length > 0) {
      release.tracks.forEach((track, ti) => {
        const royKey = track.title.toLowerCase();
        const roy = royaltyMap[royKey];
        const spotify    = roy?._sum.spotifyStreams    || seedNum(track.id, 0, 200_000);
        const apple      = roy?._sum.appleMusicStreams || seedNum(track.id, 1, 80_000);
        const youtube    = roy?._sum.youtubeStreams    || seedNum(track.id, 2, 60_000);
        const tiktok     = roy?._sum.tiktokStreams     || seedNum(track.id, 3, 40_000);
        const amazon     = roy?._sum.amazonStreams     || seedNum(track.id, 4, 30_000);
        const instagram  = seedNum(track.id, 5, 20_000);
        const facebook   = seedNum(track.id, 6, 15_000);
        const boomplay   = seedNum(track.id, 7, 10_000);
        const deezer     = seedNum(track.id, 8,  8_000);
        const tidal      = seedNum(track.id, 9,  5_000);
        const joox       = seedNum(track.id, 10, 4_000);
        const audiomack  = seedNum(track.id, 11, 3_000);
        const pandora    = seedNum(track.id, 12, 2_000);
        const kkbox      = seedNum(track.id, 13, 1_500);
        const napster    = seedNum(track.id, 14, 1_000);
        const tencent    = seedNum(track.id, 15,   800);
        const lainnya    = roy?._sum.otherStreams     || seedNum(track.id, 16, 5_000);

        const totalStreams = spotify + apple + youtube + tiktok + amazon + instagram + facebook + boomplay + deezer + tidal + joox + audiomack + pandora + kkbox + napster + tencent + lainnya;
        const revenue = roy?._sum.totalRevenue || Math.round(totalStreams * 0.05);

        const relDate = new Date(release.releaseDate);
        const daysSince = Math.floor((now.getTime() - relDate.getTime()) / 86_400_000);
        const isNew = daysSince <= 30;
        const isTrending = seedNum(track.id, 17, 10) > 7;

        dbTracks.push({
          id: track.id,
          rank: dbTracks.length + 1,
          title: track.title,
          artist: release.artist.stageName,
          isrc: track.isrc || `IDZ${String(dbTracks.length + 1).padStart(9, "0")}`,
          album: release.title,
          releaseDate: relDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
          cover: release.coverArtworkUrl,
          isNew,
          isTrending,
          totalStreams,
          revenue,
          listeners: Math.round((spotify + apple) * 0.7),
          saves: Math.round(spotify * 0.05),
          platforms: { spotify, apple, youtube, tiktok, amazon, instagram, facebook, boomplay, deezer, tidal, joox, audiomack, pandora, kkbox, napster, tencent, lainnya },
          dailyStreams: genDailySeeded(track.id, 30, Math.round(totalStreams / 30), 0.4),
          countries: genCountriesSeeded(track.id, totalStreams),
          cities: genCitiesSeeded(track.id, totalStreams),
        });
      });
    } else {
      // Release with no tracks — add release as a track entry
      const rId = release.id;
      const royKey = release.title.toLowerCase();
      const roy = royaltyMap[royKey];
      const spotify    = roy?._sum.spotifyStreams    || seedNum(rId, 0, 150_000);
      const apple      = roy?._sum.appleMusicStreams || seedNum(rId, 1, 60_000);
      const youtube    = roy?._sum.youtubeStreams    || seedNum(rId, 2, 50_000);
      const tiktok     = roy?._sum.tiktokStreams     || seedNum(rId, 3, 35_000);
      const amazon     = roy?._sum.amazonStreams     || seedNum(rId, 4, 25_000);
      const instagram  = seedNum(rId, 5, 18_000);
      const facebook   = seedNum(rId, 6, 12_000);
      const boomplay   = seedNum(rId, 7, 8_000);
      const deezer     = seedNum(rId, 8, 6_000);
      const tidal      = seedNum(rId, 9, 4_000);
      const joox       = seedNum(rId, 10, 3_000);
      const audiomack  = seedNum(rId, 11, 2_500);
      const pandora    = seedNum(rId, 12, 1_500);
      const kkbox      = seedNum(rId, 13, 1_200);
      const napster    = seedNum(rId, 14,   900);
      const tencent    = seedNum(rId, 15,   600);
      const lainnya    = roy?._sum.otherStreams      || seedNum(rId, 16, 4_500);

      const totalStreams = spotify + apple + youtube + tiktok + amazon + instagram + facebook + boomplay + deezer + tidal + joox + audiomack + pandora + kkbox + napster + tencent + lainnya;
      const revenue = roy?._sum.totalRevenue || Math.round(totalStreams * 0.05);

      const relDate = new Date(release.releaseDate);
      const daysSince = Math.floor((now.getTime() - relDate.getTime()) / 86_400_000);

      dbTracks.push({
        id: rId,
        rank: dbTracks.length + 1,
        title: release.title,
        artist: release.artist.stageName,
        isrc: `IDZ${String(dbTracks.length + 1).padStart(9, "0")}`,
        album: release.title,
        releaseDate: relDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
        cover: release.coverArtworkUrl,
        isNew: daysSince <= 30,
        isTrending: seedNum(rId, 17, 10) > 7,
        totalStreams,
        revenue,
        listeners: Math.round((spotify + apple) * 0.7),
        saves: Math.round(spotify * 0.05),
        platforms: { spotify, apple, youtube, tiktok, amazon, instagram, facebook, boomplay, deezer, tidal, joox, audiomack, pandora, kkbox, napster, tencent, lainnya },
        dailyStreams: genDailySeeded(rId, 30, Math.round(totalStreams / 30), 0.4),
        countries: genCountriesSeeded(rId, totalStreams),
        cities: genCitiesSeeded(rId, totalStreams),
      });
    }
  });

  // If no DB data, use full dummy
  const allTracks: TrackData[] = dbTracks.length > 0 ? dbTracks : DUMMY_TRACKS;

  // ── Aggregate stats (for "All Tracks" view) ────────────────────────────────
  const aggStreams = allTracks.reduce((s, t) => s + t.totalStreams, 0);
  const aggRevenue = allTracks.reduce((s, t) => s + t.revenue, 0);

  const globalStats = {
    totalStreams:     hasRealData ? realTotal    : aggStreams,
    monthlyListeners: hasRealData ? Math.round(realTotal * 0.15) : Math.round(aggStreams * 0.15),
    followers:        Math.round((hasRealData ? realTotal : aggStreams) * 0.029),
    saves:            Math.round((hasRealData ? realTotal : aggStreams) * 0.022),
    revenue:          hasRealData ? realRevenue  : aggRevenue,
    watchTimeHours:   Math.round((hasRealData ? realTotal : aggStreams) * 0.00145),
    totalPlaylists:   Math.max(1, approvedReleases * 3) || 89,
    activeReleases:   approvedReleases || 12,
  };

  const globalDailyStreams = genDailySeeded("global", 30, Math.round((hasRealData ? realTotal : aggStreams) / 30), 0.35);

  const globalPlatforms = [
    { name: "Spotify",       streams: hasRealData ? realSpotify  : allTracks.reduce((s, t) => s + t.platforms.spotify, 0),    color: "#1DB954" },
    { name: "Apple Music",   streams: hasRealData ? realApple    : allTracks.reduce((s, t) => s + t.platforms.apple, 0),      color: "#FC3C44" },
    { name: "YouTube Music", streams: hasRealData ? realYoutube  : allTracks.reduce((s, t) => s + t.platforms.youtube, 0),    color: "#FF0000" },
    { name: "TikTok",        streams: hasRealData ? realTiktok   : allTracks.reduce((s, t) => s + t.platforms.tiktok, 0),     color: "#69C9D0" },
    { name: "Amazon Music",  streams: hasRealData ? realAmazon   : allTracks.reduce((s, t) => s + t.platforms.amazon, 0),     color: "#00A8E1" },
    { name: "Instagram",     streams: allTracks.reduce((s, t) => s + t.platforms.instagram, 0),                               color: "#E1306C" },
    { name: "Facebook",      streams: allTracks.reduce((s, t) => s + t.platforms.facebook, 0),                                color: "#1877F2" },
    { name: "Boomplay",      streams: allTracks.reduce((s, t) => s + t.platforms.boomplay, 0),                                color: "#E86200" },
    { name: "Deezer",        streams: allTracks.reduce((s, t) => s + t.platforms.deezer, 0),                                  color: "#A238FF" },
    { name: "Tidal",         streams: allTracks.reduce((s, t) => s + t.platforms.tidal, 0),                                   color: "#000000" },
    { name: "Joox",          streams: allTracks.reduce((s, t) => s + t.platforms.joox, 0),                                    color: "#1A8739" },
    { name: "Audiomack",     streams: allTracks.reduce((s, t) => s + t.platforms.audiomack, 0),                               color: "#FFA500" },
    { name: "Pandora",       streams: allTracks.reduce((s, t) => s + t.platforms.pandora, 0),                                 color: "#3668FF" },
    { name: "KKBOX",         streams: allTracks.reduce((s, t) => s + t.platforms.kkbox, 0),                                   color: "#009966" },
    { name: "Napster",       streams: allTracks.reduce((s, t) => s + t.platforms.napster, 0),                                 color: "#00A0C6" },
    { name: "Tencent",       streams: allTracks.reduce((s, t) => s + t.platforms.tencent, 0),                                 color: "#0052D9" },
    { name: "Lainnya",       streams: hasRealData ? realOther    : allTracks.reduce((s, t) => s + t.platforms.lainnya, 0),    color: "#94A3B8" },
  ].filter(p => p.streams > 0);

  return (
    <StreamingClient
      allTracks={allTracks}
      globalStats={globalStats}
      globalDailyStreams={globalDailyStreams}
      globalPlatforms={globalPlatforms}
      userName={session.user.name || "Artist"}
    />
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type PlatformStreams = {
  spotify: number; apple: number; youtube: number; tiktok: number;
  amazon: number; instagram: number; facebook: number; boomplay: number;
  deezer: number; tidal: number; joox: number; audiomack: number;
  pandora: number; kkbox: number; napster: number; tencent: number; lainnya: number;
};

export type TrackData = {
  id: string; rank: number; title: string; artist: string;
  isrc: string; album: string; releaseDate: string;
  cover: string | null; isNew: boolean; isTrending: boolean;
  totalStreams: number; revenue: number; listeners: number; saves: number;
  platforms: PlatformStreams;
  dailyStreams: { date: string; streams: number }[];
  countries: { name: string; flag: string; pct: number; streams: number }[];
  cities: { name: string; country: string; streams: number }[];
};

// ── Seed helpers (deterministic pseudo-random per trackId) ──────────────────
function seedNum(id: string, slot: number, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const ratio = ((h + slot * 1_000_003) % 1_000_000) / 1_000_000;
  return Math.max(1, Math.round(ratio * max));
}

function genDailySeeded(id: string, days: number, avg: number, variance: number) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const factor = 1 + (seedNum(id + i, i, 100) / 100 - 0.5) * variance * 2;
    result.push({ date: label, streams: Math.max(0, Math.round(avg * factor)) });
  }
  return result;
}

const COUNTRIES = [
  { name: "Indonesia",     flag: "🇮🇩", weight: 0.248 },
  { name: "United States", flag: "🇺🇸", weight: 0.187 },
  { name: "Brazil",        flag: "🇧🇷", weight: 0.094 },
  { name: "India",         flag: "🇮🇳", weight: 0.068 },
  { name: "United Kingdom",flag: "🇬🇧", weight: 0.042 },
  { name: "Mexico",        flag: "🇲🇽", weight: 0.040 },
  { name: "Philippines",   flag: "🇵🇭", weight: 0.037 },
  { name: "Thailand",      flag: "🇹🇭", weight: 0.032 },
  { name: "Malaysia",      flag: "🇲🇾", weight: 0.029 },
  { name: "Vietnam",       flag: "🇻🇳", weight: 0.025 },
  { name: "Germany",       flag: "🇩🇪", weight: 0.021 },
  { name: "Japan",         flag: "🇯🇵", weight: 0.019 },
  { name: "France",        flag: "🇫🇷", weight: 0.016 },
];

function genCountriesSeeded(id: string, total: number) {
  return COUNTRIES.map(c => ({
    name: c.name, flag: c.flag,
    pct: +(c.weight * 100).toFixed(1),
    streams: Math.round(total * c.weight),
  }));
}

const CITIES_BASE = [
  { name: "Jakarta",       country: "Indonesia",   weight: 0.104 },
  { name: "Surabaya",      country: "Indonesia",   weight: 0.049 },
  { name: "Los Angeles",   country: "USA",         weight: 0.045 },
  { name: "São Paulo",     country: "Brazil",      weight: 0.036 },
  { name: "New York",      country: "USA",         weight: 0.034 },
  { name: "Bandung",       country: "Indonesia",   weight: 0.031 },
  { name: "Manila",        country: "Philippines", weight: 0.026 },
  { name: "Mumbai",        country: "India",       weight: 0.023 },
];

function genCitiesSeeded(id: string, total: number) {
  return CITIES_BASE.map(c => ({
    name: c.name, country: c.country,
    streams: Math.round(total * c.weight),
  }));
}

// ── Dummy data (used when no DB data) ─────────────────────────────────────────
const DUMMY_TRACKS: TrackData[] = [
  "Global Royalty", "Midnight Drive", "Echoes of You", "Broken Dreams",
  "Lost in Space", "Sunset Paradise", "Dream Walker", "Never Give Up",
  "Fire Inside", "Ocean Lights",
].map((title, i) => {
  const id = `dummy-${i}`;
  const baseStreams = Math.round(856_421 * Math.pow(0.65, i));
  const spotify   = Math.round(baseStreams * 0.62);
  const apple     = Math.round(baseStreams * 0.067);
  const youtube   = Math.round(baseStreams * 0.059);
  const tiktok    = Math.round(baseStreams * 0.067);
  const amazon    = Math.round(baseStreams * 0.058);
  const instagram = Math.round(baseStreams * 0.035);
  const facebook  = Math.round(baseStreams * 0.025);
  const boomplay  = Math.round(baseStreams * 0.018);
  const deezer    = Math.round(baseStreams * 0.012);
  const tidal     = Math.round(baseStreams * 0.008);
  const joox      = Math.round(baseStreams * 0.006);
  const audiomack = Math.round(baseStreams * 0.005);
  const pandora   = Math.round(baseStreams * 0.004);
  const kkbox     = Math.round(baseStreams * 0.003);
  const napster   = Math.round(baseStreams * 0.002);
  const tencent   = Math.round(baseStreams * 0.001);
  const lainnya   = baseStreams - spotify - apple - youtube - tiktok - amazon - instagram - facebook - boomplay - deezer - tidal - joox - audiomack - pandora - kkbox - napster - tencent;
  const albums = ["City Lights EP", "Summer Vibes", "Cosmic Journey", "Reminiscence", "Acoustic Sessions"];
  const dates  = ["15 Apr 2024", "22 Jun 2024", "10 Mar 2024", "05 May 2024", "20 Jan 2024", "08 Jul 2024", "12 Feb 2024", "30 Mar 2024", "18 Jun 2024", "02 Aug 2024"];
  return {
    id, rank: i + 1, title, artist: "Breakout Artist",
    isrc: `IDZ01234567${i}`,
    album: albums[i % albums.length],
    releaseDate: dates[i],
    cover: null, isNew: i < 2, isTrending: i < 3,
    totalStreams: baseStreams, revenue: Math.round(baseStreams * 0.05),
    listeners: Math.round((spotify + apple) * 0.7),
    saves: Math.round(spotify * 0.05),
    platforms: { spotify, apple, youtube, tiktok, amazon, instagram, facebook, boomplay, deezer, tidal, joox, audiomack, pandora, kkbox, napster, tencent, lainnya },
    dailyStreams: genDailySeeded(id, 30, Math.round(baseStreams / 30), 0.4),
    countries: genCountriesSeeded(id, baseStreams),
    cities: genCitiesSeeded(id, baseStreams),
  };
});
