"use client";

import { useState, useMemo } from "react";
import { Search, Filter, Plus, FileText, Download, X, Edit2, Trash2, CheckCircle2, ChevronRight, Music, User, DollarSign } from "lucide-react";
import { addRoyaltyPerSong, updateRoyaltyPerSong, deleteRoyaltyPerSong } from "@/app/actions/royaltyPerSong";
import Link from "next/link";

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

export function AdminRoyaltyPerSongClient({ data, artists }: { data: RoyaltyPerSong[], artists: any[] }) {
  const [list, setList] = useState(data);
  const [selectedSong, setSelectedSong] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [artistFilter, setArtistFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [yearFilter, setYearFilter] = useState("ALL");

  const filteredData = useMemo(() => {
    return list.filter(item => {
      const matchSearch = item.songName.toLowerCase().includes(search.toLowerCase()) || 
                          item.platform.toLowerCase().includes(search.toLowerCase());
      const matchArtist = artistFilter === "ALL" || item.artistId === artistFilter;
      const matchMonth = monthFilter === "ALL" || item.month.toString() === monthFilter;
      const matchYear = yearFilter === "ALL" || item.year.toString() === yearFilter;
      return matchSearch && matchArtist && matchMonth && matchYear;
    });
  }, [list, search, artistFilter, monthFilter, yearFilter]);

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

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    const res = await deleteRoyaltyPerSong(id);
    if (res.error) alert(res.error);
    else {
      setList(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleExportCSV = () => {
    const headers = ["Artist", "Song Name", "Platform", "Revenue", "Currency", "Month", "Year", "Status"];
    const rows = filteredData.map(d => [
      d.artist.stageName,
      d.songName,
      d.platform,
      d.revenue,
      d.currency,
      d.month,
      d.year,
      d.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "royalty_per_song.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search song or platform..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={handleExportCSV} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium text-sm shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <select value={artistFilter} onChange={e => setArtistFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="ALL">All Artists</option>
            {artists.map(a => (
              <option key={a.id} value={a.id}>{a.stageName}</option>
            ))}
          </select>
          <select value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
            <option value="ALL">All Months</option>
            {Array.from({length: 12}).map((_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('en-US', {month:'short'})}</option>
            ))}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
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
            className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{group.songName}</h3>
            <p className="text-gray-500 text-sm font-medium mt-1 flex items-center gap-1.5"><User className="w-4 h-4"/> {group.artistName}</p>
            
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
          <div className="col-span-full py-20 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No royalty records found.</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                  <Music className="w-6 h-6 text-purple-600" />
                  {selectedGroup.songName}
                </h2>
                <div className="flex gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><User className="w-4 h-4"/> {selectedGroup.artistName}</span>
                  {selectedGroup.trackInfo?.isrc && <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">ISRC: {selectedGroup.trackInfo.isrc}</span>}
                </div>
              </div>
              <button onClick={() => setSelectedSong(null)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 hover:bg-gray-100 transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Platform Breakdown</h3>
                <div className="text-sm font-bold bg-green-50 text-green-700 px-4 py-2 rounded-xl">
                  Total: ${selectedGroup.totalRevenueUSD.toFixed(2)} | Rp {selectedGroup.totalRevenueIDR.toLocaleString('id-ID')}
                </div>
              </div>
              
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="p-4 font-bold text-gray-500">Platform</th>
                      <th className="p-4 font-bold text-gray-500">Month/Year</th>
                      <th className="p-4 font-bold text-gray-500">Revenue</th>
                      <th className="p-4 font-bold text-gray-500">Status</th>
                      <th className="p-4 font-bold text-gray-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedGroup.entries.sort((a,b) => b.year - a.year || b.month - a.month).map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="p-4 font-semibold text-gray-900">{entry.platform}</td>
                        <td className="p-4 text-gray-500">{entry.month}/{entry.year}</td>
                        <td className="p-4 font-mono font-bold">
                          {entry.currency === 'USD' ? '$' : 'Rp '}
                          {entry.currency === 'USD' ? entry.revenue.toFixed(2) : entry.revenue.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4">
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase">{entry.status}</span>
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(entry.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
