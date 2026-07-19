"use client";

import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Music, DollarSign, BookOpen,
  Clock, ListMusic, Disc, Download, RefreshCw, Calendar, Filter,
  Eye, Heart, Share2, Play, ChevronRight, Globe, MapPin,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type StatCard = {
  label: string; value: string; subValue?: string;
  icon: React.ElementType; iconBg: string; iconColor: string;
  change: number; period: string;
};

type PlatformItem  = { name: string; streams: number; color: string; icon: string };
type DailyPoint    = { date: string; streams: number };
type TrackItem     = {
  rank: number; title: string; isrc: string; album: string;
  releaseDate: string; streams: number; revenue: number;
  listeners: number; saves: number; trend: string; cover: string | null;
};

type Props = {
  data: {
    stats: Record<string, number>;
    dailyStreams: DailyPoint[];
    platformData: PlatformItem[];
    platTotal: number;
    topTracks: TrackItem[];
    hasRealData: boolean;
  };
  userName: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("id-ID");
}
function fmtRp(n: number) {
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rp " + (n / 1_000).toFixed(0) + "K";
  return "Rp " + n.toLocaleString("id-ID");
}

// Realtime streaming counter using deterministic seed
function useRealtimeCounter(base: number) {
  const [extra, setExtra] = useState(0);
  // Simple client-side ticker
  useMemo(() => {
    if (typeof window !== "undefined") {
      const interval = setInterval(() => {
        setExtra(prev => prev + Math.floor(Math.random() * 4 + 1));
      }, 2800);
      return () => clearInterval(interval);
    }
  }, []);
  return base + extra;
}

const FILTER_OPTIONS = ["Hari", "7 Hari", "30 Hari", "90 Hari", "1 Tahun", "Custom"];

const TOP_COUNTRIES = [
  { name: "Indonesia",     flag: "🇮🇩", pct: 24.8, streams: 212_520 },
  { name: "United States", flag: "🇺🇸", pct: 18.7, streams: 160_150 },
  { name: "Brazil",        flag: "🇧🇷", pct:  9.4, streams:  80_503 },
  { name: "India",         flag: "🇮🇳", pct:  6.8, streams:  58_237 },
  { name: "United Kingdom",flag: "🇬🇧", pct:  4.2, streams:  35_970 },
  { name: "Mexico",        flag: "🇲🇽", pct:  4.0, streams:  34_257 },
  { name: "Philippines",   flag: "🇵🇭", pct:  3.7, streams:  31_688 },
  { name: "Thailand",      flag: "🇹🇭", pct:  3.2, streams:  27_405 },
  { name: "Malaysia",      flag: "🇲🇾", pct:  2.9, streams:  24_836 },
  { name: "Vietnam",       flag: "🇻🇳", pct:  2.5, streams:  21_411 },
  { name: "Germany",       flag: "🇩🇪", pct:  2.1, streams:  17_985 },
  { name: "Japan",         flag: "🇯🇵", pct:  1.9, streams:  16_272 },
  { name: "France",        flag: "🇫🇷", pct:  1.6, streams:  13_703 },
];

const TOP_CITIES = [
  { name: "Jakarta",      country: "Indonesia",  streams: 89_200 },
  { name: "Surabaya",     country: "Indonesia",  streams: 42_100 },
  { name: "Los Angeles",  country: "USA",        streams: 38_700 },
  { name: "São Paulo",    country: "Brazil",     streams: 31_200 },
  { name: "New York",     country: "USA",        streams: 28_900 },
  { name: "Bandung",      country: "Indonesia",  streams: 26_400 },
  { name: "Manila",       country: "Philippines",streams: 22_100 },
  { name: "Mumbai",       country: "India",      streams: 19_800 },
];

const TOP_PLAYLISTS = [
  { name: "Lagu Hits Indonesia 2024",   curator: "Spotify",     streams: 48_200 },
  { name: "Indie Music Indonesia",      curator: "Spotify",     streams: 32_100 },
  { name: "Morning Acoustic Vibes",     curator: "Apple Music", streams: 28_900 },
  { name: "Top Hits Asia",              curator: "YouTube",     streams: 21_400 },
  { name: "Discover Weekly",            curator: "Spotify",     streams: 19_700 },
  { name: "New Music Friday Indonesia", curator: "Spotify",     streams: 15_200 },
];

