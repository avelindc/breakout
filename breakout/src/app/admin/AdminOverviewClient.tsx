"use client";

import { useState } from "react";
import Link from "next/link";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, ArrowDownRight, Search, Plus, MoreHorizontal, Users, Music, Settings, DollarSign } from "lucide-react";

type OverviewData = {
  totalArtists: number;
  pendingArtists: number;
  totalReleases: number;
  pendingReleases: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  recentWithdrawals: any[];
  recentArtists: any[];
};

export function AdminOverviewClient({ data }: { data: OverviewData }) {
    const [currency, setCurrency] = useState<"IDR" | "USD">("IDR");
  const exchangeRate = 16200;

  const formatCurrency = (amount: number) => {
    if (currency === "USD") {
      return '$' + (amount / exchangeRate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (amount >= 1000000) return 'Rp ' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return 'Rp ' + (amount / 1000).toFixed(1) + 'K';
    return 'Rp ' + amount.toLocaleString('id-ID');
  };

  const revenueData = [
    { month: 'MAY', value: 1200 },
    { month: 'JUN', value: 2100 },
    { month: 'JUL', value: 4500, selected: true },
    { month: 'AUG', value: 3100 },
    { month: 'SEP', value: 2800 },
  ];

  const healthData = [
    { name: '1', value: 40 },
    { name: '2', value: 30 },
    { name: '3', value: 50 },
    { name: '4', value: 45 },
    { name: '5', value: 70 },
    { name: '6', value: 85 },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium text-slate-800">BreakoutFlow</h1>
              <p className="text-slate-500 text-sm">Start managing your platform</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-700 bg-white/40 px-4 py-2 rounded-full backdrop-blur-md">
              **** 4168 &nbsp;&nbsp;&nbsp; 01/29
            </div>
          </div>

          {/* Total Balance Card (Interconnected Circles) */}
          <div className="fundflow-glass rounded-[2rem] p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-600 font-medium mb-1">Total platform revenue</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-slate-800 mt-2 pt-1">{formatCurrency(data.totalRevenue)}</h2>
              </div>
              <div className="flex bg-white/50 backdrop-blur-md rounded-full p-1 border border-white/60 shadow-sm">
                <button onClick={() => setCurrency('IDR')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${currency === 'IDR' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>IDR</button>
                <button onClick={() => setCurrency('USD')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${currency === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>USD</button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 mt-12 mb-4 gap-8 md:gap-0">
              <div className="flex items-center">
                {/* Circle 1 */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-white/80 backdrop-blur-lg flex flex-col items-center justify-center border border-white shadow-sm z-20 relative">
                  <span className="text-[11px] sm:text-sm md:text-lg font-bold">{formatCurrency(data.totalRevenue - data.pendingWithdrawals)}</span>
                  <span className="text-[9px] sm:text-xs text-slate-500 font-medium">Available</span>
                </div>
                {/* Circle 2 (Main) */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex flex-col items-center justify-center shadow-lg z-30 -ml-4 sm:-ml-6 md:-ml-10 relative">
                  <span className="text-[13px] sm:text-base md:text-xl font-bold text-white">{formatCurrency(data.totalRevenue)}</span>
                  <span className="text-[10px] sm:text-xs text-white/80 font-medium">Total</span>
                </div>
                {/* Circle 3 */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-white/80 backdrop-blur-lg flex flex-col items-center justify-center border border-white shadow-sm z-20 -ml-4 sm:-ml-6 md:-ml-10 relative">
                  <span className="text-[11px] sm:text-sm md:text-lg font-bold text-slate-800">{formatCurrency(data.pendingWithdrawals)}</span>
                  <span className="text-[9px] sm:text-xs text-slate-500 font-medium">Pending WD</span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-center flex-wrap">
                <Link href="/admin/releases" className="px-6 py-3 rounded-full bg-white/60 backdrop-blur border border-white text-slate-800 font-medium shadow-sm hover:bg-white transition text-sm text-center">
                  Review Releases
                </Link>
                <Link href="/admin/withdrawals" className="px-6 py-3 rounded-full bg-slate-900 text-white font-medium shadow-lg hover:bg-slate-800 transition text-sm text-center">
                  Process Withdrawals
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Statistic */}
            <div className="fundflow-glass rounded-[2rem] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-600 font-medium">Platform Growth</p>
                <span className="bg-white/60 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 border border-white">Monthly</span>
              </div>
              <div className="h-40 w-full mt-auto relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={36}>
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.selected ? 'url(#barGrad)' : 'rgba(255,255,255,0.6)'} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
                {/* Floating tooltip simulation for the selected bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                  $45k
                </div>
              </div>
            </div>

            {/* Financial Health */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-[2rem] p-6 text-white flex flex-col relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white/20 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <p className="font-medium text-white/90">Artist Approval Rate</p>
                <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-4xl font-semibold mb-1">85%</h3>
                <p className="text-white/70 text-xs">since last month</p>
              </div>
              <div className="h-24 w-full mt-auto relative z-10 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Upcoming Payments (Pending Actions) */}
          <div className="fundflow-glass rounded-[2rem] p-6 mb-4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-800 font-medium">Pending Actions</p>
              <button className="bg-slate-900 text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-slate-800 transition">View All</button>
            </div>
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-center flex-wrap">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/40 border border-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Users className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 text-sm">Artist Registrations</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Today</span>
                  <span className="text-slate-500 text-sm w-24">Approvals</span>
                  <span className="font-semibold text-slate-800">{data.pendingArtists}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/20 hover:bg-white/40 transition border border-transparent hover:border-white/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600"><Music className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 text-sm">Release Reviews</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs w-12">Jun 23</span>
                  <span className="text-slate-500 text-sm w-24">Review</span>
                  <span className="font-semibold text-slate-800">{data.pendingReleases}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/20 hover:bg-white/40 transition border border-transparent hover:border-white/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Settings className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-700 text-sm">Pending Withdrawals</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs w-12">Jul 15</span>
                  <span className="text-slate-500 text-sm w-24">Finance</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(data.pendingWithdrawals)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          <div className="flex justify-between items-center h-[72px]">
            <h2 className="text-xl font-medium text-slate-800">Recent Updates</h2>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white/50 backdrop-blur flex items-center justify-center text-slate-600 hover:bg-white border border-white/60 transition"><Search className="w-4 h-4" /></button>
              <button className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-slate-800 transition">View All</button>
            </div>
          </div>

          <div className="flex-1 fundflow-glass rounded-[2rem] p-6 flex flex-col gap-4">
            <p className="text-slate-400 text-xs font-medium mb-2">Latest registrations</p>
            
            {data.recentArtists.map((artist, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden"><img src={artist.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.name}`} className="w-full h-full object-cover" /></div>
                  <span className="text-slate-700 font-medium text-sm group-hover:text-blue-600 transition">{artist.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">Today</span>
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">New</span>
                </div>
              </div>
            ))}

            <div className="w-full h-px bg-white/40 my-2"></div>
            
            <p className="text-slate-400 text-xs font-medium mb-2">Recent Withdrawals</p>
            {data.recentWithdrawals.map((wd, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><DollarSign className="w-4 h-4" /></div>
                  <span className="text-slate-700 font-medium text-sm truncate w-24 group-hover:text-blue-600 transition">{wd.user.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs">Jun 14</span>
                  <span className="text-slate-800 font-semibold text-sm">{formatCurrency(wd.amount)}</span>
                </div>
              </div>
            ))}
            
            <div className="mt-auto pt-6 border-t border-white/40">
              <h4 className="text-slate-800 font-medium mb-1">How to reduce expenses by 25%?</h4>
              <p className="text-slate-500 text-xs mb-2">View these useful tips to save your money.</p>
              <a href="#" className="text-blue-600 text-xs font-semibold hover:underline">Learn more</a>
            </div>
          </div>

          <div className="fundflow-glass rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-800 font-medium">Quick action</p>
              <div className="flex gap-4 text-xs font-medium">
                <span className="text-blue-600">All</span>
                <span className="text-slate-400">Artists</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-8">
              <button className="w-12 h-12 rounded-full border border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-500 hover:border-blue-500 hover:text-blue-500 transition gap-1">
                <Plus className="w-5 h-5" />
              </button>
              {data.recentArtists.slice(0,3).map((artist, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
                     <img src={artist.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.name}`} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 truncate w-12 text-center">{artist.name.split(' ')[0]}</span>
                </div>
              ))}
              <button className="w-12 h-12 rounded-full bg-white/50 border border-white flex items-center justify-center shadow-sm">
                <MoreHorizontal className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <h3 className="text-3xl font-semibold text-slate-800">Payouts</h3>
              <button className="bg-slate-900 text-white font-medium px-6 py-2.5 rounded-full hover:bg-slate-800 transition shadow-lg">Process</button>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
