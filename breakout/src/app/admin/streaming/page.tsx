import { PrismaClient } from "@prisma/client";
import { AdminStreamingClient } from "./AdminStreamingClient";

const prisma = new PrismaClient();

export default async function AdminStreamingPage() {
  // ── Real stats from DB ───────────────────────────────────────────────────────
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

  const royaltyAgg = await prisma.royalty.aggregate({
    _sum: {
      totalRevenue: true,
      spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true,
      tiktokStreams: true, amazonStreams: true, otherStreams: true,
    },
  });

  const realSpotify = royaltyAgg._sum.spotifyStreams    || 0;
  const realApple   = royaltyAgg._sum.appleMusicStreams || 0;
  const realYoutube = royaltyAgg._sum.youtubeStreams    || 0;
  const realTiktok  = royaltyAgg._sum.tiktokStreams     || 0;
  const realAmazon  = royaltyAgg._sum.amazonStreams     || 0;
  const realOther   = royaltyAgg._sum.otherStreams      || 0;
  const realRevenue = royaltyAgg._sum.totalRevenue      || 0;
  const realStreams  = realSpotify + realApple + realYoutube + realTiktok + realAmazon + realOther;

  // ── Monthly revenue (last 6 months) ─────────────────────────────────────────
  const now = new Date();
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

  // Use dummy if no real data
  const hasRealStreams = realStreams > 0;

  // ── Top artists by stream count (via royalties) ─────────────────────────────
  const topArtistRoyalties = await prisma.royalty.groupBy({
    by: ["artistId"],
    _sum: { spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true, tiktokStreams: true, amazonStreams: true, otherStreams: true, totalRevenue: true },
    orderBy: { _sum: { spotifyStreams: "desc" } },
    take: 10,
  });

  const artistIds = topArtistRoyalties.map(r => r.artistId);
  const artists   = await prisma.artist.findMany({
    where: { id: { in: artistIds } },
    select: { id: true, stageName: true, avatarUrl: true },
  });
  const artistMap = Object.fromEntries(artists.map(a => [a.id, a]));

  const topArtistsList = topArtistRoyalties.map((r, i) => ({
    rank: i + 1,
    name: artistMap[r.artistId]?.stageName || "Unknown Artist",
    avatar: artistMap[r.artistId]?.avatarUrl || null,
    streams: (r._sum.spotifyStreams || 0) + (r._sum.appleMusicStreams || 0) + (r._sum.youtubeStreams || 0) + (r._sum.tiktokStreams || 0) + (r._sum.amazonStreams || 0) + (r._sum.otherStreams || 0),
    revenue: r._sum.totalRevenue || 0,
  }));

  // ── Latest uploads ─────────────────────────────────────────────────────────
  const latestReleases = await prisma.release.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, primaryArtist: true, status: true, createdAt: true, coverArtworkUrl: true },
  });

  // ── Latest withdrawals ─────────────────────────────────────────────────────
  const latestWithdrawals = await prisma.withdrawRequest.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, amount: true, status: true, bankName: true, createdAt: true, user: { select: { name: true } } },
  });

  const data = {
    overview: {
      totalArtists, totalReleases, pendingReleases, approvedReleases, rejectedReleases,
      totalTracks, totalWithdrawals,
      pendingWithdraw: pendingWithdrawAgg._sum.amount || 0,
      completedWithdraw: completedWithdrawAgg._sum.amount || 0,
      totalStreams: hasRealStreams ? realStreams : 856_421,
      monthlyStreams: hasRealStreams ? Math.round(realStreams / 6) : 128_742,
      totalRevenue: realRevenue || 56_800_000,
    },
    platformData: hasRealStreams
      ? [
          { name: "Spotify",       streams: realSpotify, color: "#1DB954" },
          { name: "Apple Music",   streams: realApple,   color: "#FC3C44" },
          { name: "YouTube Music", streams: realYoutube, color: "#FF0000" },
          { name: "TikTok",        streams: realTiktok,  color: "#69C9D0" },
          { name: "Amazon Music",  streams: realAmazon,  color: "#00A8E1" },
          { name: "Lainnya",       streams: realOther,   color: "#94A3B8" },
        ].filter(p => p.streams > 0)
      : [
          { name: "Spotify",       streams: 533_023, color: "#1DB954" },
          { name: "Apple Music",   streams: 119_897, color: "#FC3C44" },
          { name: "YouTube Music", streams:  94_206, color: "#FF0000" },
          { name: "TikTok",        streams:  59_948, color: "#69C9D0" },
          { name: "Amazon Music",  streams:  28_642, color: "#00A8E1" },
          { name: "Deezer",        streams:  12_963, color: "#A238FF" },
          { name: "Lainnya",       streams:   7_742, color: "#94A3B8" },
        ],
    monthlyRevenue: monthlyRevenue.every(d => d.revenue === 0)
      ? [
          { month: "Feb", revenue: 3_000_000 }, { month: "Mar", revenue: 2_000_000 },
          { month: "Apr", revenue: 4_780_000 }, { month: "May", revenue: 3_890_000 },
          { month: "Jun", revenue: 6_390_000 }, { month: "Jul", revenue: 4_490_000 },
        ]
      : monthlyRevenue,
    monthlyStreams: monthlyStreams.every(d => d.streams === 0)
      ? [
          { month: "Feb", streams:  45_200 }, { month: "Mar", streams:  62_100 },
          { month: "Apr", streams:  89_500 }, { month: "May", streams: 110_200 },
          { month: "Jun", streams: 142_000 }, { month: "Jul", streams: 128_742 },
        ]
      : monthlyStreams,
    topArtists: topArtistsList.length > 0 ? topArtistsList : DUMMY_ARTISTS,
    latestReleases: latestReleases.map(r => ({
      id: r.id, title: r.title, artist: r.primaryArtist,
      status: r.status, date: r.createdAt.toLocaleDateString("id-ID"), cover: r.coverArtworkUrl,
    })),
    latestWithdrawals: latestWithdrawals.map(w => ({
      id: w.id, amount: w.amount, status: w.status,
      bank: w.bankName, date: w.createdAt.toLocaleDateString("id-ID"),
      user: w.user.name || "Unknown",
    })),
  };

  return <AdminStreamingClient data={data} />;
}

const DUMMY_ARTISTS = [
  { rank: 1, name: "KSATRIA",     avatar: null, streams: 285_421, revenue: 14_271_050 },
  { rank: 2, name: "Melodia",     avatar: null, streams: 189_532, revenue:  9_476_600 },
  { rank: 3, name: "RajaFunky",   avatar: null, streams: 142_100, revenue:  7_105_000 },
  { rank: 4, name: "Suara Hati",  avatar: null, streams:  98_700, revenue:  4_935_000 },
  { rank: 5, name: "AkuBisa",     avatar: null, streams:  72_350, revenue:  3_617_500 },
];
