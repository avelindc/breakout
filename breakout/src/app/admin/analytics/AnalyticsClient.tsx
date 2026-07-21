"use client";

import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Music, DollarSign, Calendar, MoreVertical, CreditCard, ChevronDown } from "lucide-react";

type AnalyticsData = {
  totalStreams: number;
  totalRevenue: number;
  activeTracks: number;
  activeArtists: number;
  revenueData: { month: string; revenue: number }[];
  platformData: { name: string; value: number }[];
};

export default function AdminAnalyticsClient({ data }: { data: AnalyticsData }) {
  const [mounted, setMounted] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const {
    totalStreams,
    totalRevenue,
    activeTracks,
    activeArtists,
    revenueData,
    platformData
  } = data;

  const COLORS = ['#7000FF', '#00F0FF', '#FF0055', '#111111', '#AAAAAA'];

  if (!mounted) return null;

  return (
    <div className="animate-fade-in max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-1">Breakout Analytics</h1>
          <p className="text-gray-500 font-medium">Your platform performance & revenue updates <ChevronDown className="inline w-4 h-4" /></p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <div className="flex -space-x-2">
             <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold">A</div>
             <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold">B</div>
          </div>
          <div className="w-px h-6 bg-gray-200"></div>
          <button className="text-gray-500 hover:text-gray-900 transition"><Calendar className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Card 1 - Highlight (Purple Gradient) */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#7000FF] to-[#4500ea] p-8 text-white shadow-[0_20px_40px_-15px_rgba(112,0,255,0.4)] flex flex-col justify-between min-h-[220px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <button className="text-white/70 hover:text-white"><MoreVertical className="w-5 h-5" /></button>
          </div>
          <div className="relative z-10">
            <p className="text-white/80 font-medium mb-1">Total Streams</p>
            <h3 className="text-4xl font-extrabold tracking-tight">{totalStreams >= 1000000 ? (totalStreams / 1000000).toFixed(1) + 'M' : totalStreams >= 1000 ? (totalStreams / 1000).toFixed(1) + 'K' : totalStreams}</h3>
            <div className="mt-3 inline-flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
              <span className="text-white">+45%</span>
            </div>
          </div>
        </div>

        {/* Card 2 - White Soft */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col justify-between min-h-[220px] relative overflow-hidden group">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-blue-500 rounded-l-full"></div>
          <div className="flex justify-between items-start">
            <div className="bg-blue-50 p-3 rounded-2xl">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="60, 100" />
              </svg>
              <span className="text-[10px] font-bold text-blue-600">+8%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Gross Revenue</p>
            <h3 className="text-2xl font-extrabold text-gray-900">Rp {Math.round(totalRevenue).toLocaleString('id-ID')}</h3>
            <p className="text-gray-400 text-xs font-medium mt-2">Bulan ini</p>
          </div>
        </div>

        {/* Card 3 - White Soft */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-purple-500 rounded-l-full"></div>
          <div className="flex justify-between items-start">
            <div className="bg-purple-50 p-3 rounded-2xl">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#A855F7" strokeWidth="3" strokeDasharray="30, 100" />
              </svg>
              <span className="text-[10px] font-bold text-purple-600">-2%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Active Tracks</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{activeTracks}</h3>
            <p className="text-gray-400 text-xs font-medium mt-2">+45 rilis baru</p>
          </div>
        </div>

        {/* Card 4 - White Soft */}
        <div className="bg-white rounded-[2rem] p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col justify-between min-h-[220px] relative overflow-hidden">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-16 bg-green-500 rounded-l-full"></div>
          <div className="flex justify-between items-start">
            <div className="bg-green-50 p-3 rounded-2xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center relative">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E5E7EB" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22C55E" strokeWidth="3" strokeDasharray="80, 100" />
              </svg>
              <span className="text-[10px] font-bold text-green-600">+12%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-500 font-medium mb-1">Active Artists</p>
            <h3 className="text-3xl font-extrabold text-gray-900">{activeArtists}</h3>
            <p className="text-gray-400 text-xs font-medium mt-2">+12 artis baru</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Bar Chart */}
        <div className="bg-[#fcfdff] rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-gray-100/60 lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-white shadow-sm border border-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700">2026</div>
              <h2 className="text-xl font-extrabold text-gray-900">Revenue Flow</h2>
            </div>
            <button className="text-gray-400 hover:text-gray-900"><MoreVertical className="w-5 h-5" /></button>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={32}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7000FF" />
                    <stop offset="100%" stopColor="#4500ea" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#A1A1AA" 
                  fontSize={13} 
                  fontWeight={600}
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#A1A1AA" 
                  fontSize={12} 
                  fontWeight={500}
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value} 
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 20px', fontWeight: 'bold' }}
                  formatter={(value: any) => [`Rp ${Math.round(Number(value)).toLocaleString('id-ID')}`, 'Revenue']}
                  labelStyle={{ color: '#71717A', marginBottom: '4px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  fill="url(#barGradient)" 
                  radius={[12, 12, 12, 12]} 
                  background={{ fill: '#F3F4F6', radius: 12 }} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Share Pie Chart */}
        <div className="bg-[#fcfdff] rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.03)] border border-gray-100/60 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-extrabold text-gray-900">Platform Share</h2>
            <div className="bg-gray-100 p-2 rounded-xl text-gray-500">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full relative flex items-center justify-center">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={10}
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Share']}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-gray-900">150+</span>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">Platforms</span>
            </div>
          </div>
          
          <div className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2">
            {platformData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span className="text-xs font-bold text-gray-600">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
