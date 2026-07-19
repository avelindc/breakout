import { PrismaClient } from "@prisma/client";
import { AdminStreamingClient } from "./AdminStreamingClient";

const prisma = new PrismaClient();

export default async function AdminStreamingPage() {
  // 1. ── Basic Admin KPIs ──────────────────────────────────────────────────────
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

  // 2. ── Fetch All Artists with their Releases, Tracks, and Royalties ────────
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

  // 3. ── Build Global Stats ───────────────────────────────────────────────────
  let realSpotify = 0, realApple = 0, realYoutube = 0, realTiktok = 0, realAmazon = 0, realOther = 0, realRevenue = 0;
  
  const allRoyalties = dbArtists.flatMap(a => a.royalties);
  allRoyalties.forEach(r => {
    realSpotify += r.spotifyStreams;
    realApple   += r.appleMusicStreams;
    realYoutube += r.youtubeStreams;
    realTiktok  += r.tiktokStreams;
    realAmazon  += r.amazonStreams;
    realOther   += r.otherStreams;
    realRevenue += r.totalRevenue;
  });

  const realTotalStreams = realSpotify + realApple + realYoutube + realTiktok + realAmazon + realOther;
  const hasRealStreams   = realTotalStreams > 0;

  const activeArtistsCount   = dbArtists.filter(a => a.user.status === "APPROVED").length;
  const verifiedArtistsCount = dbArtists.length; // placeholder
  const premiumArtistsCount  = Math.max(1, Math.round(dbArtists.length * 0.2));

  const overview = {
    totalArtists, activeArtistsCount, verifiedArtistsCount, premiumArtistsCount,
    totalReleases, pendingReleases, approvedReleases, rejectedReleases,
    totalTracks, totalWithdrawals,
    pendingWithdraw: pendingWithdrawAgg._sum.amount || 0,
    completedWithdraw: completedWithdrawAgg._sum.amount || 0,
    totalStreams: hasRealStreams ? realTotalStreams : 18_456_421,
    monthlyStreams: hasRealStreams ? Math.round(realTotalStreams / 6) : 3_128_742,
    totalRevenue: hasRealStreams ? realRevenue : 456_800_000,
  };

  // 4. ── Build Artist and Track Data ──────────────────────────────────────────
  const now = new Date();
  const allTracks: TrackData[] = [];
  const artists: ArtistData[] = [];

  for (const artist of dbArtists) {
    const artistRoyalties = artist.royalties;
    const royaltyBySong: Record<string, { spotify: number; apple: number; youtube: number; tiktok: number; amazon: number; other: number; revenue: number }> = {};
    
    let aSpotify = 0, aApple = 0, aYoutube = 0, aTiktok = 0, aAmazon = 0, aOther = 0, aRevenue = 0;

    artistRoyalties.forEach(r => {
      aSpotify += r.spotifyStreams; aApple += r.appleMusicStreams; aYoutube += r.youtubeStreams;
      aTiktok += r.tiktokStreams; aAmazon += r.amazonStreams; aOther += r.otherStreams; aRevenue += r.totalRevenue;
      
      const key = r.songName.trim().toLowerCase();
      if (!royaltyBySong[key]) royaltyBySong[key] = { spotify: 0, apple: 0, youtube: 0, tiktok: 0, amazon: 0, other: 0, revenue: 0 };
      royaltyBySong[key].spotify += r.spotifyStreams;
      royaltyBySong[key].apple   += r.appleMusicStreams;
      royaltyBySong[key].youtube += r.youtubeStreams;
      royaltyBySong[key].tiktok  += r.tiktokStreams;
      royaltyBySong[key].amazon  += r.amazonStreams;
      royaltyBySong[key].other   += r.otherStreams;
      royaltyBySong[key].revenue += r.totalRevenue;
    });

    const aTotalStreams = aSpotify + aApple + aYoutube + aTiktok + aAmazon + aOther;
    
    const artistData: ArtistData = {
      id: artist.id,
      rank: 0,
      name: artist.stageName,
      avatar: artist.avatarUrl,
      trackCount: 0,
      totalStreams: aTotalStreams,
      revenue: aRevenue,
      listeners: Math.round((aSpotify + aApple) * 0.7),
      followers: Math.round(aTotalStreams * 0.029),
      playlists: Math.max(1, artist.releases.length * 3),
      hasRealData: aTotalStreams > 0,
      platforms: build17PlatformsSeeded(artist.id, aTotalStreams, { spotify: aSpotify, apple: aApple, youtube: aYoutube, tiktok: aTiktok, amazon: aAmazon, other: aOther }),
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

        const spotify = roy?.spotify ?? 0;
        const apple   = roy?.apple ?? 0;
        const youtube = roy?.youtube ?? 0;
        const tiktok  = roy?.tiktok ?? 0;
        const amazon  = roy?.amazon ?? 0;
        const other   = roy?.other ?? 0;
        const revenue = roy?.revenue ?? 0;
        const total   = spotify + apple + youtube + tiktok + amazon + other;

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
          platforms: build17PlatformsSeeded(id, total, { spotify, apple, youtube, tiktok, amazon, other }),
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

  // Sort and assign ranks
  artists.sort((a, b) => b.totalStreams - a.totalStreams);
  artists.forEach((a, i) => a.rank = i + 1);

  allTracks.sort((a, b) => b.totalStreams - a.totalStreams);
  allTracks.forEach((t, i) => {
    t.isTrending = i < 10 && t.totalStreams > 0;
  });

  // Use dummy if no data at all
  const finalArtists = artists.length > 0 ? artists : DUMMY_ARTISTS;
  const finalTracks  = allTracks.length > 0 ? allTracks : DUMMY_TRACKS;

  // 5. ── Build Global 17 Platforms ─────────────────────────────────────────────
  const globalPlatforms17 = build17PlatformsSeeded("global", hasRealStreams ? realTotalStreams : overview.totalStreams, {
    spotify: realSpotify, apple: realApple, youtube: realYoutube, tiktok: realTiktok, amazon: realAmazon, other: realOther
  });

  // 6. ── Monthly Revenue / Streams ─────────────────────────────────────────────
  const monthlyRevenue = [];
  const monthlyStreams  = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleString("id-ID", { month: "short" });
    const agg = await prisma.royalty.aggregate({
      _sum: { totalRevenue: true, spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true, tiktokStreams: true, amazonStreams: true, otherStreams: true },
      where: { month: m, year: y },
    });
    const rev = agg._sum.totalRevenue || 0;
    const str = (agg._sum.spotifyStreams || 0) + (agg._sum.appleMusicStreams || 0) + (agg._sum.youtubeStreams || 0) + (agg._sum.tiktokStreams || 0) + (agg._sum.amazonStreams || 0) + (agg._sum.otherStreams || 0);
    monthlyRevenue.push({ month: label, revenue: rev });
    monthlyStreams.push({ month: label, streams: str });
  }

  const globalDailyStreams = buildDailyFromTotal("global", overview.totalStreams, 30);

  const data = {
    overview,
    globalPlatforms: globalPlatforms17,
    monthlyRevenue: monthlyRevenue.every(d => d.revenue === 0)
      ? [
          { month: "Feb", revenue: 30_000_000 }, { month: "Mar", revenue: 20_000_000 },
          { month: "Apr", revenue: 47_800_000 }, { month: "May", revenue: 38_900_000 },
          { month: "Jun", revenue: 63_900_000 }, { month: "Jul", revenue: 44_900_000 },
        ]
      : monthlyRevenue,
    monthlyStreams: monthlyStreams.every(d => d.streams === 0)
      ? [
          { month: "Feb", streams:  450_200 }, { month: "Mar", streams:  620_100 },
          { month: "Apr", streams:  890_500 }, { month: "May", streams: 1_100_200 },
          { month: "Jun", streams: 1_420_000 }, { month: "Jul", streams: 1_287_420 },
        ]
      : monthlyStreams,
    globalDailyStreams,
    artists: finalArtists,
    allTracks: finalTracks,
  };

  return <AdminStreamingClient data={data} />;
}

// ── Types ────────────────────────────────────────────────────────────────────
export type PlatformStreams17 = {
  spotify: number; apple: number; youtube: number; tiktok: number;
  instagram: number; facebook: number; amazon: number; boomplay: number;
  joox: number; deezer: number; tidal: number; pandora: number;
  audiomack: number; napster: number; kkbox: number; tencent: number; lainnya: number;
};

export type ArtistData = {
  id: string; rank: number; name: string; avatar: string | null;
  trackCount: number; totalStreams: number; revenue: number;
  listeners: number; followers: number; playlists: number;
  hasRealData: boolean;
  platforms: PlatformStreams17;
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
  platforms: PlatformStreams17;
  dailyStreams: { date: string; streams: number }[];
  countries: { name: string; flag: string; pct: number; streams: number }[];
  cities: { name: string; country: string; streams: number }[];
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function seedNum(id: string, slot: number, max: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const ratio = ((h + slot * 1_000_003) % 1_000_000) / 1_000_000;
  return Math.max(0, Math.round(ratio * max));
}

// Distributes the DB 'other' value + fake values into the 17 platforms user requested
function build17PlatformsSeeded(id: string, total: number, db: { spotify: number; apple: number; youtube: number; tiktok: number; amazon: number; other: number }): PlatformStreams17 {
  if (total === 0) {
    return { spotify: 0, apple: 0, youtube: 0, tiktok: 0, instagram: 0, facebook: 0, amazon: 0, boomplay: 0, joox: 0, deezer: 0, tidal: 0, pandora: 0, audiomack: 0, napster: 0, kkbox: 0, tencent: 0, lainnya: 0 };
  }
  
  // If we don't have DB data, use full seeded percentages
  if (db.spotify === 0 && db.apple === 0) {
    const s = Math.round(total * 0.42);
    const a = Math.round(total * 0.15);
    const y = Math.round(total * 0.12);
    const t = Math.round(total * 0.10);
    const am = Math.round(total * 0.05);
    return {
      spotify: s, apple: a, youtube: y, tiktok: t, amazon: am,
      instagram: seedNum(id, 1, total * 0.04),
      facebook: seedNum(id, 2, total * 0.03),
      boomplay: seedNum(id, 3, total * 0.02),
      joox: seedNum(id, 4, total * 0.015),
      deezer: seedNum(id, 5, total * 0.015),
      tidal: seedNum(id, 6, total * 0.01),
      pandora: seedNum(id, 7, total * 0.01),
      audiomack: seedNum(id, 8, total * 0.008),
      napster: seedNum(id, 9, total * 0.005),
      kkbox: seedNum(id, 10, total * 0.004),
      tencent: seedNum(id, 11, total * 0.003),
      lainnya: seedNum(id, 12, total * 0.01),
    };
  }

  // We have DB data! Distribute the DB 'other' logically among the extra platforms, or use 'lainnya'
  const pool = db.other;
  const extraShares = [
    { k: 'instagram', w: 0.25 }, { k: 'facebook', w: 0.20 }, { k: 'boomplay', w: 0.15 },
    { k: 'joox', w: 0.10 }, { k: 'deezer', w: 0.10 }, { k: 'tidal', w: 0.05 },
    { k: 'pandora', w: 0.04 }, { k: 'audiomack', w: 0.04 }, { k: 'napster', w: 0.03 },
    { k: 'kkbox', w: 0.02 }, { k: 'tencent', w: 0.01 }, { k: 'lainnya', w: 0.01 }
  ];
  
  const result: any = {
    spotify: db.spotify, apple: db.apple, youtube: db.youtube,
    tiktok: db.tiktok, amazon: db.amazon,
  };

  let used = 0;
  extraShares.forEach((s, i) => {
    if (i === extraShares.length - 1) {
      result[s.k] = pool - used;
    } else {
      const val = Math.round(pool * s.w);
      result[s.k] = val;
      used += val;
    }
  });

  return result as PlatformStreams17;
}

function buildDailyFromTotal(id: string, total: number, days: number) {
  if (total === 0) return Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - 1 - i));
    return { date: `${d.getDate()}/${d.getMonth() + 1}`, streams: 0 };
  });
  const avg = Math.round(total / days);
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const noise = Math.sin((seedNum(id, i, 100) / 100) * 10) * 0.3 + 1;
    result.push({ date: `${d.getDate()}/${d.getMonth() + 1}`, streams: Math.max(0, Math.round(avg * noise)) });
  }
  return result;
}

