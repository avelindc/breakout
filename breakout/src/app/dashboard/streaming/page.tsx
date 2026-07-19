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
    include: { artists: true },
  });

  const artistIds = user?.artists.map((a) => a.id) || [];

  // ── Real data from DB ────────────────────────────────────────────────────────
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

  const realSpotify    = royaltyAgg?._sum.spotifyStreams    || 0;
  const realApple      = royaltyAgg?._sum.appleMusicStreams || 0;
  const realYoutube    = royaltyAgg?._sum.youtubeStreams    || 0;
  const realTiktok     = royaltyAgg?._sum.tiktokStreams     || 0;
  const realAmazon     = royaltyAgg?._sum.amazonStreams     || 0;
  const realOther      = royaltyAgg?._sum.otherStreams      || 0;
  const realRevenue    = royaltyAgg?._sum.totalRevenue      || 0;
  const realTotal      = realSpotify + realApple + realYoutube + realTiktok + realAmazon + realOther;

  const approvedReleases = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "APPROVED" } })
    : 0;

  // Top tracks from royalties
  const topRoyalties = artistIds.length > 0
    ? await prisma.royalty.groupBy({
        by: ["songName"],
        _sum: { spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true, tiktokStreams: true, amazonStreams: true, otherStreams: true, totalRevenue: true },
        where: { artistId: { in: artistIds } },
        orderBy: { _sum: { spotifyStreams: "desc" } },
        take: 10,
      })
    : [];

  // Use real if available, else dummy
  const hasRealData = realTotal > 0;

  // Dummy data for rich UI when no real data
  const DUMMY = {
    totalStreams:    856_421,
    monthlyListeners: 128_742,
    followers:        24_850,
    saves:            18_623,
    revenue:       56_800_000,
    watchTimeHours:   1_245,
    totalPlaylists:       89,
    activeReleases:       12,
  };

  const statsData = hasRealData
    ? {
        totalStreams:    realTotal,
        monthlyListeners: Math.round(realTotal * 0.15),
        followers:        Math.round(realTotal * 0.029),
        saves:            Math.round(realTotal * 0.022),
        revenue:          realRevenue,
        watchTimeHours:   Math.round(realTotal * 0.00145),
        totalPlaylists:   Math.max(1, approvedReleases * 3),
        activeReleases:   approvedReleases,
      }
    : DUMMY;

  // Monthly streams chart (dummy 30 points for sparkline, last 30 days)
  const dailyStreams = generateDailyData(30, hasRealData ? Math.round(realTotal / 30) : 11_421, 0.35);

  // Platform data
  const platTotal = hasRealData ? realTotal : 856_421;
  const platformData = hasRealData
    ? [
        { name: "Spotify",       streams: realSpotify,    color: "#1DB954", icon: "🎵" },
        { name: "Apple Music",   streams: realApple,      color: "#FC3C44", icon: "🎵" },
        { name: "YouTube Music", streams: realYoutube,    color: "#FF0000", icon: "▶" },
        { name: "TikTok",        streams: realTiktok,     color: "#000000", icon: "🎵" },
        { name: "Amazon Music",  streams: realAmazon,     color: "#00A8E1", icon: "🎵" },
        { name: "Lainnya",       streams: realOther,      color: "#94A3B8", icon: "🎵" },
      ].filter(p => p.streams > 0)
    : [
        { name: "Spotify",       streams: 533_000, color: "#1DB954", icon: "🟢" },
        { name: "Apple Music",   streams: 119_897, color: "#FC3C44", icon: "🔴" },
        { name: "YouTube Music", streams:  94_206, color: "#FF0000", icon: "▶" },
        { name: "TikTok",        streams:  59_948, color: "#69C9D0", icon: "🎵" },
        { name: "Instagram",     streams:  21_641, color: "#E1306C", icon: "📸" },
        { name: "Facebook",      streams:  12_963, color: "#1877F2", icon: "👥" },
        { name: "Boomplay",      streams:   8_642, color: "#E86200", icon: "🎵" },
        { name: "Amazon Music",  streams:   6_000, color: "#00A8E1", icon: "🎵" },
        { name: "Deezer",        streams:   4_200, color: "#A238FF", icon: "🎵" },
        { name: "Tidal",         streams:   2_800, color: "#000000", icon: "🎵" },
        { name: "Joox",          streams:   2_100, color: "#1A8739", icon: "🎵" },
        { name: "Audiomack",     streams:   1_800, color: "#FFA500", icon: "🎵" },
        { name: "Pandora",       streams:   1_200, color: "#3668FF", icon: "🎵" },
        { name: "KKBOX",         streams:     900, color: "#009966", icon: "🎵" },
        { name: "Napster",       streams:     700, color: "#00A0C6", icon: "🎵" },
        { name: "Tencent",       streams:     500, color: "#0052D9", icon: "🎵" },
        { name: "Lainnya",       streams:   6_100, color: "#94A3B8", icon: "🎵" },
      ];

  // Top tracks
  const topTracks = topRoyalties.length > 0
    ? topRoyalties.map((r, i) => ({
        rank: i + 1,
        title:    r.songName,
        isrc:     `IDZ${String(i + 1).padStart(9, "0")}`,
        album:    r.songName,
        releaseDate: "2024",
        streams:  (r._sum.spotifyStreams || 0) + (r._sum.appleMusicStreams || 0) + (r._sum.youtubeStreams || 0) + (r._sum.tiktokStreams || 0) + (r._sum.amazonStreams || 0) + (r._sum.otherStreams || 0),
        revenue:  r._sum.totalRevenue || 0,
        listeners: Math.round(((r._sum.spotifyStreams || 0) + (r._sum.appleMusicStreams || 0)) * 0.7),
        saves:    Math.round((r._sum.spotifyStreams || 0) * 0.05),
        trend:    "up",
        cover:    null,
      }))
    : DUMMY_TRACKS;

  const data = {
    stats:        statsData,
    dailyStreams,
    platformData,
    platTotal,
    topTracks,
    hasRealData,
  };

  return <StreamingClient data={data} userName={session.user.name || "Artist"} />;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function generateDailyData(days: number, avg: number, variance: number) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = `${d.getDate()}/${d.getMonth() + 1}`;
    const streams = Math.max(0, Math.round(avg * (1 + (Math.random() - 0.5) * variance)));
    result.push({ date: label, streams });
  }
  return result;
}

