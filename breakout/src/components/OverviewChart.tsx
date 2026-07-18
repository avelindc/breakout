"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { LineChart as LineChartIcon } from "lucide-react";

export function OverviewChart({ hasData = true }: { hasData?: boolean }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const data = [
    { name: 'Jan', revenue: 4000, streams: 2400 },
    { name: 'Feb', revenue: 3000, streams: 1398 },
    { name: 'Mar', revenue: 2000, streams: 9800 },
    { name: 'Apr', revenue: 2780, streams: 3908 },
    { name: 'May', revenue: 1890, streams: 4800 },
    { name: 'Jun', revenue: 2390, streams: 3800 },
    { name: 'Jul', revenue: 3490, streams: 4300 },
  ];

  if (!mounted) return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Project statistics</h2>
      </div>
      <div className="flex-1 w-full h-[200px] md:h-[260px] bg-gray-50 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <div className="bg-white p-4 md:p-6 rounded-3xl border border-gray-100 shadow-sm h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 shrink-0">Project statistics</h2>
        {hasData && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            <button className="px-3 py-1.5 bg-blue-500 text-white text-xs font-semibold rounded-full whitespace-nowrap shrink-0">30 days</button>
            <button className="px-3 py-1.5 text-gray-400 text-xs font-semibold rounded-full hover:bg-gray-50 whitespace-nowrap shrink-0">90 days</button>
            <button className="px-3 py-1.5 text-gray-400 text-xs font-semibold rounded-full hover:bg-gray-50 whitespace-nowrap shrink-0">6 months</button>
            <button className="px-3 py-1.5 text-gray-400 text-xs font-semibold rounded-full hover:bg-gray-50 whitespace-nowrap shrink-0">12 months</button>
          </div>
        )}
      </div>
      <div className="flex-1 w-full h-[200px] sm:h-[240px] md:h-[300px] relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <LineChartIcon className="w-8 h-8 text-gray-300" />
            </div>
            <p className="font-medium text-gray-500">No stream data available yet</p>
            <p className="text-xs mt-1">Upload music and start earning streams to see your stats here.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#cbd5e1" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff', padding: '12px 16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="streams" stroke="#7c3aed" strokeWidth={4} fillOpacity={1} fill="url(#colorBlue)" name="Visitors" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