const COUNTRY_WEIGHTS = [
  { name: "Indonesia",     flag: "🇮🇩", w: 0.248 }, { name: "United States", flag: "🇺🇸", w: 0.187 },
  { name: "Brazil",        flag: "🇧🇷", w: 0.094 }, { name: "India",         flag: "🇮🇳", w: 0.068 },
  { name: "United Kingdom",flag: "🇬🇧", w: 0.042 }, { name: "Philippines",   flag: "🇵🇭", w: 0.037 },
  { name: "Malaysia",      flag: "🇲🇾", w: 0.029 }, { name: "Thailand",      flag: "🇹🇭", w: 0.032 },
  { name: "Mexico",        flag: "🇲🇽", w: 0.040 }, { name: "Vietnam",       flag: "🇻🇳", w: 0.025 },
  { name: "Germany",       flag: "🇩🇪", w: 0.021 }, { name: "Japan",         flag: "🇯🇵", w: 0.019 },
  { name: "France",        flag: "🇫🇷", w: 0.016 },
];

function buildCountries(total: number) {
  return COUNTRY_WEIGHTS.map(c => ({
    name: c.name, flag: c.flag, pct: +(c.w * 100).toFixed(1), streams: Math.round(total * c.w),
  }));
}

const CITY_WEIGHTS = [
  { name: "Jakarta", country: "Indonesia", w: 0.104 }, { name: "Surabaya", country: "Indonesia", w: 0.049 },
  { name: "Los Angeles", country: "USA", w: 0.045 }, { name: "São Paulo", country: "Brazil", w: 0.036 },
  { name: "New York", country: "USA", w: 0.034 }, { name: "Bandung", country: "Indonesia", w: 0.031 },
  { name: "Manila", country: "Philippines", w: 0.026 }, { name: "Mumbai", country: "India", w: 0.023 },
];

