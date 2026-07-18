"use client";

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Cell as PieCell } from 'recharts';

export function RoyaltyBarChart({ data }: { data: { name: string; revenue: number }[] }) {
  if (data.length === 0) return <div className="h-40 flex items-center justify-center text-gray-500 text-sm">No data</div>;

  return (
    <div className="h-40 w-full mt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f000ff" stopOpacity={0.9}/>
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0.9}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} dy={5} />
          <Tooltip 
            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }} 
            contentStyle={{ backgroundColor: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Revenue']}
            labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
          />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="url(#colorRevenue)" className="hover:brightness-125 transition-all duration-300" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RoyaltyDonutChart({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (data.every(d => d.value === 0)) {
    return <div className="h-32 flex items-center justify-center text-gray-500 text-sm mt-4">No stream data</div>;
  }

  return (
    <div className="h-[140px] w-full flex items-center justify-center relative mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(10,10,12,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} 
            itemStyle={{ color: '#fff', fontWeight: 'bold' }}
            formatter={(value: number) => [value.toLocaleString('id-ID'), 'Streams']}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <PieCell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}80)` }} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
        <span className="text-white font-black text-xs">Total</span>
        <span className="text-gray-400 font-bold text-[10px]">100%</span>
      </div>
    </div>
  );
}
