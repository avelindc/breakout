"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Music, DollarSign } from "lucide-react";

export default function AdminAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const revenueData = [
    { month: 'Jan', revenue: 4000, streams: 2400 },
    { month: 'Feb', revenue: 3000, streams: 1398 },
    { month: 'Mar', revenue: 2000, streams: 9800 },
    { month: 'Apr', revenue: 2780, streams: 3908 },
    { month: 'May', revenue: 1890, streams: 4800 },
    { month: 'Jun', revenue: 2390, streams: 3800 },
    { month: 'Jul', revenue: 3490, streams: 4300 },
  ];

  const platformData = [
    { name: 'Spotify', value: 45 },
    { name: 'Apple Music', value: 25 },
    { name: 'YouTube', value: 15 },
    { name: 'TikTok', value: 10 },
    { name: 'Lainnya', value: 5 },
  ];

  const COLORS = ['#1DB954', '#FA243C', '#FF0000', '#000000', '#8884d8'];

  if (!mounted) return null;

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform Analytics</h1>
          <p className="text-gray-500">Overview of platform performance and revenue streams.</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Streams</p>
            <h3 className="text-2xl font-bold text-gray-900">1.2M</h3>
            <p className="text-green-500 text-xs font-semibold mt-1">+12.5% dari bulan lalu</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Gross Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">Rp 24.500.000</h3>
            <p className="text-green-500 text-xs font-semibold mt-1">+8.2% dari bulan lalu</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Active Tracks</p>
            <h3 className="text-2xl font-bold text-gray-900">842</h3>
            <p className="text-green-500 text-xs font-semibold mt-1">+45 rilis baru</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Active Artists</p>
            <h3 className="text-2xl font-bold text-gray-900">156</h3>
            <p className="text-green-500 text-xs font-semibold mt-1">+12 artis baru</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue Overview</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Platform Share</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={platformData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {platformData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Share']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
