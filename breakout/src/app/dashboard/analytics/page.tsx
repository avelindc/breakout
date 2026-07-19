import { auth } from "@/auth";
import { PrismaClient } from "@prisma/client";
import { redirect } from "next/navigation";
import { AnalyticsClient } from "./AnalyticsClient";

const prisma = new PrismaClient();

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { artists: true },
  });

  const artistIds = user?.artists.map((a) => a.id) || [];

  // ── Totals ──────────────────────────────────────────────────────────────────
  const royalties = artistIds.length > 0
    ? await prisma.royalty.findMany({ where: { artistId: { in: artistIds } } })
    : [];

  let totalRevenue = 0;
  let totalStreams = 0;
  const platformMap: Record<string, number> = {};

  royalties.forEach(r => {
    totalRevenue += r.totalRevenue;
    let rowStreams = 0;

    if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
      const pd = r.platformData as Record<string, number>;
      for (const [p, s] of Object.entries(pd)) {
        // Format common platforms for better display
        let platName = p;
        if (p.toLowerCase() === 'spotify') platName = 'Spotify';
        if (p.toLowerCase() === 'apple music' || p.toLowerCase() === 'apple') platName = 'Apple Music';
        if (p.toLowerCase() === 'youtube') platName = 'YouTube Music';
        if (p.toLowerCase() === 'tiktok') platName = 'TikTok';
        if (p.toLowerCase() === 'amazon' || p.toLowerCase() === 'amazon music') platName = 'Amazon Music';
        
        platformMap[platName] = (platformMap[platName] || 0) + s;
        rowStreams += s;
      }
    } else {
      platformMap["Spotify"] = (platformMap["Spotify"] || 0) + r.spotifyStreams;
      platformMap["Apple Music"] = (platformMap["Apple Music"] || 0) + r.appleMusicStreams;
      platformMap["YouTube Music"] = (platformMap["YouTube Music"] || 0) + r.youtubeStreams;
      platformMap["TikTok"] = (platformMap["TikTok"] || 0) + r.tiktokStreams;
      platformMap["Amazon Music"] = (platformMap["Amazon Music"] || 0) + r.amazonStreams;
      platformMap["Lainnya"] = (platformMap["Lainnya"] || 0) + r.otherStreams;
      rowStreams = r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
    }
    
    totalStreams += rowStreams;
  });

  const platformBreakdown = Object.entries(platformMap)
    .map(([name, streams]) => ({ name, streams }))
    .filter(p => p.streams > 0)
    .sort((a, b) => b.streams - a.streams);

  // ── Withdraw for available balance ──────────────────────────────────────────
  const withdrawRequests = await prisma.withdrawRequest.findMany({
    where: { userId: session.user.id },
  });
  const totalWithdrawn  = withdrawRequests.filter(r => r.status === "PAID").reduce((a, r) => a + r.amount, 0);
  const pendingWD       = withdrawRequests.filter(r => r.status === "PENDING").reduce((a, r) => a + r.amount, 0);
  const availableBalance = totalRevenue - totalWithdrawn - pendingWD;

  // ── Saves Added = total releases approved ──────────────────────────────────
  const savesAdded = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "APPROVED" } })
    : 0;

  // ── Monthly streams (last 6 months from Royalty table) ─────────────────────
  const now = new Date();
  const monthlyStreams: { month: string; streams: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleString("en-US", { month: "short" }) + " " + y;

    let monthTotal = 0;
    const monthRoyalties = royalties.filter(r => r.month === m && r.year === y);
    monthRoyalties.forEach(r => {
      if (r.platformData && typeof r.platformData === 'object' && Object.keys(r.platformData).length > 0) {
        const pd = r.platformData as Record<string, number>;
        monthTotal += Object.values(pd).reduce((a, b) => a + b, 0);
      } else {
        monthTotal += r.spotifyStreams + r.appleMusicStreams + r.youtubeStreams + r.tiktokStreams + r.amazonStreams + r.otherStreams;
      }
    });

    monthlyStreams.push({ month: label, streams: monthTotal });
  }

  // ── Monthly revenue (last 6 months) ────────────────────────────────────────
  const monthlyRevenue: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth() + 1;
    const y = d.getFullYear();
    const label = d.toLocaleString("en-US", { month: "short" });

    const agg = artistIds.length > 0
      ? await prisma.royalty.aggregate({
          _sum: { totalRevenue: true },
          where: { artistId: { in: artistIds }, month: m, year: y },
        })
      : null;

    monthlyRevenue.push({ month: label, revenue: agg?._sum.totalRevenue || 0 });
  }

  // ── Top Tracks (from Release + Royalty joined by songName) ─────────────────
  const royaltiesByTrack = artistIds.length > 0
    ? await prisma.royalty.groupBy({
        by: ["songName"],
        _sum: {
          spotifyStreams: true, appleMusicStreams: true, youtubeStreams: true,
          tiktokStreams: true, amazonStreams: true, otherStreams: true,
        },
        where: { artistId: { in: artistIds } },
        orderBy: { _sum: { spotifyStreams: "desc" } },
        take: 5,
      })
    : [];

  const topTracks = royaltiesByTrack.map((r, i) => ({
    rank: i + 1,
    title: r.songName,
    streams:
      (r._sum.spotifyStreams    || 0) +
      (r._sum.appleMusicStreams || 0) +
      (r._sum.youtubeStreams    || 0) +
      (r._sum.tiktokStreams     || 0) +
      (r._sum.amazonStreams     || 0) +
      (r._sum.otherStreams      || 0),
  }));

  // If no royalty data, fall back to release list
  const topTracksFromReleases = topTracks.length === 0 && artistIds.length > 0
    ? (await prisma.release.findMany({
        where: { artistId: { in: artistIds } },
        take: 5,
        orderBy: { createdAt: "desc" },
      })).map((r, i) => ({ rank: i + 1, title: r.title, streams: 0 }))
    : topTracks;

  // ── Audience Locations from Streaming table ─────────────────────────────────
  const trackIds = artistIds.length > 0
    ? (await prisma.track.findMany({
        where: { release: { artistId: { in: artistIds } } },
        select: { id: true },
      })).map(t => t.id)
    : [];

  let audienceLocations: { country: string; pct: number; flag: string }[] = [];

  if (trackIds.length > 0) {
    const streamingByCountry = await prisma.streaming.groupBy({
      by: ["country"],
      _sum: { playCount: true },
      where: { trackId: { in: trackIds }, country: { not: null } },
      orderBy: { _sum: { playCount: "desc" } },
      take: 5,
    });

    const totalPlays = streamingByCountry.reduce((a, r) => a + (r._sum.playCount || 0), 0) || 1;
    const flagMap: Record<string, string> = {
      ID: "🇮🇩", MY: "🇲🇾", SG: "🇸🇬", US: "🇺🇸", TH: "🇹🇭",
      GB: "🇬🇧", AU: "🇦🇺", JP: "🇯🇵", PH: "🇵🇭", IN: "🇮🇳",
    };
    audienceLocations = streamingByCountry.map(r => ({
      country: r.country || "Unknown",
      pct: Math.round(((r._sum.playCount || 0) / totalPlays) * 1000) / 10,
      flag: flagMap[r.country || ""] || "🌏",
    }));
  }

  // ── Playlist Adds / Saves / Shares (from withdraw count as proxy) ───────────
  const approvedReleases   = savesAdded;
  const pendingReleases    = artistIds.length > 0
    ? await prisma.release.count({ where: { artistId: { in: artistIds }, status: "PENDING" } })
    : 0;

  // ── Avg streams per listener ─────────────────────────────────────────────────
  const avgStreamsPerListener = approvedReleases > 0 ? Math.round(totalStreams / approvedReleases) : 0;

  const analyticsData = {
    totalStreams,
    totalRevenue,
    availableBalance,
    savesAdded,
    approvedReleases,
    pendingReleases,
    platformBreakdown,
    monthlyStreams,
    monthlyRevenue,
    topTracks: topTracksFromReleases,
    audienceLocations,
    avgStreamsPerListener,
    playlistAdds: approvedReleases,
    shares: Math.round(totalStreams * 0.015), // estimated 1.5% share rate
  };

  return <AnalyticsClient data={analyticsData} user={session.user} />;
}