function buildCities(total: number) {
  return CITY_WEIGHTS.map(c => ({
    name: c.name, country: c.country, streams: Math.round(total * c.w),
  }));
}

// ── Dummy Data ───────────────────────────────────────────────────────────────
const DUMMY_ARTISTS: ArtistData[] = [
  { id: "a1", rank: 1, name: "KSATRIA", avatar: null, trackCount: 12, totalStreams: 4_285_421, revenue: 214_271_050, listeners: 850_000, followers: 124_000, playlists: 45, hasRealData: false, platforms: build17PlatformsSeeded("a1", 4_285_421, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("a1", 4_285_421, 30), countries: buildCountries(4_285_421), cities: buildCities(4_285_421) },
  { id: "a2", rank: 2, name: "Melodia", avatar: null, trackCount: 8, totalStreams: 2_189_532, revenue: 109_476_600, listeners: 420_000, followers: 63_000, playlists: 24, hasRealData: false, platforms: build17PlatformsSeeded("a2", 2_189_532, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("a2", 2_189_532, 30), countries: buildCountries(2_189_532), cities: buildCities(2_189_532) },
  { id: "a3", rank: 3, name: "RajaFunky", avatar: null, trackCount: 5, totalStreams: 1_142_100, revenue: 57_105_000, listeners: 210_000, followers: 33_000, playlists: 15, hasRealData: false, platforms: build17PlatformsSeeded("a3", 1_142_100, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("a3", 1_142_100, 30), countries: buildCountries(1_142_100), cities: buildCities(1_142_100) },
];

const DUMMY_TRACKS: TrackData[] = [
  { id: "t1", artistId: "a1", title: "Global Royalty", artist: "KSATRIA", isrc: "IDZ000001", album: "Single", releaseDate: "01 Jan 2024", cover: null, isNew: false, isTrending: true, totalStreams: 2_142_321, revenue: 107_116_050, listeners: 420_000, saves: 31_000, hasRealData: false, platforms: build17PlatformsSeeded("t1", 2_142_321, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("t1", 2_142_321, 30), countries: buildCountries(2_142_321), cities: buildCities(2_142_321) },
  { id: "t2", artistId: "a1", title: "Midnight Drive", artist: "KSATRIA", isrc: "IDZ000002", album: "City Lights", releaseDate: "15 Apr 2024", cover: null, isNew: false, isTrending: true, totalStreams: 1_567_892, revenue: 78_394_600, listeners: 310_000, saves: 21_000, hasRealData: false, platforms: build17PlatformsSeeded("t2", 1_567_892, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("t2", 1_567_892, 30), countries: buildCountries(1_567_892), cities: buildCities(1_567_892) },
  { id: "t3", artistId: "a2", title: "Echoes of You", artist: "Melodia", isrc: "IDZ000003", album: "Reminiscence", releaseDate: "05 May 2024", cover: null, isNew: false, isTrending: true, totalStreams: 1_245_871, revenue: 62_293_550, listeners: 250_000, saves: 18_000, hasRealData: false, platforms: build17PlatformsSeeded("t3", 1_245_871, {spotify:0,apple:0,youtube:0,tiktok:0,amazon:0,other:0}), dailyStreams: buildDailyFromTotal("t3", 1_245_871, 30), countries: buildCountries(1_245_871), cities: buildCities(1_245_871) },
];
