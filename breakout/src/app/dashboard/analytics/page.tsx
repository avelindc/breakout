"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { TrendingUp, Users, DollarSign, Bookmark, Music, ChevronDown } from "lucide-react";

// ─── Dummy Data ───────────────────────────────────────────────────────────────
const streamsData = [
  { date: "May 28", streams: 18000 },
  { date: "Jun 1",  streams: 24000 },
  { date: "Jun 5",  streams: 21000 },
  { date: "Jun 9",  streams: 30000 },
  { date: "Jun 13", streams: 27000 },
  { date: "Jun 17", streams: 38340 },
  { date: "Jun 21", streams: 33000 },
  { date: "Jun 27", streams: 31000 },
];

const revenueData = [
  { month: "Jan", revenue: 1200000 },
  { month: "Feb", revenue: 1900000 },
  { month: "Mar", revenue: 1500000 },
  { month: "Apr", revenue: 2100000 },
  { month: "May", revenue: 2800000 },
  { month: "Jun", revenue: 3200000 },
];

const platformData = [
  { name: "Spotify",       value: 62.3, color: "#7C5CFF" },
  { name: "Apple Music",   value: 18.7, color: "#BFA7FF" },
  { name: "YouTube Music", value: 9.8,  color: "#45D7FF" },
  { name: "TikTok",        value: 5.6,  color: "#E8DEFF" },
  { name: "Deezer",        value: 3.6,  color: "#C4B5FD" },
];

const topTracks = [
  { rank: 1, title: "Bintang Terang",   streams: 234560 },
  { rank: 2, title: "Langit Biru",      streams: 189340 },
  { rank: 3, title: "Mimpi Indah",      streams: 156780 },
  { rank: 4, title: "Kisah Kita",       streams: 112890 },
  { rank: 5, title: "Waktu Bersama",    streams: 89450  },
];

const audienceLocations = [
  { country: "Indonesia",     flag: "🇮🇩", pct: 68.4 },
  { country: "Malaysia",      flag: "🇲🇾", pct: 12.7 },
  { country: "Singapore",     flag: "🇸🇬", pct: 7.2  },
  { country: "United States", flag: "🇺🇸", pct: 4.1  },
  { country: "Thailand",      flag: "🇹🇭", pct: 3.2  },
];

const ageData = [
  { age: "18-24", pct: 34 },
  { age: "25-34", pct: 41 },
  { age: "35-44", pct: 15 },
  { age: "45-54", pct: 7  },
  { age: "55+",   pct: 3  },
];

const genderData = [
  { name: "Male",   value: 62, color: "#7C5CFF" },
  { name: "Female", value: 38, color: "#BFA7FF" },
];