const TOP_SOURCES = [
  { name: "Playlist",     pct: 38.4, color: "#6C63FF" },
  { name: "Profile",      pct: 22.1, color: "#3B82F6" },
  { name: "Algorithmic",  pct: 18.7, color: "#8B5CF6" },
  { name: "Search",       pct: 11.2, color: "#06B6D4" },
  { name: "Radio",        pct:  5.8, color: "#10B981" },
  { name: "Other",        pct:  3.8, color: "#94A3B8" },
];

const RECENT_ACTIVITY = [
  { msg: "Midnight Drive trending di Top 50 Indonesia",   time: "2 min ago",  type: "up" },
  { msg: "1.000 streams baru di Spotify hari ini",        time: "15 min ago", type: "stream" },
  { msg: "Sunset Paradise ditambah ke 3 playlist baru",   time: "1 jam ago",  type: "playlist" },
  { msg: "Revenue baru Rp 2.300.000 dari Apple Music",    time: "3 jam ago",  type: "revenue" },
  { msg: "Broken Dreams direset ke review lagi",          time: "5 jam ago",  type: "info" },
];

// Custom tooltip for chart
const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-purple-100 rounded-2xl px-4 py-3 shadow-xl">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-base font-bold text-purple-600">{(payload[0].value as number).toLocaleString()} Streams</p>
      </div>
    );
  }
  return null;
};

