"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { PieChart as PieChartIcon } from "lucide-react";

const trafficData = [
  { name: 'Direct', value: 45, color: '#ec4899' },
  { name: 'Search', value: 24, color: '#8b5cf6' },
  { name: 'Social', value: 12, color: '#3b82f6' },
  { name: 'Referrals', value: 19, color: '#06b6d4' },
];

const shareData = [
  { name: 'Spotify', value: 55, color: '#ec4899' },
  { name: 'Apple Music', value: 25, color: '#8b5cf6' },
  { name: 'YouTube', value: 15, color: '#3b82f6' },
  { name: 'TikTok', value: 5, color: '#06b6d4' },
];

export function TrafficSourcesChart({ hasData = true }: { hasData?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, []);
  if (!mounted) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full relative min-h-[250px]">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Traffic Sources</h2>
      {!hasData ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pt-8">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <PieChartIcon className="w-6 h-6 text-gray-300" />
          </div>
          <p className="font-medium text-sm text-gray-500">No traffic data yet</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center">
          <div className="w-1/2 flex flex-col justify-center gap-4">
            {trafficData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-500 font-medium">{item.name}</span>
                <span className="text-sm text-gray-900 font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
          <div className="w-1/2 h-48 relative">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={trafficData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-blue-500">12%</span>
              <span className="text-xs text-gray-400 font-medium">Direct</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ShareOfVoiceChart({ hasData = true }: { hasData?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setChartKey(prev => prev + 1);
    }, 150);
    return () => clearTimeout(timer);
  }, []);
  if (!mounted) return null;

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full relative min-h-[250px]">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Share of voice</h2>
      {!hasData ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 pt-8">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <PieChartIcon className="w-6 h-6 text-gray-300" />
          </div>
          <p className="font-medium text-sm text-gray-500">No share data yet</p>
        </div>
      ) : (
        <div className="flex flex-1 items-center">
          <div className="w-1/2 flex flex-col justify-center gap-4">
            {shareData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-gray-500 font-medium">{item.name}</span>
                <span className="text-sm text-gray-900 font-bold ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
          <div className="w-1/2 h-48 relative">
            <ResponsiveContainer key={chartKey} width="100%" height="100%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={shareData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {shareData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-purple-500">35%</span>
              <span className="text-xs text-gray-400 font-medium">Spotify</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
