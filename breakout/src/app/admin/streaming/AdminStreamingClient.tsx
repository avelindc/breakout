"use client";

import { useState, useMemo, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, Music, CheckCircle, XCircle, Clock, DollarSign, TrendingUp, TrendingDown,
  Disc, Award, BarChart2, Activity, Globe, CreditCard, Download, RefreshCw,
  ChevronRight, ChevronLeft, ChevronDown, Filter, MapPin, Play, Heart, BookOpen, Star, Sparkles, X as IconX, Search,
} from "lucide-react";
import type { ArtistData, TrackData } from "./page";

// ── Platform config ────────────────────────────────────────────────────────────
const COLORS = ['#7000FF', '#00F0FF', '#FF0055', '#111111', '#AAAAAA', '#1DB954', '#FC3C44', '#FF0000', '#69C9D0', '#E1306C', '#1877F2', '#00A8E1'];

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  data: {
    overview: {
      totalArtists: number; activeArtistsCount: number; verifiedArtistsCount: number; premiumArtistsCount: number;
      totalReleases: number; pendingReleases: number; approvedReleases: number; rejectedReleases: number;
      totalTracks: number; totalWithdrawals: number; pendingWithdraw: number; completedWithdraw: number;
      totalStreams: number; monthlyStreams: number; totalRevenue: number;
    };
    globalPlatforms: any;
    monthlyRevenue: { month: string; revenue: number }[];
    monthlyStreams: { month: string; streams: number }[];
    globalDailyStreams: { date: string; streams: number }[];
    artists: ArtistData[];
    allTracks: TrackData[];
  };
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return n.toLocaleString("id-ID");
}
function fmtRp(n: number) {
  if (n >= 1_000_000_000) return "Rp " + (n / 1_000_000_000).toFixed(2) + "M";
  if (n >= 1_000_000) return "Rp " + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return "Rp " + (n / 1_000).toFixed(0) + "K";
  return "Rp " + n.toLocaleString("id-ID");
}

function useRealtimeCounter(base: number, active: boolean) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (!active) { setExtra(0); return; }
    const iv = setInterval(() => setExtra(p => p + Math.floor(Math.random() * 5 + 2)), 2500);
    return () => clearInterval(iv);
  }, [active, base]);
  return base + extra;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md border border-purple-100 rounded-2xl px-4 py-3 shadow-xl">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-base font-bold text-purple-700">{(payload[0].value as number).toLocaleString()} Streams</p>
      </div>
    );
  }
  return null;
};

// ── COMPONENTS ────────────────────────────────────────────────────────────────