const DUMMY_TRACKS = [
  { rank: 1, title: "Midnight Drive",   isrc: "IDZ012345678", album: "City Lights EP",    releaseDate: "15 Apr 2024", streams: 142_321, revenue: 7_116_050, listeners: 89_500,  saves: 7_116,  trend: "up",   cover: null },
  { rank: 2, title: "Sunset Paradise",  isrc: "IDZ012345679", album: "Summer Vibes",      releaseDate: "22 Jun 2024", streams:  67_892, revenue: 3_394_600, listeners: 51_200,  saves: 3_394,  trend: "up",   cover: null },
  { rank: 3, title: "Broken Dreams",    isrc: "IDZ012345680", album: "City Lights EP",    releaseDate: "15 Apr 2024", streams:  45_871, revenue: 2_293_550, listeners: 38_700,  saves: 2_293,  trend: "down", cover: null },
  { rank: 4, title: "Lost in Space",    isrc: "IDZ012345681", album: "Cosmic Journey",    releaseDate: "10 Mar 2024", streams:  32_145, revenue: 1_607_250, listeners: 26_400,  saves: 1_607,  trend: "up",   cover: null },
  { rank: 5, title: "Echoes of You",    isrc: "IDZ012345682", album: "Reminiscence",      releaseDate: "05 May 2024", streams:  27_100, revenue: 1_355_000, listeners: 21_800,  saves: 1_355,  trend: "up",   cover: null },
  { rank: 6, title: "Neon Lights",      isrc: "IDZ012345683", album: "City Lights EP",    releaseDate: "15 Apr 2024", streams:  21_540, revenue: 1_077_000, listeners: 17_600,  saves: 1_077,  trend: "down", cover: null },
  { rank: 7, title: "Rainy Day Blues",  isrc: "IDZ012345684", album: "Acoustic Sessions", releaseDate: "20 Jan 2024", streams:  18_920, revenue:   946_000, listeners: 14_300,  saves:   946,  trend: "up",   cover: null },
  { rank: 8, title: "Golden Hour",      isrc: "IDZ012345685", album: "Summer Vibes",      releaseDate: "22 Jun 2024", streams:  15_700, revenue:   785_000, listeners: 12_100,  saves:   785,  trend: "up",   cover: null },
  { rank: 9, title: "Stars Align",      isrc: "IDZ012345686", album: "Cosmic Journey",    releaseDate: "10 Mar 2024", streams:  12_430, revenue:   621_500, listeners:  9_800,  saves:   621,  trend: "down", cover: null },
  { rank: 10, title: "Ocean Breeze",    isrc: "IDZ012345687", album: "Reminiscence",      releaseDate: "05 May 2024", streams:   9_870, revenue:   493_500, listeners:  7_900,  saves:   493,  trend: "up",   cover: null },
];
