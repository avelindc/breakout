"use client";

import { useState } from "react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, Music, Clock, DollarSign, Search, Plus, MoreHorizontal, Users, Settings } from "lucide-react";

type OverviewData = {
  totalReleases: number;
  pendingReleases: number;
  totalRevenue: number;
  availableBalance: number;
  totalStreams: number;
  recentWithdrawals: any[];
};

export function UserOverviewClient({ data, user }: { data: OverviewData, user: any }) {
  const [activeTab, setActiveTab] = useState("IDR");

  const revenueData = [
    { month: 'MAY', value: 200 },
    { month: 'JUN', value: 400 },
    { month: 'JUL', value: 850, selected: true },
    { month: 'AUG', value: 600 },
    { month: 'SEP', value: 500 },
  ];

  const healthData = [
    { name: '1', value: 10 },
    { name: '2', value: 30 },
    { name: '3', value: 20 },
    { name: '4', value: 50 },
    { name: '5', value: 40 },
    { name: '6', value: 80 },
  ];

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-medium text-white">ArtistFlow</h1>
              <p className="text-slate-400 text-sm">Start managing your music business</p>
            </div>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-200 bg-white/5 px-4 py-2 rounded-full backdrop-blur-md">
              {user.name} &nbsp;&nbsp;
              <div className="w-6 h-6 rounded-full overflow-hidden border border-white">
                <img src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* Total Balance Card (Interconnected Circles) */}
          <div className="fundflow-glass rounded-[2rem] p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-slate-300 font-medium mb-1">Total artist balance</p>
                <h2 className="text-4xl md:text-5xl font-semibold text-white">
                  Rp {data.availableBalance >= 1000000 ? (data.availableBalance / 1000000).toFixed(1) + 'M' : data.availableBalance >= 1000 ? (data.availableBalance / 1000).toFixed(1) + 'K' : data.availableBalance}
                </h2>
              </div>
              <div className="flex bg-white/10 backdrop-blur-md rounded-full p-1 border border-white/20 shadow-sm">
                <button className="px-4 py-1.5 rounded-full bg-white shadow-sm text-sm font-medium">IDR</button>
                <button className="px-4 py-1.5 rounded-full text-slate-400 text-sm font-medium">USD</button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10 mt-12 mb-4 gap-8 md:gap-0">
              <div className="flex items-center">
                {/* Circle 1 */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-lg flex flex-col items-center justify-center border border-white/20 shadow-sm z-20 relative">
                  <span className="text-[11px] sm:text-sm md:text-lg font-bold">
                    Rp {data.totalRevenue >= 1000000 ? (data.totalRevenue / 1000000).toFixed(1) + 'M' : data.totalRevenue.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[9px] sm:text-xs text-slate-400 font-medium">Total Earned</span>
                </div>
                {/* Circle 2 (Main) */}
                <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 flex flex-col items-center justify-center shadow-lg z-30 -ml-4 sm:-ml-6 md:-ml-10 relative">
                  <span className="text-[13px] sm:text-base md:text-xl font-bold text-white">
                    Rp {data.availableBalance >= 1000000 ? (data.availableBalance / 1000000).toFixed(1) + 'M' : data.availableBalance.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/80 font-medium">Available</span>
                </div>
              </div>
              
              <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-center">
                <button className="px-6 py-3 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white font-medium shadow-sm hover:bg-white hover:text-slate-900 transition text-sm">
                  Upload Release
                </button>
                <button className="px-6 py-3 rounded-full bg-white text-slate-900 hover:bg-slate-200 font-medium shadow-lg hover:bg-slate-800 transition text-sm">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Expense Statistic -> Streams Statistic */}
            <div className="fundflow-glass rounded-[2rem] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <p className="text-slate-300 font-medium">Stream Growth</p>
                <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-semibold text-slate-200 border border-white">Monthly</span>
              </div>
              <div className="h-40 w-full mt-auto relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                    <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={36}>
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.selected ? 'url(#barGrad2)' : 'rgba(255,255,255,0.6)'} />
                      ))}
                    </Bar>
                    <defs>
                      <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Financial Health -> Fan Engagement */}
            <div className="bg-gradient-to-br from-indigo-400 to-purple-600 rounded-[2rem] p-6 text-white flex flex-col relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-white/5 rounded-full blur-2xl -translate-y-10 translate-x-10"></div>
              <div className="flex justify-between items-center mb-4 relative z-10">
                <p className="font-medium text-white/90">Fan Engagement</p>
                <div className="bg-white/5 p-1.5 rounded-full backdrop-blur-md">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="relative z-10">
                <h3 className="text-4xl font-semibold mb-1">+24%</h3>
                <p className="text-white/70 text-xs">since last month</p>
              </div>
              <div className="h-24 w-full mt-auto relative z-10 -mx-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={healthData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorHealth2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#ffffff" strokeWidth={2} fillOpacity={1} fill="url(#colorHealth2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Upcoming Payments -> Active Releases */}
          <div className="fundflow-glass rounded-[2rem] p-6 mb-4">
            <div className="flex justify-between items-center mb-6">
              <p className="text-white font-medium">Releases Status</p>
              <button className="bg-white text-slate-900 hover:bg-slate-200 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-slate-800 transition">View All</button>
            </div>
            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-center">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600"><Music className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-200 text-sm">Active Releases</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-cyan-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Live</span>
                  <span className="text-slate-400 text-sm w-24">Catalog</span>
                  <span className="font-semibold text-white">{data.totalReleases}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white hover:text-slate-900/5 transition border border-transparent hover:border-white/20 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600"><Clock className="w-4 h-4" /></div>
                  <span className="font-medium text-slate-200 text-sm">Pending Approval</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-slate-400 text-xs w-12">Review</span>
                  <span className="text-slate-400 text-sm w-24">Processing</span>
                  <span className="font-semibold text-white">{data.pendingReleases}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          
          <div className="flex justify-between items-center h-[72px]">
            <h2 className="text-xl font-medium text-white">Transactions</h2>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-slate-300 hover:bg-white hover:text-slate-900 border border-white/20 transition"><Search className="w-4 h-4" /></button>
              <button className="bg-white text-slate-900 hover:bg-slate-200 text-xs font-semibold px-4 py-2 rounded-full hover:bg-slate-800 transition">View All</button>
            </div>
          </div>

          <div className="flex-1 fundflow-glass rounded-[2rem] p-6 flex flex-col gap-4">
            <p className="text-slate-400 text-xs font-medium mb-2">Latest transfers</p>
            
            {data.recentWithdrawals.map((wd, i) => (
              <div key={i} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><DollarSign className="w-4 h-4" /></div>
                  <span className="text-slate-200 font-medium text-sm group-hover:text-blue-600 transition">Withdrawal</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                    {wd.status === 'PENDING' ? 'Pending' : 'Done'}
                  </span>
                  <span className="text-white font-semibold text-sm">Rp {(wd.amount / 1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
            
            {data.recentWithdrawals.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-sm">
                No recent transactions
              </div>
            )}
            
            <div className="mt-auto pt-6 border-t border-white/10">
              <h4 className="text-white font-medium mb-1">How to increase your streams?</h4>
              <p className="text-slate-400 text-xs mb-2">View these useful tips to promote your music.</p>
              <a href="#" className="text-blue-600 text-xs font-semibold hover:underline">Learn more</a>
            </div>
          </div>

          <div className="fundflow-glass rounded-[2rem] p-6">
            <div className="flex justify-between items-center mb-6">
              <p className="text-white font-medium">Quick actions</p>
              <div className="flex gap-4 text-xs font-medium">
                <span className="text-blue-600">All</span>
                <span className="text-slate-400">Services</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-8">
              <button className="w-12 h-12 rounded-full border border-dashed border-slate-400 flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 transition gap-1">
                <Plus className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-full bg-blue-100 border border-white/20 shadow-sm flex items-center justify-center text-blue-600">
                <Music className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 border border-white/20 shadow-sm flex items-center justify-center text-purple-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <button className="w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-sm">
                <MoreHorizontal className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="flex justify-between items-end">
              <h3 className="text-3xl font-semibold text-white">Rp {(data.availableBalance / 1000).toFixed(0)}K</h3>
              <button className="bg-white text-slate-900 hover:bg-slate-200 font-medium px-6 py-2.5 rounded-full hover:bg-slate-800 transition shadow-lg">Send</button>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
}
