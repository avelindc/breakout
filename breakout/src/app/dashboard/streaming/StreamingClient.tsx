"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, Music, DollarSign, BookOpen,
  Clock, Disc, Download, RefreshCw, Calendar, Filter,
  Heart, Play, ChevronRight, Globe, MapPin, ListMusic, Sparkles,
  BarChart2, ChevronLeft, ChevronDown, Search, X as IconX,
} from "lucide-react";
import type { TrackData } from "./page";

// ── Platform config (Strictly matching DB Royalty fields) ────────────────────────
const COLORS = ['#7000FF', '#00F0FF', '#FF0055', '#111111', '#AAAAAA', '#1DB954', '#FC3C44', '#FF0000', '#69C9D0', '#E1306C', '#1877F2', '#00A8E1'];

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  allTracks: TrackData[];
  globalStats: Record<string, number>;
  globalDailyStreams: { date: string; streams: number }[];
  globalPlatforms: { name: string; streams: number; color: string }[];
  userName: string;
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

// Realtime counter
function useRealtimeCounter(base: number, active: boolean) {
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    if (!active) { setExtra(0); return; }
    const iv = setInterval(() => setExtra(p => p + Math.floor(Math.random() * 4 + 1)), 2800);
    return () => clearInterval(iv);
  }, [active, base]);
  return base + extra;
}

const FILTER_OPTIONS = ["Hari", "7 Hari", "30 Hari", "90 Hari", "1 Tahun", "Custom"];

const TOP_SOURCES = [
  { name: "Playlist",     pct: 38.4, color: "#6C63FF" },
  { name: "Profile",      pct: 22.1, color: "#3B82F6" },
  { name: "Algorithmic",  pct: 18.7, color: "#8B5CF6" },
  { name: "Search",       pct: 11.2, color: "#06B6D4" },
  { name: "Radio",        pct:  5.8, color: "#10B981" },
  { name: "Other",        pct:  3.8, color: "#94A3B8" },
];

// Custom chart tooltip
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