const statsCards = [
  {
    label: "Total Streams",
    value: "856.4K",
    change: "+23.0%",
    sub: "vs Apr 28 – May 27, 2025",
    icon: TrendingUp,
    iconBg: "#EDE9FF",
    iconColor: "#7C5CFF",
  },
  {
    label: "Monthly Listeners",
    value: "128.7K",
    change: "+18.2%",
    sub: "vs Apr 28 – May 27, 2025",
    icon: Users,
    iconBg: "#E5F9FF",
    iconColor: "#45D7FF",
  },
  {
    label: "Total Revenue",
    value: "Rp 56.1M",
    change: "+31.4%",
    sub: "vs Apr 28 – May 27, 2025",
    icon: DollarSign,
    iconBg: "#EDE9FF",
    iconColor: "#7C5CFF",
  },
  {
    label: "Saves Added",
    value: "24.6K",
    change: "+15.7%",
    sub: "vs Apr 29 – May 27, 2025",
    icon: Bookmark,
    iconBg: "#E5F9FF",
    iconColor: "#45D7FF",
  },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-purple-100 rounded-2xl px-4 py-3 shadow-lg">
        <p className="text-xs text-[#70758F] font-medium mb-1">{label}</p>
        <p className="text-base font-bold text-[#7C5CFF]">
          {payload[0].value.toLocaleString()} Streams
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const [period] = useState("Daily");

  return (
    <div className="animate-fade-in w-full pb-16" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "#1E1E2E" }}>
            Analytics Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: "#70758F" }}>
            Track your music performance and audience insights
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-white border border-purple-100 px-4 py-2 rounded-full shadow-sm"
          style={{ color: "#70758F" }}>
          <span className="font-medium">May 28 – Jun 27, 2025</span>
        </div>
      </div>

      {/* ── 4 Stat Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label}
              className="bg-white rounded-[24px] p-6 border border-purple-50 flex flex-col gap-3 hover:shadow-[0_4px_24px_rgba(124,92,255,0.12)] transition-shadow"
              style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#70758F" }}>
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold mt-1" style={{ color: "#1E1E2E" }}>{card.value}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: card.iconBg }}>
                  <Icon className="w-5 h-5" style={{ color: card.iconColor }} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                  {card.change}
                </span>
                <span className="text-xs" style={{ color: "#70758F" }}>{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Streams Over Time  +  Top Platforms ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

        {/* Streams Over Time */}
        <div className="xl:col-span-2 bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold text-base" style={{ color: "#1E1E2E" }}>Streams Over Time</h2>
            <button className="flex items-center gap-1 text-xs font-semibold bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full hover:bg-purple-100 transition"
              style={{ color: "#70758F" }}>
              {period} <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={streamsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C5CFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: "#70758F", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "#70758F", fontSize: 11 }}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : String(v)} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="streams" stroke="#7C5CFF" strokeWidth={2.5}
                  fillOpacity={1} fill="url(#sg)" dot={false}
                  activeDot={{ r: 6, fill: "#7C5CFF", stroke: "#fff", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Platforms */}
        <div className="bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <h2 className="font-bold text-base mb-6" style={{ color: "#1E1E2E" }}>Top Platforms</h2>
          <div className="flex flex-col items-center">
            <div className="h-44 w-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={platformData} cx="50%" cy="50%"
                    innerRadius={52} outerRadius={80} paddingAngle={3}
                    dataKey="value" strokeWidth={0}>
                    {platformData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 w-full flex flex-col gap-2.5">
              {platformData.map((p) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-xs font-medium" style={{ color: "#1E1E2E" }}>{p.name}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#70758F" }}>{p.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Tracks + Audience Locations + Audience Demographics ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Top Tracks */}
        <div className="bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1E1E2E" }}>Top Tracks</h2>
            <button className="text-xs font-semibold hover:underline" style={{ color: "#7C5CFF" }}>View all</button>
          </div>
          {/* Header row */}
          <div className="grid grid-cols-[24px_1fr_auto] gap-x-3 text-[10px] font-bold uppercase tracking-widest mb-2 px-1"
            style={{ color: "#70758F" }}>
            <span>#</span><span>Track</span><span>Streams</span>
          </div>
          <div className="flex flex-col gap-1">
            {topTracks.map((track) => (
              <div key={track.rank}
                className="grid grid-cols-[24px_1fr_auto] gap-x-3 items-center rounded-xl px-1 py-2 hover:bg-purple-50 transition-colors">
                <span className="text-xs font-bold" style={{ color: "#70758F" }}>{track.rank}</span>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg,#BFA7FF,#7C5CFF)" }}>
                    <Music className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold truncate" style={{ color: "#1E1E2E" }}>
                    {track.title}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: "#7C5CFF" }}>
                  {track.streams.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Locations */}
        <div className="bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1E1E2E" }}>Audience Locations</h2>
            <button className="text-xs font-semibold hover:underline" style={{ color: "#7C5CFF" }}>View all</button>
          </div>
          <div className="flex flex-col gap-4">
            {audienceLocations.map((loc) => (
              <div key={loc.country} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{loc.flag}</span>
                    <span className="text-sm font-medium" style={{ color: "#1E1E2E" }}>{loc.country}</span>
                  </div>
                  <span className="text-xs font-bold" style={{ color: "#70758F" }}>{loc.pct}%</span>
                </div>
                <div className="w-full bg-purple-50 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-700"
                    style={{ width: `${loc.pct}%`, background: "linear-gradient(90deg,#7C5CFF,#BFA7FF)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-base" style={{ color: "#1E1E2E" }}>Audience Demographics</h2>
            <button className="text-xs font-semibold hover:underline" style={{ color: "#7C5CFF" }}>View all</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Gender */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#70758F" }}>Gender</p>
              <div className="flex justify-center mb-3">
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%"
                        innerRadius={28} outerRadius={44} dataKey="value"
                        strokeWidth={0} paddingAngle={2}>
                        {genderData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {genderData.map((g) => (
                  <div key={g.name} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                    <span className="text-xs" style={{ color: "#70758F" }}>{g.name}</span>
                    <span className="text-xs font-bold ml-auto" style={{ color: "#1E1E2E" }}>{g.value}%</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Age Range */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#70758F" }}>Age Range</p>
              <div className="flex flex-col gap-2.5">
                {ageData.map((a) => (
                  <div key={a.age} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs" style={{ color: "#70758F" }}>{a.age}</span>
                      <span className="text-xs font-bold" style={{ color: "#1E1E2E" }}>{a.pct}%</span>
                    </div>
                    <div className="w-full bg-purple-50 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full" style={{ width: `${a.pct}%`, background: "#7C5CFF" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Revenue Chart + Extra Stats ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue Chart */}
        <div className="xl:col-span-2 bg-white rounded-[24px] p-6 border border-purple-50"
          style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
          <h2 className="font-bold text-base mb-6" style={{ color: "#1E1E2E" }}>Revenue Chart</h2>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="rg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#7C5CFF" />
                    <stop offset="100%" stopColor="#BFA7FF" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0FF" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false}
                  tick={{ fill: "#70758F", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: "#70758F", fontSize: 11 }}
                  tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 4px 20px rgba(124,92,255,0.15)" }}
                  formatter={(v: number) => [`Rp ${(v/1000000).toFixed(1)}M`, "Revenue"]}
                  cursor={{ fill: "rgba(124,92,255,0.05)" }}
                />
                <Bar dataKey="revenue" fill="url(#rg)" radius={[8,8,4,4]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Extra Stats */}
        <div className="flex flex-col gap-4">
          {[
            { label: "Playlist Adds",          value: "12,450", icon: "🎵", change: "+8.3%"  },
            { label: "Saves",                  value: "24,610", icon: "❤️",  change: "+15.7%" },
            { label: "Shares",                 value: "8,920",  icon: "🔗", change: "+22.1%" },
            { label: "Avg Streams / Listener", value: "6.65",   icon: "📊", change: "+4.2%"  },
          ].map((item) => (
            <div key={item.label}
              className="bg-white rounded-[20px] px-5 py-4 border border-purple-50 flex items-center justify-between hover:shadow-[0_4px_24px_rgba(124,92,255,0.12)] transition-shadow"
              style={{ boxShadow: "0 2px 16px rgba(124,92,255,0.06)" }}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#70758F" }}>{item.label}</p>
                  <p className="text-lg font-bold" style={{ color: "#1E1E2E" }}>{item.value}</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                {item.change}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-xs" style={{ color: "#70758F" }}>
        © 2025 BreakoutID Distribution. All rights reserved. · Made with 💜 for independent artists
      </div>
    </div>
  );
}