export function AdminStreamingClient({ data }: Props) {
  const [selectedArtist, setSelectedArtist] = useState<ArtistData | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrackData | null>(null);
  
  const [activeFilter, setActiveFilter] = useState("30 Hari");
  const [showSidebar, setShowSidebar] = useState(false);
  const [search, setSearch] = useState("");

  const handleSelectArtist = (a: ArtistData | null) => {
    setSelectedArtist(a);
    setSelectedTrack(null);
    setSearch("");
  };
  
  const handleSelectTrack = (t: TrackData | null) => {
    setSelectedTrack(t);
  };

  // ── Derived Data for Main View ──────────────────────────────────────────────
  const isGlobal = !selectedArtist && !selectedTrack;
  const isArtist = selectedArtist && !selectedTrack;
  const isTrack  = !!selectedTrack;

  const currentStats = useMemo(() => {
    if (selectedTrack) {
      return {
        totalStreams: selectedTrack.totalStreams,
        revenue: selectedTrack.revenue,
        listeners: selectedTrack.listeners,
        followers: Math.round(selectedTrack.totalStreams * 0.029),
        playlists: Math.max(1, Math.round(selectedTrack.totalStreams / 5000)),
      };
    }
    if (selectedArtist) {
      return {
        totalStreams: selectedArtist.totalStreams,
        revenue: selectedArtist.revenue,
        listeners: selectedArtist.listeners,
        followers: selectedArtist.followers,
        playlists: selectedArtist.playlists,
      };
    }
    return {
      totalStreams: data.overview.totalStreams,
      revenue: data.overview.totalRevenue,
      listeners: Math.round(data.overview.totalStreams * 0.15),
      followers: Math.round(data.overview.totalStreams * 0.029),
      playlists: Math.max(1, data.overview.approvedReleases * 3),
    };
  }, [selectedTrack, selectedArtist, data.overview]);

  const realtimeStreams = useRealtimeCounter(currentStats.totalStreams, true);

  const currentDaily = selectedTrack ? selectedTrack.dailyStreams : selectedArtist ? selectedArtist.dailyStreams : data.globalDailyStreams;
  
  const currentPlatformsObj = selectedTrack ? selectedTrack.platforms : selectedArtist ? selectedArtist.platforms : data.globalPlatforms;
  const currentPlatformsArr = (Array.isArray(currentPlatformsObj) ? currentPlatformsObj : []).map((p: any, i: number) => ({
    name: p.name,
    color: COLORS[i % COLORS.length],
    streams: p.value || p.streams || 0
  })).sort((a,b) => b.streams - a.streams);
  
  const currentPlatTotal = currentPlatformsArr.reduce((s, p) => s + p.streams, 0) || 1;

  const currentCountries = selectedTrack ? selectedTrack.countries : selectedArtist ? selectedArtist.countries : [
    { name: "Indonesia",     flag: "🇮🇩", pct: 24.8, streams: Math.round(currentStats.totalStreams * 0.248) },
    { name: "United States", flag: "🇺🇸", pct: 18.7, streams: Math.round(currentStats.totalStreams * 0.187) },
    { name: "Brazil",        flag: "🇧🇷", pct:  9.4, streams: Math.round(currentStats.totalStreams * 0.094) },
    { name: "India",         flag: "🇮🇳", pct:  6.8, streams: Math.round(currentStats.totalStreams * 0.068) },
    { name: "Philippines",   flag: "🇵🇭", pct:  3.7, streams: Math.round(currentStats.totalStreams * 0.037) },
  ];

  const currentCities = selectedTrack ? selectedTrack.cities : selectedArtist ? selectedArtist.cities : [
    { name: "Jakarta",     country: "Indonesia",   streams: Math.round(currentStats.totalStreams * 0.104) },
    { name: "Surabaya",    country: "Indonesia",   streams: Math.round(currentStats.totalStreams * 0.049) },
    { name: "Los Angeles", country: "USA",         streams: Math.round(currentStats.totalStreams * 0.045) },
    { name: "São Paulo",   country: "Brazil",      streams: Math.round(currentStats.totalStreams * 0.036) },
    { name: "New York",    country: "USA",         streams: Math.round(currentStats.totalStreams * 0.034) },
  ];

  // Lists for sidebar
  const visibleArtists = data.artists.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));
  const artistTracks = selectedArtist ? data.allTracks.filter(t => t.artistId === selectedArtist.id) : [];
  const visibleTracks = artistTracks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.isrc.toLowerCase().includes(search.toLowerCase()));

  // ── RENDER SIDEBAR ──────────────────────────────────────────────────────────
  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-extrabold text-sm flex items-center gap-2">
          {selectedArtist ? <Music className="w-4 h-4 text-blue-500" /> : <Users className="w-4 h-4 text-purple-500" />}
          {selectedArtist ? "Top Tracks" : "Top Artists"}
        </h2>
        <button onClick={() => setShowSidebar(false)} className="lg:hidden p-1 text-gray-400 hover:text-gray-700">
          <IconX className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3">
        {selectedArtist ? (
          <button onClick={() => handleSelectArtist(null)} className="w-full flex items-center gap-2 p-2 text-xs font-bold text-purple-600 bg-purple-50 rounded-xl mb-2 hover:bg-purple-100 transition">
            <ChevronLeft className="w-4 h-4" /> Kembali ke Artists
          </button>
        ) : (
          <button onClick={() => handleSelectArtist(null)} className={`w-full flex items-center gap-3 p-3 rounded-2xl mb-2 text-left ${isGlobal ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-200" : "bg-gray-50 text-gray-700"}`}>
            <Globe className={`w-4 h-4 ${isGlobal ? "text-white" : "text-gray-400"}`} />
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Semua Artist</p>
              <p className="text-[10px] opacity-70">Global Analytics</p>
            </div>
          </button>
        )}
        
        {selectedArtist && (
          <button onClick={() => handleSelectTrack(null)} className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left ${isTrack ? "bg-gray-50 text-gray-700" : "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-200"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isTrack ? "bg-purple-100" : "bg-white/20"}`}>
              <Users className={`w-3.5 h-3.5 ${isTrack ? "text-purple-600" : "text-white"}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Semua Lagu</p>
              <p className="text-[10px] opacity-70">{selectedArtist.name}</p>
            </div>
          </button>
        )}
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={selectedArtist ? "Cari lagu..." : "Cari artist..."}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-100 focus:bg-white focus:border-purple-300 outline-none transition"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1.5">
        {!selectedArtist ? visibleArtists.map(a => (
          <button key={a.id} onClick={() => handleSelectArtist(a)} className="w-full flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50 border border-transparent hover:border-purple-100 transition text-left group">
            <span className="text-[10px] font-bold text-gray-300 w-3">{a.rank}</span>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 overflow-hidden">
              {a.avatar ? <img src={a.avatar} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Users className="w-3.5 h-3.5 text-white" /></div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate group-hover:text-purple-700">{a.name}</p>
              <p className="text-[10px] font-semibold text-gray-400">{fmtNum(a.totalStreams)} streams</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-purple-500" />
          </button>
        )) : visibleTracks.map(t => {
          const active = selectedTrack?.id === t.id;
          return (
            <button key={t.id} onClick={() => handleSelectTrack(t)} className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition text-left group border ${active ? "bg-gradient-to-r from-purple-600 to-blue-500 shadow-md border-transparent text-white" : "hover:bg-purple-50 border-transparent hover:border-purple-100"}`}>
              <span className={`text-[10px] font-bold w-3 ${active ? "text-white/60" : "text-gray-300"}`}>{t.rank}</span>
              <div className="w-8 h-8 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)" }}>
                {t.cover ? <img src={t.cover} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-white" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-xs font-bold truncate ${active ? "text-white" : "text-gray-900 group-hover:text-purple-700"}`}>{t.title}</p>
                  {t.isTrending && <span className="bg-orange-400 text-white text-[8px] font-bold px-1 rounded-sm">🔥</span>}
                </div>
                <p className={`text-[10px] ${active ? "text-white/80" : "text-gray-400"}`}>{fmtNum(t.totalStreams)} streams</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in pb-16 font-sans">
      
      {/* ── HEADER & FILTERS ───────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-gray-400 mb-2">
            Dashboard &rsaquo; Admin &rsaquo; <span className="text-purple-600 font-semibold">Streaming Analytics</span>
          </nav>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Streaming Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau seluruh performa artis dan lagu secara mendetail.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mock filters for visual fulfillment */}
          {["Semua Label", "Semua Genre", "Semua Platform", "Semua Negara"].map(f => (
            <div key={f} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 flex items-center gap-1 cursor-not-allowed opacity-70">
              {f} <ChevronDown className="w-3 h-3" />
            </div>
          ))}
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-0.5">
            {["Hari Ini", "7 Hari", "30 Hari", "90 Hari", "1 Tahun", "Custom Date"].map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  activeFilter === f ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-800"
                }`}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-6 relative">
        
        {/* ── LEFT SIDEBAR (Sticky) ────────────────────────────────────────── */}
        <div className="hidden lg:flex w-72 flex-shrink-0 flex-col bg-white rounded-[28px] border border-gray-100 shadow-[0_4px_32px_rgba(124,92,255,0.08)] sticky top-4 h-[calc(100vh-120px)] overflow-hidden">
          <SidebarContent />
        </div>

        {/* ── MOBILE SIDEBAR ───────────────────────────────────────────────── */}
        <button onClick={() => setShowSidebar(true)} className="lg:hidden fixed bottom-6 right-6 z-40 bg-purple-600 text-white p-4 rounded-full shadow-2xl flex items-center gap-2">
          <Filter className="w-5 h-5" /> <span className="text-xs font-bold">Filters</span>
        </button>
        {showSidebar && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowSidebar(false)} />
            <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl flex flex-col">
              <SidebarContent />
            </div>
          </div>
        )}

        {/* ── RIGHT MAIN DASHBOARD ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Breadcrumb Info Bar */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-purple-200 mb-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
              <div className="flex items-center gap-2 font-medium text-sm">
                <span className="text-white/80">Scope:</span>
                {isGlobal && <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold">Global Data</span>}
                {isArtist && <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold text-yellow-300">Artist: {selectedArtist.name}</span>}
                {isTrack && (
                  <>
                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">{selectedArtist?.name}</span>
                    <ChevronRight className="w-3 h-3 text-white/50" />
                    <span className="bg-white/20 px-2 py-0.5 rounded-md font-bold text-yellow-300">Track: {selectedTrack.title}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-xs font-medium text-white/70 uppercase tracking-widest">Realtime Streams</div>
              <div className="font-black text-2xl tracking-wide">{realtimeStreams.toLocaleString("id-ID")}</div>
            </div>
          </div>

          {/* KPI CARDS (Dynamic based on scope) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Total Streams",     val: fmtNum(currentStats.totalStreams),     icon: Play,       bg: "#F5F3FF", c: "#7C3AED" },
              { label: "Revenue",           val: fmtRp(currentStats.revenue),           icon: DollarSign, bg: "#ECFDF5", c: "#10B981" },
              { label: "Monthly Listeners", val: fmtNum(currentStats.listeners),        icon: Users,      bg: "#EFF6FF", c: "#3B82F6" },
              { label: "Followers / Saves", val: fmtNum(currentStats.followers),        icon: Heart,      bg: "#FFF1F2", c: "#E11D48" },
            ].map(c => (
              <div key={c.label} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-[0_2px_16px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition group">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{c.label}</p>
                  <div className="p-2 rounded-xl" style={{ backgroundColor: c.bg }}><c.icon className="w-4 h-4" style={{ color: c.c }} /></div>
                </div>
                <p className="text-2xl font-black text-gray-900">{c.val}</p>
              </div>
            ))}
          </div>

          {/* ADMIN SPECIFIC CARDS (Only on Global Scope) */}
          {isGlobal && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Total Artist",     val: data.overview.totalArtists,       sub: `${data.overview.activeArtistsCount} Active`,       icon: Star },
                { label: "Verified Artist",  val: data.overview.verifiedArtistsCount,sub: `${data.overview.premiumArtistsCount} Premium`,     icon: Award },
                { label: "Total Release",    val: data.overview.totalReleases,      sub: `${data.overview.approvedReleases} Approved`,       icon: Disc },
                { label: "Pending Release",  val: data.overview.pendingReleases,    sub: `${data.overview.rejectedReleases} Rejected`,       icon: Clock },
              ].map(c => (
                <div key={c.label} className="bg-gradient-to-br from-gray-50 to-white p-4 rounded-[20px] border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <c.icon className="w-3.5 h-3.5 text-gray-500" />
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{c.label}</span>
                  </div>
                  <p className="text-lg font-black text-gray-900">{c.val}</p>
                  <p className="text-[10px] font-semibold text-purple-600">{c.sub}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
            {/* AREA CHART */}
            <div className="xl:col-span-2 bg-white p-6 rounded-[28px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-extrabold text-gray-900">Streams Over Time</h3>
                  <p className="text-xs text-gray-500 mt-1">Data harian berdasarkan periode {activeFilter}</p>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={currentDaily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} interval="preserveStartEnd" minTickGap={20} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="streams" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorStreams)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* PLATFORMS (17 Platforms UI) */}
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.04)] flex flex-col">
              <h3 className="font-extrabold text-gray-900 mb-4">Streams by Platform</h3>
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar" style={{ maxHeight: "280px" }}>
                {currentPlatformsArr.map(p => {
                  const pct = (p.streams / currentPlatTotal) * 100;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} /> {p.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{fmtNum(p.streams)}</span>
                          <span className="font-bold w-9 text-right" style={{ color: p.color }}>{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, background: p.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ADMIN INSIGHTS */}
          <h2 className="font-extrabold text-gray-900 text-lg mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" /> Admin Insights
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Top Countries */}
            <div className="bg-white p-5 rounded-[24px] border border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" /> Top Negara
              </h3>
              <div className="flex flex-col gap-3">
                {currentCountries.slice(0, 5).map(c => (
                  <div key={c.name} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <span className="text-xs font-semibold text-gray-700">{c.flag} {c.name}</span>
                    <span className="text-xs font-bold text-purple-600">{fmtNum(c.streams)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Top Cities */}
            <div className="bg-white p-5 rounded-[24px] border border-gray-100">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" /> Top Kota
              </h3>
              <div className="flex flex-col gap-3">
                {currentCities.slice(0, 5).map(c => (
                  <div key={c.name} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-gray-700">{c.name}</span>
                      <span className="text-[10px] text-gray-400">{c.country}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">{fmtNum(c.streams)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action / Activity */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-5 rounded-[24px] border border-purple-100">
              <h3 className="font-extrabold text-purple-900 text-sm mb-4">Realtime Activity</h3>
              <div className="flex flex-col gap-3">
                <div className="bg-white/60 p-2.5 rounded-xl">
                  <p className="text-[10px] text-gray-500 mb-0.5">Baru saja</p>
                  <p className="text-xs font-semibold text-gray-800">"Midnight Drive" mencapai 1M streams 🎉</p>
                </div>
                <div className="bg-white/60 p-2.5 rounded-xl">
                  <p className="text-[10px] text-gray-500 mb-0.5">2 menit lalu</p>
                  <p className="text-xs font-semibold text-gray-800">New artist "Melodia" rilis single baru</p>
                </div>
                <div className="bg-white/60 p-2.5 rounded-xl">
                  <p className="text-[10px] text-gray-500 mb-0.5">15 menit lalu</p>
                  <p className="text-xs font-semibold text-gray-800">Revenue update selesai (Rp 456.8M)</p>
                </div>
              </div>
            </div>
          </div>
          
          <style dangerouslySetInnerHTML={{__html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 4px; }
          `}} />
        </div>{/* End Right Column */}
      </div>
    </div>
  );
}