// ── Main Component ─────────────────────────────────────────────────────────────
export function StreamingClient({ data, userName }: Props) {
  const [activeFilter, setActiveFilter] = useState("30 Hari");
  const [showAllCountries, setShowAllCountries] = useState(false);
  const realtimeStreams = useRealtimeCounter(data.stats.totalStreams);

  const statCards: StatCard[] = [
    { label: "Total Streams",       value: fmtNum(data.stats.totalStreams),      icon: Play,       iconBg: "#EDE9FF", iconColor: "#7C3AED", change: 12.4,  period: "vs bulan lalu" },
    { label: "Monthly Listeners",   value: fmtNum(data.stats.monthlyListeners),  icon: Users,      iconBg: "#E0F2FE", iconColor: "#0284C7", change: 10.7,  period: "vs bulan lalu" },
    { label: "Followers",           value: fmtNum(data.stats.followers),         icon: Heart,      iconBg: "#FFF1F2", iconColor: "#E11D48", change:  5.2,  period: "vs bulan lalu" },
    { label: "Saves",               value: fmtNum(data.stats.saves),             icon: BookOpen,   iconBg: "#FFF7ED", iconColor: "#EA580C", change:  8.3,  period: "vs bulan lalu" },
    { label: "Revenue",             value: fmtRp(data.stats.revenue),            icon: DollarSign, iconBg: "#F0FDF4", iconColor: "#16A34A", change: 14.1,  period: "vs bulan lalu" },
    { label: "Watch Time",          value: data.stats.watchTimeHours.toLocaleString() + "h", icon: Clock, iconBg: "#EFF6FF", iconColor: "#2563EB", change: 15.2,  period: "vs bulan lalu" },
    { label: "Total Playlist",      value: fmtNum(data.stats.totalPlaylists),   icon: ListMusic,   iconBg: "#FAF5FF", iconColor: "#9333EA", change:  3.8,  period: "vs bulan lalu" },
    { label: "Active Releases",     value: String(data.stats.activeReleases),    icon: Disc,       iconBg: "#EDE9FF", iconColor: "#7C3AED", change:  2.0,  period: "vs bulan lalu" },
  ];

  const platTotal = data.platTotal || 1;

  return (
    <div className="animate-fade-in pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <nav className="text-xs text-gray-400 mb-2">
            Dashboard &rsaquo; <span className="text-purple-600 font-medium">Analytics Streaming</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Analytics Streaming</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau performa musikmu di semua platform streaming.</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Date filter */}
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-1 flex-wrap">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeFilter === f
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >{f}</button>
            ))}
          </div>

          {/* Actions */}
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-600 hover:bg-purple-100 transition shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Realtime Counter ─────────────────────────────────────────────────── */}
      <div className="mb-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-purple-200">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <span className="text-white/80 text-sm font-medium">Realtime Streaming Counter</span>
        </div>
        <div className="text-white font-bold text-2xl tracking-wide">{realtimeStreams.toLocaleString("id-ID")} streams</div>
        <div className="text-white/60 text-xs">Update setiap ~3 detik</div>
      </div>

      {/* ── 8 Stat Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="group bg-white rounded-[24px] border border-gray-100 p-5 flex flex-col gap-3 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(124,92,255,0.15)]"
              style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}
            >
              <div className="flex items-start justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
                <div className="rounded-2xl p-2.5 flex-shrink-0" style={{ background: card.iconBg }}>
                  <Icon className="w-4 h-4" style={{ color: card.iconColor }} />
                </div>
              </div>
              <div>
                <p className="text-xl font-extrabold text-gray-900 leading-none">{card.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  {card.change >= 0
                    ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    : <TrendingDown className="w-3.5 h-3.5 text-red-500" />}
                  <span className={`text-xs font-bold ${card.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {card.change >= 0 ? "+" : ""}{card.change}%
                  </span>
                  <span className="text-xs text-gray-400">{card.period}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Streams Over Time + Platform ────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Area Chart */}
        <div className="xl:col-span-2 bg-white rounded-[28px] border border-gray-100 p-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-extrabold text-gray-900 text-base">Streams Over Time</h2>
              <p className="text-xs text-gray-400 mt-0.5">Data 30 hari terakhir</p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-purple-600 font-semibold">
              <Calendar className="w-3.5 h-3.5" /> {activeFilter}
            </div>
          </div>

          <div className="mt-2 mb-4">
            <p className="text-3xl font-extrabold text-gray-900">{fmtNum(data.stats.totalStreams)}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-bold text-emerald-600">+12.4%</span>
              <span className="text-xs text-gray-400">vs. periode sebelumnya</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyStreams} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 10 }}
                  interval={Math.floor(data.dailyStreams.length / 6)}
                />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "#94A3B8", fontSize: 10 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone" dataKey="streams"
                  stroke="#7C3AED" strokeWidth={2.5}
                  fill="url(#streamGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Breakdown */}
        <div className="bg-white rounded-[28px] border border-gray-100 p-6 overflow-y-auto max-h-[460px]" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900 text-base">Streams by Platform</h2>
            <span className="text-xs text-purple-600 font-semibold cursor-pointer hover:underline">View All</span>
          </div>

          <div className="grid grid-cols-[1fr_70px_50px] text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 mb-2">
            <span>Platform</span><span className="text-right">Streams</span><span className="text-right">%</span>
          </div>

          <div className="flex flex-col gap-3">
            {data.platformData.map((p) => {
              const pct = platTotal > 0 ? (p.streams / platTotal * 100) : 0;
              return (
                <div key={p.name}>
                  <div className="grid grid-cols-[1fr_70px_50px] items-center gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.color }} />
                      <span className="text-xs font-semibold text-gray-800 truncate">{p.name}</span>
                    </div>
                    <span className="text-xs font-bold text-gray-600 text-right">{fmtNum(p.streams)}</span>
                    <span className="text-xs font-bold text-right" style={{ color: p.color }}>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(pct, 100)}%`, background: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-[1fr_70px_50px] text-xs font-bold text-gray-800">
            <span>Total</span>
            <span className="text-right">{fmtNum(platTotal)}</span>
            <span className="text-right">100%</span>
          </div>
        </div>
      </div>

      {/* ── Top Tracks Table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-[28px] border border-gray-100 p-6 mb-8" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-extrabold text-gray-900 text-base">Top Tracks</h2>
          <span className="text-xs text-purple-600 font-semibold cursor-pointer hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </span>
        </div>

        <div className="overflow-x-auto -mx-2">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-100">
                <th className="text-left pb-3 pl-2 font-bold w-8">#</th>
                <th className="text-left pb-3 font-bold">Track</th>
                <th className="text-left pb-3 font-bold hidden md:table-cell">ISRC</th>
                <th className="text-left pb-3 font-bold hidden lg:table-cell">Album</th>
                <th className="text-left pb-3 font-bold hidden lg:table-cell">Release</th>
                <th className="text-right pb-3 font-bold">Streams</th>
                <th className="text-right pb-3 font-bold hidden md:table-cell">Revenue</th>
                <th className="text-right pb-3 font-bold hidden lg:table-cell">Listeners</th>
                <th className="text-right pb-3 font-bold hidden lg:table-cell">Saves</th>
                <th className="text-center pb-3 font-bold">Trend</th>
              </tr>
            </thead>
            <tbody>
              {data.topTracks.map((track, i) => (
                <tr key={track.rank}
                  className="border-b border-gray-50 hover:bg-purple-50/50 transition-colors group">
                  <td className="py-3 pl-2 text-xs font-bold text-gray-400">{track.rank}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background: `linear-gradient(135deg, #7C3AED, #3B82F6)` }}>
                        {track.cover
                          ? <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                          : <Music className="w-5 h-5 text-white" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-tight">{track.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 md:hidden">{track.isrc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-xs text-gray-500 font-mono hidden md:table-cell">{track.isrc}</td>
                  <td className="py-3 text-xs text-gray-600 hidden lg:table-cell max-w-[120px] truncate">{track.album}</td>
                  <td className="py-3 text-xs text-gray-500 hidden lg:table-cell whitespace-nowrap">{track.releaseDate}</td>
                  <td className="py-3 text-right font-bold text-gray-900 text-sm">{fmtNum(track.streams)}</td>
                  <td className="py-3 text-right text-xs text-emerald-600 font-semibold hidden md:table-cell">{fmtRp(track.revenue)}</td>
                  <td className="py-3 text-right text-xs text-gray-600 hidden lg:table-cell">{fmtNum(track.listeners)}</td>
                  <td className="py-3 text-right text-xs text-gray-600 hidden lg:table-cell">{fmtNum(track.saves)}</td>
                  <td className="py-3 text-center">
                    {track.trend === "up"
                      ? <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full">
                          <TrendingUp className="w-3 h-3" /> Up
                        </span>
                      : <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full">
                          <TrendingDown className="w-3 h-3" /> Down
                        </span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-3 pl-2">Menampilkan 1–{data.topTracks.length} dari {data.topTracks.length} track</p>
        </div>
      </div>

      {/* ── Bottom Row: Countries + Cities + Playlists + Sources ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

        {/* Top Countries */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
              <Globe className="w-4 h-4 text-purple-500" /> Top Countries
            </h2>
            <button onClick={() => setShowAllCountries(v => !v)} className="text-[10px] text-purple-600 font-bold">
              {showAllCountries ? "Lebih Sedikit" : "View All"}
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {(showAllCountries ? TOP_COUNTRIES : TOP_COUNTRIES.slice(0, 5)).map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.flag}</span>
                    <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px]">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{c.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${c.pct * 4}%`, background: "linear-gradient(90deg,#7C3AED,#3B82F6)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Cities */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <MapPin className="w-4 h-4 text-blue-500" /> Top Cities
          </h2>
          <div className="flex flex-col gap-3">
            {TOP_CITIES.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.country}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-600">{fmtNum(c.streams)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Track */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <Music className="w-4 h-4 text-emerald-500" /> Top Track
          </h2>
          <div className="flex flex-col gap-3">
            {data.topTracks.slice(0, 6).map((t, i) => (
              <div key={t.rank} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-bold text-gray-300 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden"
                    style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)" }}>
                    {t.cover
                      ? <img src={t.cover} alt={t.title} className="w-full h-full object-cover" />
                      : <Music className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{t.title}</p>
                    <p className="text-[10px] text-gray-400">{t.album}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-700 flex-shrink-0">{fmtNum(t.streams)}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Top Sources */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-orange-500" /> Top Sources
          </h2>
          <div className="flex flex-col gap-3">
            {TOP_SOURCES.map(s => (
              <div key={s.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs font-semibold text-gray-700">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{s.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Daily / Weekly / Monthly Summary + Recent Activity ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Streaming Summary Cards */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Streaming Summary</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: "Daily Streams",   val: Math.round(data.stats.totalStreams / 30),  color: "#7C3AED", icon: "📊" },
              { label: "Weekly Streams",  val: Math.round(data.stats.totalStreams / 4.3), color: "#3B82F6", icon: "📈" },
              { label: "Monthly Streams", val: data.stats.totalStreams,                   color: "#10B981", icon: "🎵" },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-500">{item.label}</p>
                    <p className="text-base font-extrabold text-gray-900">{fmtNum(item.val)}</p>
                  </div>
                </div>
                <TrendingUp className="w-4 h-4" style={{ color: item.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Trending Songs */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Trending Songs 🔥</h2>
          <div className="flex flex-col gap-3">
            {data.topTracks.slice(0, 5).map((t, i) => (
              <div key={t.rank} className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" : i === 2 ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-gray-100 text-gray-500"}`}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{t.title}</p>
                  <p className="text-[10px] text-gray-400">{fmtNum(t.streams)} streams</p>
                </div>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Recent Activity</h2>
          <div className="flex flex-col gap-3">
            {RECENT_ACTIVITY.map((act, i) => {
              const icons: Record<string, string> = { up: "📈", stream: "🎵", playlist: "🎧", revenue: "💰", info: "ℹ️" };
              return (
                <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                  <span className="text-base flex-shrink-0 mt-0.5">{icons[act.type] || "•"}</span>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-700 font-medium leading-snug">{act.msg}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{act.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100">
        © 2025 BREAKOUT Music Distribution · Analytics Streaming · Data diperbarui setiap hari
      </div>
    </div>
  );
}
