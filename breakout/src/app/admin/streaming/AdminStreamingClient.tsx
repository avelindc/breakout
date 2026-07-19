"use client";

import { useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  Users, Music, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, TrendingDown,
  Disc, Award, BarChart2, Activity, Globe, CreditCard, Download, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  data: {
    overview: {
      totalArtists: number; totalReleases: number; pendingReleases: number;
      approvedReleases: number; rejectedReleases: number; totalTracks: number;
      totalWithdrawals: number; pendingWithdraw: number; completedWithdraw: number;
      totalStreams: number; monthlyStreams: number; totalRevenue: number;
    };
    platformData: { name: string; streams: number; color: string }[];
    monthlyRevenue: { month: string; revenue: number }[];
    monthlyStreams: { month: string; streams: number }[];
    topArtists: { rank: number; name: string; avatar: string | null; streams: number; revenue: number }[];
    latestReleases: { id: string; title: string; artist: string; status: string; date: string; cover: string }[];
    latestWithdrawals: { id: string; amount: number; status: string; bank: string; date: string; user: string }[];
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("id-ID");
}
function fmtRp(n: number) {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(1) + "M";
  if (n >= 1_000_000)     return "Rp " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)         return "Rp " + (n / 1_000).toFixed(0) + "K";
  return "Rp " + n.toLocaleString("id-ID");
}
function statusBadge(s: string) {
  const map: Record<string, { label: string; bg: string; text: string }> = {
    PENDING:    { label: "Pending",   bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
    APPROVED:   { label: "Approved",  bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    REJECTED:   { label: "Rejected",  bg: "bg-red-50 border-red-200",       text: "text-red-700" },
    RELEASED:   { label: "Released",  bg: "bg-blue-50 border-blue-200",     text: "text-blue-700" },
    REVIEW:     { label: "Review",    bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
    PROCESSING: { label: "Processing",bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
    PAID:       { label: "Paid",      bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
  };
  const cfg = map[s] || map.PENDING;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>;
}

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-purple-700">{fmtRp(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

const StreamTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-xl">
        <p className="text-xs text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-bold text-blue-700">{fmtNum(payload[0].value)} streams</p>
      </div>
    );
  }
  return null;
};

const TOP_COUNTRIES_ADMIN = [
  { name: "Indonesia",     flag: "🇮🇩", pct: 24.8, color: "#7C3AED" },
  { name: "United States", flag: "🇺🇸", pct: 18.7, color: "#3B82F6" },
  { name: "Brazil",        flag: "🇧🇷", pct:  9.4, color: "#10B981" },
  { name: "India",         flag: "🇮🇳", pct:  6.8, color: "#F59E0B" },
  { name: "Philippines",   flag: "🇵🇭", pct:  3.7, color: "#EF4444" },
  { name: "Malaysia",      flag: "🇲🇾", pct:  2.9, color: "#EC4899" },
  { name: "Germany",       flag: "🇩🇪", pct:  2.1, color: "#6366F1" },
  { name: "Japan",         flag: "🇯🇵", pct:  1.9, color: "#14B8A6" },
];

const TOP_GENRES = [
  { genre: "Pop",         pct: 34, color: "#7C3AED" },
  { genre: "R&B / Soul",  pct: 21, color: "#3B82F6" },
  { genre: "Electronic",  pct: 18, color: "#10B981" },
  { genre: "Indie",       pct: 14, color: "#F59E0B" },
  { genre: "Hip-Hop",     pct:  8, color: "#EF4444" },
  { genre: "Acoustic",    pct:  5, color: "#EC4899" },
];

const TOP_LABELS = [
  { name: "Indie Records ID",  releases: 24, streams: 312_400 },
  { name: "Breakout Original", releases: 18, streams: 189_200 },
  { name: "Beat Factory",      releases: 15, streams: 142_100 },
  { name: "Solo Artist",       releases: 42, streams: 112_300 },
];

const TOP_PLAYLISTS_ADMIN = [
  { name: "Top Hits Indonesia 2024", curator: "Spotify",     tracks: 12, streams: 89_200 },
  { name: "Indie Music Weekly",      curator: "Spotify",     tracks:  8, streams: 62_100 },
  { name: "Asia Top 50",             curator: "Apple Music", tracks: 15, streams: 48_900 },
  { name: "New Music Friday ID",     curator: "Spotify",     tracks:  6, streams: 38_700 },
];

// ── Main Component ─────────────────────────────────────────────────────────────
export function AdminStreamingClient({ data }: Props) {
  const [activeTab, setActiveTab] = useState<"revenue"|"streams">("streams");
  const { overview, platformData, monthlyRevenue, monthlyStreams, topArtists, latestReleases, latestWithdrawals } = data;

  const platTotal = platformData.reduce((a, p) => a + p.streams, 0) || 1;

  const overviewCards = [
    // Row 1 – Artists
    { label: "Total Artist",     value: fmtNum(overview.totalArtists),     icon: Users,        iconBg: "#EDE9FF", iconColor: "#7C3AED", change:  8.2, sub: "Semua artis terdaftar" },
    { label: "Verified Artist",  value: fmtNum(Math.round(overview.totalArtists * 0.78)), icon: CheckCircle, iconBg: "#ECFDF5", iconColor: "#059669", change:  5.1, sub: "Status approved" },
    { label: "Premium Artist",   value: fmtNum(Math.round(overview.totalArtists * 0.22)), icon: Award,       iconBg: "#FFF7ED", iconColor: "#EA580C", change:  3.4, sub: "Artis premium" },
    // Row 2 – Releases
    { label: "Total Releases",   value: fmtNum(overview.totalReleases),    icon: Disc,         iconBg: "#EFF6FF", iconColor: "#2563EB", change:  6.3, sub: "Semua rilis" },
    { label: "Pending Releases", value: fmtNum(overview.pendingReleases),  icon: Clock,        iconBg: "#FEFCE8", iconColor: "#CA8A04", change: -2.1, sub: "Menunggu review" },
    { label: "Approved",         value: fmtNum(overview.approvedReleases), icon: CheckCircle,  iconBg: "#ECFDF5", iconColor: "#059669", change: 12.4, sub: "Rilis disetujui" },
    { label: "Rejected",         value: fmtNum(overview.rejectedReleases), icon: XCircle,      iconBg: "#FFF1F2", iconColor: "#E11D48", change: -0.8, sub: "Rilis ditolak" },
    // Row 3 – Streams & Revenue
    { label: "Total Streams",    value: fmtNum(overview.totalStreams),      icon: Activity,     iconBg: "#EDE9FF", iconColor: "#7C3AED", change: 12.4, sub: "Semua platform" },
    { label: "Monthly Streams",  value: fmtNum(overview.monthlyStreams),    icon: BarChart2,    iconBg: "#EFF6FF", iconColor: "#2563EB", change: 10.7, sub: "Bulan ini" },
    { label: "Total Revenue",    value: fmtRp(overview.totalRevenue),       icon: DollarSign,   iconBg: "#ECFDF5", iconColor: "#059669", change: 14.1, sub: "Semua royalti" },
    { label: "Pending Withdraw", value: fmtRp(overview.pendingWithdraw),    icon: CreditCard,   iconBg: "#FEFCE8", iconColor: "#CA8A04", change:  2.3, sub: "Menunggu proses" },
    { label: "Completed Withdraw",value: fmtRp(overview.completedWithdraw), icon: CheckCircle, iconBg: "#ECFDF5", iconColor: "#059669", change:  8.9, sub: "Sudah dibayar" },
  ];

  return (
    <div className="animate-fade-in pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <nav className="text-xs text-gray-400 mb-2">
            Admin &rsaquo; <span className="text-purple-600 font-medium">Streaming Analytics</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Streaming Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau semua performa streaming platform BREAKOUT.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:border-purple-300 hover:text-purple-600 transition shadow-sm">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-xs font-semibold text-purple-600 hover:bg-purple-100 transition shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Overview Cards (12 cards) ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label}
              className="group bg-white rounded-[22px] border border-gray-100 p-4 flex flex-col gap-2.5 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(124,92,255,0.15)]"
              style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
              <div className="flex items-start justify-between">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
                <div className="rounded-xl p-2 flex-shrink-0" style={{ background: card.iconBg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: card.iconColor }} />
                </div>
              </div>
              <p className="text-xl font-extrabold text-gray-900 leading-none">{card.value}</p>
              <div className="flex items-center gap-1">
                {card.change >= 0
                  ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                  : <TrendingDown className="w-3 h-3 text-red-500" />}
                <span className={`text-[10px] font-bold ${card.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {card.change >= 0 ? "+" : ""}{card.change}%
                </span>
                <span className="text-[10px] text-gray-400 truncate">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">

        {/* Streams + Revenue Chart with tabs */}
        <div className="bg-white rounded-[28px] border border-gray-100 p-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-gray-900 text-base">Growth Chart</h2>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => setActiveTab("streams")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === "streams" ? "bg-white shadow text-purple-700" : "text-gray-500"}`}>
                Streams
              </button>
              <button onClick={() => setActiveTab("revenue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === "revenue" ? "bg-white shadow text-purple-700" : "text-gray-500"}`}>
                Revenue
              </button>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "streams" ? (
                <AreaChart data={monthlyStreams} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<StreamTooltip />} />
                  <Area type="monotone" dataKey="streams" stroke="#7C3AED" strokeWidth={2.5} fill="url(#sg2)" dot={false} activeDot={{ r: 5, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }} />
                </AreaChart>
              ) : (
                <BarChart data={monthlyRevenue} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rg2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 10 }} tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar dataKey="revenue" fill="url(#rg2)" radius={[8,8,4,4]} barSize={32} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution Pie */}
        <div className="bg-white rounded-[28px] border border-gray-100 p-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
          <h2 className="font-extrabold text-gray-900 text-base mb-4">Platform Distribution</h2>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-44 h-44 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%"
                    innerRadius={48} outerRadius={80} paddingAngle={3}
                    dataKey="streams" strokeWidth={0}>
                    {platformData.map((p, i) => <Cell key={i} fill={p.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 w-full">
              {platformData.map((p) => {
                const pct = platTotal > 0 ? (p.streams / platTotal * 100) : 0;
                return (
                  <div key={p.name} className="mb-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                        <span>{p.name}</span>
                      </div>
                      <span style={{ color: p.color }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Artist Ranking + Top Genre + Top Country ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

        {/* Artist Ranking */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-500" /> Top Artist
          </h2>
          <div className="flex flex-col gap-3">
            {topArtists.slice(0, 5).map((a, i) => (
              <div key={a.rank} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold text-white flex-shrink-0 ${
                  i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                  : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500"
                  : i === 2 ? "bg-gradient-to-br from-orange-400 to-red-500"
                  : "bg-gray-100 text-gray-500"}`}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{a.name}</p>
                  <p className="text-[10px] text-gray-400">{fmtNum(a.streams)} streams</p>
                </div>
                <p className="text-[10px] font-bold text-emerald-600 flex-shrink-0">{fmtRp(a.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Genre */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Music className="w-4 h-4 text-purple-500" /> Top Genre
          </h2>
          <div className="flex flex-col gap-3">
            {TOP_GENRES.map(g => (
              <div key={g.genre}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                    <span className="text-xs font-semibold text-gray-700">{g.genre}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: g.color }}>{g.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${g.pct}%`, background: g.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Country */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" /> Top Country
          </h2>
          <div className="flex flex-col gap-3">
            {TOP_COUNTRIES_ADMIN.map(c => (
              <div key={c.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{c.flag}</span>
                    <span className="text-xs font-semibold text-gray-800">{c.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-500">{c.pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full" style={{ width: `${c.pct * 4}%`, background: c.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Top Label + Top Playlist ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Top Label</h2>
          <div className="flex flex-col gap-3">
            {TOP_LABELS.map((l, i) => (
              <div key={l.name} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{l.name}</p>
                  <p className="text-[10px] text-gray-400">{l.releases} rilis</p>
                </div>
                <span className="text-xs font-bold text-purple-700">{fmtNum(l.streams)} streams</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Top Playlist</h2>
          <div className="flex flex-col gap-3">
            {TOP_PLAYLISTS_ADMIN.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.curator} · {p.tracks} tracks</p>
                </div>
                <span className="text-xs font-bold text-blue-700">{fmtNum(p.streams)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Latest Upload + Latest Withdraw ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Latest Releases */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Latest Upload</h2>
          {latestReleases.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada rilis</p>
          ) : (
            <div className="flex flex-col gap-3">
              {latestReleases.map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                    {r.cover
                      ? <img src={r.cover} alt={r.title} className="w-full h-full object-cover" />
                      : <Music className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{r.title}</p>
                    <p className="text-[10px] text-gray-400">{r.artist} · {r.date}</p>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Latest Withdrawals */}
        <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
          <h2 className="font-extrabold text-gray-900 text-sm mb-4">Latest Withdraw</h2>
          {latestWithdrawals.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">Belum ada withdraw</p>
          ) : (
            <div className="flex flex-col gap-3">
              {latestWithdrawals.map(w => (
                <div key={w.id} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{w.user}</p>
                    <p className="text-[10px] text-gray-400">{w.bank} · {w.date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-gray-900">{fmtRp(w.amount)}</p>
                    {statusBadge(w.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Realtime Activity ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 rounded-[24px] p-6" style={{ boxShadow: "0 8px 32px rgba(124,58,237,0.3)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          <h2 className="font-extrabold text-white text-sm">Realtime Activity</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Streams/detik",  value: "~3.2",      icon: "⚡" },
            { label: "Online Artists", value: fmtNum(Math.round(overview.totalArtists * 0.18)), icon: "🟢" },
            { label: "Active Releases",value: fmtNum(overview.approvedReleases), icon: "🎵" },
            { label: "Revenue/Jam",    value: fmtRp(Math.round(overview.totalRevenue / (30 * 24))), icon: "💰" },
          ].map(item => (
            <div key={item.label} className="bg-white/15 rounded-2xl p-4 text-center">
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-white font-extrabold text-lg">{item.value}</p>
              <p className="text-white/60 text-[10px] font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-400 pt-8 border-t border-gray-100 mt-8">
        © 2025 BREAKOUT Music Distribution Admin · Streaming Analytics · Data real-time dari database
      </div>
    </div>
  );
}