// ── TRACK LIST PANEL ──────────────────────────────────────────────────────────
function TrackListPanel({
  tracks, selectedId, onSelect, onClose,
}: {
  tracks: TrackData[];
  selectedId: string | null;
  onSelect: (t: TrackData | null) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? tracks.filter(t =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.artist.toLowerCase().includes(search.toLowerCase()) ||
        t.isrc.toLowerCase().includes(search.toLowerCase())
      )
    : tracks;

  return (
    <div className="h-full flex flex-col">
      {/* Panel header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
          <Music className="w-4 h-4 text-purple-500" /> Top Tracks
          <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{tracks.length}</span>
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition lg:hidden">
          <IconX className="w-4 h-4" />
        </button>
      </div>

      {/* All tracks option */}
      <div className="px-3 pt-3 pb-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
            selectedId === null
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-200"
              : "bg-gray-50 hover:bg-purple-50 text-gray-700 border border-gray-100"
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${selectedId === null ? "bg-white/20" : "bg-purple-100"}`}>
            <BarChart2 className={`w-4 h-4 ${selectedId === null ? "text-white" : "text-purple-600"}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-bold truncate ${selectedId === null ? "text-white" : "text-gray-900"}`}>Semua Track</p>
            <p className={`text-[10px] ${selectedId === null ? "text-white/70" : "text-gray-400"}`}>Overview gabungan</p>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari lagu..."
            className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-400 focus:bg-white transition"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
              <IconX className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1.5">
        {filtered.map((track, i) => {
          const isActive = selectedId === track.id;
          return (
            <button
              key={track.id}
              onClick={() => onSelect(track)}
              className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left group relative ${
                isActive
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 shadow-lg shadow-purple-200/50"
                  : "hover:bg-purple-50 border border-transparent hover:border-purple-100"
              }`}
            >
              {/* Rank */}
              <span className={`text-[10px] font-bold w-4 flex-shrink-0 text-center ${isActive ? "text-white/60" : "text-gray-300"}`}>
                {track.rank}
              </span>

              {/* Cover */}
              <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)" }}>
                {track.cover
                  ? <img src={track.cover} alt={track.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-4 h-4 text-white" />
                    </div>}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className={`text-xs font-bold truncate ${isActive ? "text-white" : "text-gray-900"}`}>{track.title}</p>
                  {track.isNew && (
                    <span className="flex-shrink-0 bg-emerald-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">New</span>
                  )}
                  {track.isTrending && (
                    <span className="flex-shrink-0 bg-orange-400 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">🔥</span>
                  )}
                </div>
                <p className={`text-[10px] truncate ${isActive ? "text-white/70" : "text-gray-400"}`}>{track.artist}</p>
                <p className={`text-[10px] font-semibold ${isActive ? "text-white/80" : "text-purple-600"}`}>{fmtNum(track.totalStreams)} streams</p>
              </div>

              {/* Trend arrow */}
              <div className="flex-shrink-0">
                {track.isTrending
                  ? <TrendingUp className={`w-3.5 h-3.5 ${isActive ? "text-white/80" : "text-emerald-500"}`} />
                  : <TrendingDown className={`w-3.5 h-3.5 ${isActive ? "text-white/60" : "text-gray-300"}`} />}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-xs">
            Tidak ada track ditemukan
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function StreamingClient({ allTracks, globalStats, globalDailyStreams, globalPlatforms, userName }: Props) {
  const [selectedTrack, setSelectedTrack] = useState<TrackData | null>(null);
  const [activeFilter, setActiveFilter] = useState("30 Hari");
  const [showAllCountries, setShowAllCountries] = useState(false);
  const [showTrackPanel, setShowTrackPanel] = useState(false);
  const [trackPanelOpen, setTrackPanelOpen] = useState(true); // desktop always visible

  // Derive displayed data
  const currentStats = selectedTrack
    ? {
        totalStreams:     selectedTrack.totalStreams,
        monthlyListeners: selectedTrack.listeners,
        followers:        Math.round(selectedTrack.totalStreams * 0.029),
        saves:            selectedTrack.saves,
        revenue:          selectedTrack.revenue,
        watchTimeHours:   Math.round(selectedTrack.totalStreams * 0.00145),
        totalPlaylists:   Math.max(1, Math.round(selectedTrack.totalStreams / 5000)),
        activeReleases:   globalStats.activeReleases,
      }
    : globalStats;

  const currentDailyStreams = selectedTrack ? selectedTrack.dailyStreams : globalDailyStreams;

  // Build platform data for selected track
  const currentPlatforms = useMemo(() => {
    if (!selectedTrack) return globalPlatforms;
    return selectedTrack.platforms.map((p, i) => ({
      name:    p.name,
      streams: p.value,
      color:   COLORS[i % COLORS.length],
    })).filter(p => p.streams > 0);
  }, [selectedTrack, globalPlatforms]);

  const currentPlatTotal = currentPlatforms.reduce((s, p) => s + p.streams, 0) || 1;

  const currentCountries = selectedTrack ? selectedTrack.countries : [
    { name: "Indonesia",     flag: "🇮🇩", pct: 24.8, streams: Math.round(currentStats.totalStreams * 0.248) },
    { name: "United States", flag: "🇺🇸", pct: 18.7, streams: Math.round(currentStats.totalStreams * 0.187) },
    { name: "Brazil",        flag: "🇧🇷", pct:  9.4, streams: Math.round(currentStats.totalStreams * 0.094) },
    { name: "India",         flag: "🇮🇳", pct:  6.8, streams: Math.round(currentStats.totalStreams * 0.068) },
    { name: "Philippines",   flag: "🇵🇭", pct:  3.7, streams: Math.round(currentStats.totalStreams * 0.037) },
    { name: "Malaysia",      flag: "🇲🇾", pct:  2.9, streams: Math.round(currentStats.totalStreams * 0.029) },
  ];

  const currentCities = selectedTrack ? selectedTrack.cities : [
    { name: "Jakarta",     country: "Indonesia",   streams: Math.round(currentStats.totalStreams * 0.104) },
    { name: "Surabaya",    country: "Indonesia",   streams: Math.round(currentStats.totalStreams * 0.049) },
    { name: "Los Angeles", country: "USA",         streams: Math.round(currentStats.totalStreams * 0.045) },
    { name: "São Paulo",   country: "Brazil",      streams: Math.round(currentStats.totalStreams * 0.036) },
    { name: "New York",    country: "USA",         streams: Math.round(currentStats.totalStreams * 0.034) },
    { name: "Bandung",     country: "Indonesia",   streams: Math.round(currentStats.totalStreams * 0.031) },
    { name: "Manila",      country: "Philippines", streams: Math.round(currentStats.totalStreams * 0.026) },
    { name: "Mumbai",      country: "India",       streams: Math.round(currentStats.totalStreams * 0.023) },
  ];

  const realtimeStreams = useRealtimeCounter(currentStats.totalStreams, true);

  // Stat cards
  const statCards = [
    { label: "Total Streams",     value: fmtNum(currentStats.totalStreams),      icon: Play,       iconBg: "#EDE9FF", iconColor: "#7C3AED", change: 12.4  },
    { label: "Monthly Listeners", value: fmtNum(currentStats.monthlyListeners),  icon: Users,      iconBg: "#E0F2FE", iconColor: "#0284C7", change: 10.7  },
    { label: "Followers",         value: fmtNum(currentStats.followers),         icon: Heart,      iconBg: "#FFF1F2", iconColor: "#E11D48", change:  5.2  },
    { label: "Saves",             value: fmtNum(currentStats.saves),             icon: BookOpen,   iconBg: "#FFF7ED", iconColor: "#EA580C", change:  8.3  },
    { label: "Revenue",           value: fmtRp(currentStats.revenue),            icon: DollarSign, iconBg: "#F0FDF4", iconColor: "#16A34A", change: 14.1  },
    { label: "Watch Time",        value: currentStats.watchTimeHours.toLocaleString() + "h", icon: Clock, iconBg: "#EFF6FF", iconColor: "#2563EB", change: 15.2 },
    { label: "Total Playlist",    value: fmtNum(currentStats.totalPlaylists),    icon: ListMusic,  iconBg: "#FAF5FF", iconColor: "#9333EA", change:  3.8  },
    { label: "Active Releases",   value: String(currentStats.activeReleases),    icon: Disc,       iconBg: "#EDE9FF", iconColor: "#7C3AED", change:  2.0  },
  ];

  return (
    <div className="animate-fade-in pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <div>
          <nav className="text-xs text-gray-400 mb-1.5">
            Dashboard &rsaquo; <span className="text-purple-600 font-medium">Analytics Streaming</span>
            {selectedTrack && (
              <> &rsaquo; <span className="text-blue-600 font-medium">{selectedTrack.title}</span></>
            )}
          </nav>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Analytics Streaming</h1>
          {selectedTrack ? (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-5 h-5 rounded-lg overflow-hidden flex-shrink-0" style={{ background: "linear-gradient(135deg,#7C3AED,#3B82F6)" }}>
                {selectedTrack.cover
                  ? <img src={selectedTrack.cover} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3 text-white" /></div>}
              </div>
              <p className="text-sm font-semibold text-blue-600">{selectedTrack.title}</p>
              <span className="text-gray-300">·</span>
              <p className="text-xs text-gray-500">{selectedTrack.artist}</p>
              <button
                onClick={() => setSelectedTrack(null)}
                className="ml-1 text-[10px] text-purple-600 hover:text-purple-800 font-semibold border border-purple-200 px-2 py-0.5 rounded-full hover:bg-purple-50 transition"
              >
                ← Semua Track
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mt-0.5">Pantau performa musikmu di semua platform.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Mobile: show track list button */}
          <button
            onClick={() => setShowTrackPanel(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md"
          >
            <Music className="w-3.5 h-3.5" />
            {selectedTrack ? selectedTrack.title : "Pilih Track"}
          </button>

          {/* Date filter */}
          <div className="flex bg-white border border-gray-200 rounded-2xl p-1 shadow-sm gap-0.5 flex-wrap">
            {FILTER_OPTIONS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                  activeFilter === f
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}>{f}</button>
            ))}
          </div>


        </div>
      </div>



      {/* ── Main Layout: Track Panel (left) + Analytics (right) ────────────── */}
      <div className="flex gap-6">

        {/* ── LEFT: Track List Panel (desktop sticky) ─────────────────────── */}
        <div className={`hidden lg:block flex-shrink-0 w-72 bg-white rounded-[28px] border border-gray-100 sticky top-4 h-[calc(100vh-120px)] overflow-hidden`}
          style={{ boxShadow: "0 4px 32px rgba(124,92,255,0.10)" }}>
          <TrackListPanel
            tracks={allTracks}
            selectedId={selectedTrack?.id ?? null}
            onSelect={setSelectedTrack}
            onClose={() => {}}
          />
        </div>

        {/* ── Mobile Track Panel (slide over) ─────────────────────────────── */}
        {showTrackPanel && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowTrackPanel(false)} />
            <div className="relative ml-auto w-80 max-w-full h-full bg-white shadow-2xl flex flex-col">
              <TrackListPanel
                tracks={allTracks}
                selectedId={selectedTrack?.id ?? null}
                onSelect={(t) => { setSelectedTrack(t); setShowTrackPanel(false); }}
                onClose={() => setShowTrackPanel(false)}
              />
            </div>
          </div>
        )}

        {/* ── RIGHT: Analytics Content ─────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* 8 Stat Cards */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label}
                  className="group bg-white rounded-[22px] border border-gray-100 p-4 flex flex-col gap-2.5 cursor-default transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_32px_rgba(124,92,255,0.14)]"
                  style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-start justify-between">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
                    <div className="rounded-xl p-2 flex-shrink-0" style={{ background: card.iconBg }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: card.iconColor }} />
                    </div>
                  </div>
                  <p className="text-lg font-extrabold text-gray-900 leading-none">{card.value}</p>
                  <div className="flex items-center gap-1">
                    {card.change >= 0
                      ? <TrendingUp className="w-3 h-3 text-emerald-500" />
                      : <TrendingDown className="w-3 h-3 text-red-500" />}
                    <span className={`text-[10px] font-bold ${card.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {card.change >= 0 ? "+" : ""}{card.change}%
                    </span>
                    <span className="text-[10px] text-gray-400">vs bulan lalu</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Streams Over Time Chart */}
          <div className="bg-white rounded-[28px] border border-gray-100 p-6 mb-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-extrabold text-gray-900 text-sm">Streams Over Time</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedTrack ? `"${selectedTrack.title}" — ` : "Semua Track — "}
                  {activeFilter}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-purple-600 font-semibold">
                <Calendar className="w-3.5 h-3.5" /> {activeFilter}
              </div>
            </div>
            <div className="mb-3">
              <p className="text-3xl font-extrabold text-gray-900">{fmtNum(currentStats.totalStreams)}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">+12.4%</span>
                <span className="text-xs text-gray-400">vs. periode sebelumnya</span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentDailyStreams} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    interval={Math.floor(currentDailyStreams.length / 6)} />
                  <YAxis axisLine={false} tickLine={false}
                    tick={{ fill: "#94A3B8", fontSize: 10 }}
                    tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="streams"
                    stroke="#7C3AED" strokeWidth={2.5} fill="url(#sg)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#7C3AED", stroke: "#fff", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Streams by Platform */}
          <div className="bg-white rounded-[28px] border border-gray-100 p-6 mb-6" style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05)" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-extrabold text-gray-900 text-base">Streams by Platform</h2>
              <span className="text-xs text-purple-600 font-semibold cursor-pointer hover:underline">View All</span>
            </div>

            {/* Table header */}
            <div className="grid grid-cols-[1fr_100px_70px] text-[10px] font-bold uppercase tracking-widest text-gray-400 pb-2 border-b border-gray-100 mb-2">
              <span>Platform</span>
              <span className="text-right">Streams</span>
              <span className="text-right">%</span>
            </div>

            <div className="flex flex-col gap-3">
              {currentPlatforms.map((p) => {
                const pct = currentPlatTotal > 0 ? (p.streams / currentPlatTotal * 100) : 0;
                return (
                  <div key={p.name}>
                    <div className="grid grid-cols-[1fr_100px_70px] items-center mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: p.color }} />
                        <span className="text-sm font-semibold text-gray-800 truncate">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-700 text-right">{fmtNum(p.streams)}</span>
                      <span className="text-sm font-bold text-right" style={{ color: p.color }}>{pct.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(pct, 100)}%`, background: p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-[1fr_100px_70px] text-sm font-bold text-gray-800">
              <span>Total</span>
              <span className="text-right">{fmtNum(currentPlatTotal)}</span>
              <span className="text-right">100%</span>
            </div>
          </div>

          {/* Top Countries + Top Cities + Top Sources */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

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
              <div className="flex flex-col gap-2.5">
                {(showAllCountries ? currentCountries : currentCountries.slice(0, 5)).map(c => (
                  <div key={c.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{c.flag}</span>
                        <span className="text-xs font-semibold text-gray-800 truncate max-w-[90px]">{c.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-gray-500">{c.pct}%</span>
                        <p className="text-[10px] text-gray-400">{fmtNum(c.streams)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full"
                        style={{ width: `${Math.min(c.pct * 4, 100)}%`, background: "linear-gradient(90deg,#7C3AED,#3B82F6)" }} />
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
              <div className="flex flex-col gap-2.5">
                {currentCities.slice(0, 6).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-300 w-4">{i + 1}</span>
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

          {/* Summary: Daily/Weekly/Monthly + Trending + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
              <h2 className="font-extrabold text-gray-900 text-sm mb-4">Streaming Summary</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Daily Streams",   val: Math.round(currentStats.totalStreams / 30),  color: "#7C3AED", icon: "📊" },
                  { label: "Weekly Streams",  val: Math.round(currentStats.totalStreams / 4.3), color: "#3B82F6", icon: "📈" },
                  { label: "Monthly Streams", val: currentStats.totalStreams,                   color: "#10B981", icon: "🎵" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500">{item.label}</p>
                        <p className="text-sm font-extrabold text-gray-900">{fmtNum(item.val)}</p>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
              <h2 className="font-extrabold text-gray-900 text-sm mb-4">Trending Songs 🔥</h2>
              <div className="flex flex-col gap-3">
                {allTracks.filter(t => t.isTrending).slice(0, 5).map((t, i) => (
                  <button key={t.id} onClick={() => setSelectedTrack(t)}
                    className="flex items-center gap-3 hover:bg-purple-50 rounded-xl px-2 py-1.5 transition text-left w-full group">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-extrabold text-white ${i === 0 ? "bg-gradient-to-br from-yellow-400 to-orange-500" : i === 1 ? "bg-gradient-to-br from-gray-300 to-gray-500" : i === 2 ? "bg-gradient-to-br from-orange-400 to-red-500" : "bg-gray-100 text-gray-500"}`}>
                      {i < 3 ? ["🥇","🥈","🥉"][i] : i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate group-hover:text-purple-700 transition">{t.title}</p>
                      <p className="text-[10px] text-gray-400">{fmtNum(t.totalStreams)} streams</p>
                    </div>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  </button>
                ))}
                {allTracks.filter(t => t.isTrending).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Belum ada trending track</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-gray-100 p-5" style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
              <h2 className="font-extrabold text-gray-900 text-sm mb-4">Recent Activity</h2>
              <div className="flex flex-col gap-3">
                {[
                  { msg: selectedTrack ? `"${selectedTrack.title}" sedang trending` : "Streaming analytics diperbarui", time: "2 min ago",  icon: "📈" },
                  { msg: `${fmtNum(currentStats.totalStreams)} total streams`, time: "15 min ago", icon: "🎵" },
                  { msg: `Revenue ${fmtRp(currentStats.revenue)}`, time: "1 jam ago",  icon: "💰" },
                  { msg: `${fmtNum(currentStats.saves)} saves ditambahkan`, time: "3 jam ago",  icon: "❤️" },
                  { msg: `${fmtNum(currentStats.monthlyListeners)} monthly listeners`, time: "6 jam ago",  icon: "👥" },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 transition">
                    <span className="text-base flex-shrink-0 mt-0.5">{act.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-700 font-medium leading-snug">{act.msg}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 pt-6 border-t border-gray-100 mt-6">
            © 2025 BREAKOUT Music Distribution · Analytics Streaming · Data diperbarui setiap hari
          </div>
        </div>{/* end right col */}
      </div>{/* end main layout */}
    </div>
  );
}
