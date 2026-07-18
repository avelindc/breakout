"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, Building, X, ExternalLink, Mic2 } from "lucide-react";

export function CatalogClient() {
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  
  const [publishers, setPublishers] = useState<string[]>([]);
  const [selectedPublisher, setSelectedPublisher] = useState("");

  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  useEffect(() => {
    getCatalogFiltersAction().then(res => {
      if (res.success) {
        setPublishers((res.publishers || []) as string[]);
      }
    });
  }, []);

  const fetchSongs = async (pageNum: number, isNewSearch = false) => {
    setLoading(true);
    const res = await getCatalogSongsAction({
      page: pageNum,
      limit: 20,
      search,
      publisher: selectedPublisher,
    });
    
    if (res.success && res.songs) {
      if (isNewSearch) {
        setSongs(res.songs);
      } else {
        setSongs(prev => [...prev, ...res.songs]);
      }
      setTotal(res.total || 0);
      setHasMore(res.songs.length === 20);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchSongs(1, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedPublisher]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-blue-600 rounded-2xl p-5 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shadow-lg">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-blue-200 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari judul, artis, vokal, publisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-blue-700/50 border border-blue-400/30 rounded-xl outline-none focus:border-white text-white transition placeholder-blue-200"
          />
        </div>
        
        <select 
          value={selectedPublisher}
          onChange={(e) => setSelectedPublisher(e.target.value)}
          className="sm:w-48 bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 outline-none focus:border-white text-white transition appearance-none"
        >
          <option value="" className="bg-blue-800">Semua Publisher</option>
          {publishers.map(p => (
            <option key={p} value={p} className="bg-blue-800">{p}</option>
          ))}
        </select>
      </div>

      <div className="text-gray-400 font-medium text-sm">
        Menampilkan {songs.length} dari {total} lagu
      </div>

      {songs.length === 0 && !loading ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <Music className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Tidak ada lagu</h3>
          <p className="text-gray-400">Katalog kosong atau lagu tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {songs.map((song, i) => (
            <div 
              key={`${song.id}-${i}`}
              onClick={() => setSelectedSong(song)}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-blue-400 hover:bg-blue-600/10 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600/30 text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-white truncate">{song.title}</h4>
                  <p className="text-sm text-blue-300 truncate mt-0.5 font-medium">{song.artist}</p>
                  {song.vokal && (
                    <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                      <Mic2 className="w-3 h-3" /> {song.vokal}
                    </p>
                  )}
                  {song.publisher && (
                    <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1">
                      <Building className="w-3 h-3" /> {song.publisher}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      )}

      {!loading && hasMore && songs.length > 0 && (
        <div className="flex justify-center pt-4">
          <button 
            onClick={loadMore}
            className="px-6 py-3 rounded-full border border-white/20 text-white font-medium hover:bg-white/5 transition"
          >
            Muat Lebih Banyak
          </button>
        </div>
      )}

      {/* Song Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12121A] rounded-3xl max-w-md w-full border border-white/10 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/30 flex items-center justify-center flex-shrink-0">
                  <Music className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedSong.title}</h2>
                  <p className="text-blue-400 font-medium mt-0.5">{selectedSong.artist}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSong(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3">
                {selectedSong.vokal && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                      <Mic2 className="w-3 h-3"/> Vokal
                    </p>
                    <p className="text-sm text-gray-200 font-semibold">{selectedSong.vokal}</p>
                  </div>
                )}
                {selectedSong.publisher && (
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1">
                      <Building className="w-3 h-3"/> Publisher
                    </p>
                    <p className="text-sm text-gray-200 font-semibold">{selectedSong.publisher}</p>
                  </div>
                )}
              </div>

              {/* Drive Link Button */}
              {selectedSong.driveLink ? (
                <a 
                  href={selectedSong.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-4 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold hover:opacity-90 transition flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                >
                  <ExternalLink className="w-5 h-5" />
                  Buka di Google Drive
                </a>
              ) : (
                <div className="w-full mt-4 py-4 rounded-xl bg-white/5 text-gray-400 font-bold flex justify-center items-center gap-2 border border-white/10 cursor-not-allowed">
                  <ExternalLink className="w-5 h-5 opacity-50" />
                  Link Drive Tidak Tersedia
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
