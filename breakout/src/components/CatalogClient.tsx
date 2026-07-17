"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, User, Building, Clock, FileDigit, Calendar, Mic2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function CatalogClient() {
  const router = useRouter();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  
  const [publishers, setPublishers] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  
  const [selectedPublisher, setSelectedPublisher] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  
  const [selectedSong, setSelectedSong] = useState<any | null>(null);

  useEffect(() => {
    // Load filters on mount
    getCatalogFiltersAction().then(res => {
      if (res.success) {
        setPublishers((res.publishers || []) as string[]);
        setGenres((res.genres || []) as string[]);
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
      genre: selectedGenre
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
  }, [search, selectedPublisher, selectedGenre]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, false);
    }
  };

  const handleAjukanCover = (song: any) => {
    // Redirect to upload form with pre-filled cover details via query string
    const params = new URLSearchParams();
    params.set("cover", "true");
    params.set("title", song.title);
    params.set("originalArtist", song.artist);
    
    router.push(`/dashboard/upload?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-blue-200 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan judul, artis, atau publisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-blue-700/50 border border-blue-400/30 rounded-xl outline-none focus:border-white text-white transition placeholder-blue-200"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="flex-1 md:w-48 bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 outline-none focus:border-white text-white transition appearance-none"
          >
            <option value="" className="bg-blue-800 text-white">Semua Publisher</option>
            {publishers.map(p => (
              <option key={p} value={p} className="bg-blue-800 text-white">{p}</option>
            ))}
          </select>
          
          <select 
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="flex-1 md:w-48 bg-blue-700/50 border border-blue-400/30 rounded-xl px-4 py-3 outline-none focus:border-white text-white transition appearance-none"
          >
            <option value="" className="bg-blue-800 text-white">Semua Genre</option>
            {genres.map(g => (
              <option key={g} value={g} className="bg-blue-800 text-white">{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-4 text-gray-400 font-medium">
        Menampilkan {songs.length} dari {total} lagu
      </div>

      {songs.length === 0 && !loading ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <Music className="w-16 h-16 text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Tidak ada lagu</h3>
          <p className="text-gray-400">Katalog kosong atau lagu tidak ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {songs.map((song, i) => (
            <div 
              key={`${song.id}-${i}`}
              onClick={() => setSelectedSong(song)}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-[#10B981] hover:bg-[#10B981]/5 transition group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Music className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-lg font-bold text-white truncate">{song.title}</h4>
                  <p className="text-sm text-gray-400 truncate flex items-center gap-1 mt-1">
                    <User className="w-3 h-3" /> {song.artist}
                  </p>
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-1">
                    <Building className="w-3 h-3" /> {song.publisher || 'Indie'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 text-[#10B981] animate-spin" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] rounded-3xl max-w-lg w-full border border-white/10 shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/5 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedSong.title}</h2>
                <p className="text-[#10B981] font-medium mt-1">{selectedSong.artist}</p>
              </div>
              <button 
                onClick={() => setSelectedSong(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Building className="w-3 h-3"/> Publisher</p>
                  <p className="text-sm text-gray-200 font-medium">{selectedSong.publisher || '-'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Music className="w-3 h-3"/> Genre</p>
                  <p className="text-sm text-gray-200 font-medium">{selectedSong.genre || '-'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><FileDigit className="w-3 h-3"/> ISRC</p>
                  <p className="text-sm text-gray-200 font-medium">{selectedSong.isrc || '-'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Durasi</p>
                  <p className="text-sm text-gray-200 font-medium">{selectedSong.duration || '-'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl col-span-2">
                  <p className="text-xs text-gray-500 font-medium mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> Tahun</p>
                  <p className="text-sm text-gray-200 font-medium">{selectedSong.year || '-'}</p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20">
              <button 
                onClick={() => handleAjukanCover(selectedSong)}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold text-lg hover:opacity-90 transition flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <Mic2 className="w-5 h-5" />
                Ajukan Cover Lagu Ini
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
