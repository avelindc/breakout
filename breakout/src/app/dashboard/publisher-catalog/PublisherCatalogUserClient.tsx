"use client";

import { useState, useEffect } from "react";
import { getPublisherCatalogAction, getPublisherCatalogFiltersAction } from "@/app/actions/publisherCatalog";
import { Search, Loader2, Music, Building, User, X, BookOpen, Hash } from "lucide-react";

export function PublisherCatalogUserClient() {
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publishers, setPublishers] = useState<string[]>([]);
  const [filterPublisher, setFilterPublisher] = useState("");
  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    getPublisherCatalogFiltersAction().then(res => {
      if (res.success) setPublishers(res.publishers || []);
    });
  }, []);

  const fetchSongs = async (p = 1, newSearch = true) => {
    setLoading(true);
    const res = await getPublisherCatalogAction({ page: p, limit: LIMIT, search, publisher: filterPublisher });
    if (res.success && res.songs) {
      setSongs(res.songs);
      setTotal(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchSongs(1); }, 500);
    return () => clearTimeout(t);
  }, [search, filterPublisher]);

  const totalPages = Math.ceil(total / LIMIT);

  const goToPage = (p: number) => { setPage(p); fetchSongs(p); };

  return (
    <div className="space-y-6">
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-blue-200 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Cari judul lagu, artis, ISRC..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-blue-700/50 border border-blue-400/30 rounded-xl outline-none focus:border-white text-white transition placeholder-blue-200"
          />
        </div>
        <select
          value={filterPublisher} onChange={(e) => setFilterPublisher(e.target.value)}
          className="sm:w-56 bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 outline-none focus:border-white text-white transition appearance-none"
        >
          <option value="" className="bg-blue-800">Semua Publisher</option>
          {publishers.map(p => <option key={p} value={p} className="bg-blue-800">{p}</option>)}
        </select>
      </div>

      <div className="text-sm text-gray-400 font-medium">
        Menampilkan {songs.length} dari {total.toLocaleString("id-ID")} lagu
      </div>

      {loading ? (
        <div className="flex justify-center p-16"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>
      ) : songs.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Belum ada katalog</h3>
          <p className="text-gray-400">Admin belum mengimport data publisher catalog.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl">
          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  {["Judul Lagu", "Artis", "Publisher", "Composer", "Album", "ISRC", "UPC", "Tahun"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {songs.map(song => (
                  <tr
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className="hover:bg-white/5 transition cursor-pointer group"
                  >
                    <td className="px-4 py-3 font-semibold text-white group-hover:text-blue-300 transition max-w-[200px] truncate">{song.title || "Unknown"}</td>
                    <td className="px-4 py-3 text-gray-300 text-sm max-w-[140px] truncate">{song.artist || "Unknown"}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-[130px] truncate">{song.publisher || "-"}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-[120px] truncate">{song.composer || "-"}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm max-w-[120px] truncate">{song.album || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{song.isrc || "-"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">{song.upc || "-"}</td>
                    <td className="px-4 py-3 text-gray-400 text-sm">{song.year || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-white/5">
            {songs.map(song => (
              <div key={song.id} onClick={() => setSelectedSong(song)}
                className="p-4 hover:bg-white/5 transition cursor-pointer">
                <h4 className="font-bold text-white truncate">{song.title || "Unknown"}</h4>
                <p className="text-sm text-blue-300 mt-0.5 truncate">{song.artist || "Unknown"}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {song.publisher && <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-300">{song.publisher}</span>}
                  {song.year && <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-gray-300">{song.year}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
          <button disabled={page === 1} onClick={() => goToPage(page - 1)}
            className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-40 hover:bg-white/5 transition">
            ← Sebelumnya
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, page - 2) + i;
            if (p > totalPages) return null;
            return (
              <button key={p} onClick={() => goToPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition ${p === page ? "bg-blue-600 text-white" : "border border-white/20 text-white hover:bg-white/5"}`}>
                {p}
              </button>
            );
          })}

          <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}
            className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm disabled:opacity-40 hover:bg-white/5 transition">
            Selanjutnya →
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12121A] rounded-3xl max-w-md w-full border border-white/10 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedSong.title || "Unknown"}</h2>
                <p className="text-blue-400 font-medium mt-1">{selectedSong.artist || "Unknown"}</p>
              </div>
              <button onClick={() => setSelectedSong(null)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {[
                { label: "Publisher", value: selectedSong.publisher, icon: Building },
                { label: "Composer", value: selectedSong.composer, icon: User },
                { label: "Album", value: selectedSong.album, icon: Music },
                { label: "Tahun", value: selectedSong.year, icon: Hash },
                { label: "ISRC", value: selectedSong.isrc, icon: Hash },
                { label: "UPC", value: selectedSong.upc, icon: Hash },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                    <Icon className="w-3 h-3" /> {label}
                  </p>
                  <p className="text-sm text-gray-200 font-semibold truncate">{value || "-"}</p>
                </div>
              ))}
            </div>
            
            {/* Show keterangan full width if it exists */}
            {selectedSong.keterangan && (
              <div className="p-6 border-t border-white/5">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 font-medium mb-2 flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Keterangan / Lainnya
                  </p>
                  <p className="text-sm text-gray-300 font-medium leading-relaxed break-words">
                    {selectedSong.keterangan}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
