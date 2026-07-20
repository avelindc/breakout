"use client";

import { useState, useMemo } from "react";
import { Search, FileText, X, Music, User, Clock, CheckCircle2 } from "lucide-react";

interface RoyaltyPerSong {
  id: string;
  artistId: string;
  artist: { id: string, stageName: string };
  trackId: string | null;
  track: { id: string, isrc: string | null, release: { releaseDate: Date } } | null;
  songName: string;
  platform: string;
  revenue: number;
  currency: string;
  month: number;
  year: number;
  status: string;
  createdAt: Date;
}

export function UserRoyaltyPerSongClient({ data }: { data: RoyaltyPerSong[] }) {
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.songName.toLowerCase().includes(search.toLowerCase());
      const matchMonth = monthFilter === "ALL" || item.month.toString() === monthFilter;
      const matchYear = yearFilter === "ALL" || item.year.toString() === yearFilter;
      return matchSearch && matchMonth && matchYear;
    });
  }, [data, search, monthFilter, yearFilter]);

  // Group by songName for the main view
  const groupedBySong = useMemo(() => {
    const map = new Map<string, {
      songName: string;
      artistName: string;
      totalRevenueUSD: number;
      totalRevenueIDR: number;
      entries: RoyaltyPerSong[];
      trackInfo: any;
    }>();
    
    for (const item of filteredData) {
      if (!map.has(item.songName)) {
        map.set(item.songName, {
          songName: item.songName,
          artistName: item.artist.stageName,
          totalRevenueUSD: 0,
          totalRevenueIDR: 0,
          entries: [],
          trackInfo: item.track
        });
      }
      const g = map.get(item.songName)!;
      g.entries.push(item);
      if (item.currency === "USD") g.totalRevenueUSD += item.revenue;
      else if (item.currency === "IDR") g.totalRevenueIDR += item.revenue;
      else g.totalRevenueUSD += item.revenue; // Fallback
    }
    return Array.from(map.values());
  }, [filteredData]);

  const selectedGroup = groupedBySong.find(g => g.songName === selectedSong);

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative flex-1 md:w-64 w-full">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search song name..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[120px]">
            <option value="ALL">All Months</option>
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en-US', {month:'short'})}</option>
            ))}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm bg-white min-w-[120px]">
            <option value="ALL">All Years</option>
            {[2023, 2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groupedBySong.map(group => (
          <div 
            key={group.songName} 
            onClick={() => setSelectedSong(group.songName)}
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between h-full"
          >
            <div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg line-clamp-1 group-hover:text-blue-600 transition-colors">{group.songName}</h3>
              <p className="text-gray-500 text-sm font-medium mt-1 flex items-center gap-1.5"><User className="w-4 h-4"/> {group.artistName}</p>
            </div>
            
            <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total USD</p>
                <p className="font-bold text-green-600">${group.totalRevenueUSD.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total IDR</p>
                <p className="font-bold text-blue-600">Rp {group.totalRevenueIDR.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        ))}
        {groupedBySong.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">No royalty records found.</p>
            <p className="text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <div>
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <Music className="w-6 h-6 text-blue-300" />
                  {selectedGroup.songName}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-blue-100">
                  <span className="flex items-center gap-1"><User className="w-4 h-4"/> {selectedGroup.artistName}</span>
                  {selectedGroup.trackInfo?.isrc && <span className="font-mono bg-white/20 px-2 py-0.5 rounded border border-white/10">ISRC: {selectedGroup.trackInfo.isrc}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedSong(null)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> Platform Breakdown
                </h3>
                <div className="flex gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-200 text-sm font-bold">
                  <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg">
                    ${selectedGroup.totalRevenueUSD.toFixed(2)}
                  </div>
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg">
                    Rp {selectedGroup.totalRevenueIDR.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="p-4 font-bold text-gray-500">Platform</th>
                        <th className="p-4 font-bold text-gray-500">Period</th>
                        <th className="p-4 font-bold text-gray-500 text-right">Revenue</th>
                        <th className="p-4 font-bold text-gray-500 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedGroup.entries.sort((a,b) => b.year - a.year || b.month - a.month).map(entry => (
                        <tr key={entry.id} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-4 font-bold text-gray-900">{entry.platform}</td>
                          <td className="p-4 text-gray-500 font-medium">
                            {new Date(entry.year, entry.month - 1).toLocaleString('en-US', {month:'short', year:'numeric'})}
                          </td>
                          <td className="p-4 font-mono font-bold text-right text-gray-700">
                            {entry.currency === 'USD' ? '$' : 'Rp '}
                            {entry.currency === 'USD' ? entry.revenue.toFixed(2) : entry.revenue.toLocaleString('id-ID')}
                          </td>
                          <td className="p-4 text-right">
                            <span className="inline-flex items-center justify-center bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border border-green-100">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
