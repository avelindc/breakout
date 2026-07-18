"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, User, Building, X, Play, Download, Pause } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="bg-blue-600 rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-center shadow-lg">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-blue-200 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan judul lagu, artis, atau publisher..."
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
        Menampilkan {songs.length} dari {total} lagu MP3
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
              className="bg-white/5 border border-white/10 rounded-2xl p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-600/10 transition group flex flex-col"
            >
              <div className="w-full aspect-square bg-blue-900 rounded-xl mb-4 overflow-hidden relative flex items-center justify-center">
                {song.coverUrl ? (
                  <img src={song.coverUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <Music className="w-12 h-12 text-blue-400/50" />
                )}
                {/* Play Overlay */}
                {song.audioUrl && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-blue-600 pl-1 shadow-xl">
                      <Play className="w-5 h-5" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-bold text-white truncate">{song.title}</h4>
                <p className="text-sm text-blue-300 truncate font-medium mt-0.5">{song.artist}</p>
                
                <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                  {song.publisher && (
                    <span className="flex items-center gap-1 truncate"><Building className="w-3 h-3"/> {song.publisher}</span>
                  )}
                  {song.genre && (
                    <span className="px-2 py-1 bg-white/10 rounded-full">{song.genre}</span>
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

      {/* Song Detail & Player Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121A] rounded-3xl max-w-md w-full border border-white/10 shadow-2xl overflow-hidden animate-scale-in flex flex-col">
            <div className="relative aspect-square w-full bg-blue-900">
              {selectedSong.coverUrl ? (
                <img src={selectedSong.coverUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-24 h-24 text-blue-400/50" />
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] via-transparent to-transparent opacity-90" />
              
              <button 
                onClick={() => setSelectedSong(null)}
                className="absolute top-4 right-4 p-2 text-white bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full transition z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 z-10">
                <h2 className="text-2xl font-bold text-white drop-shadow-md truncate">{selectedSong.title}</h2>
                <p className="text-blue-400 font-medium mt-1 text-lg drop-shadow-md truncate">{selectedSong.artist}</p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-wrap gap-2">
                {selectedSong.publisher && (
                  <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-gray-400"/>
                    <span className="text-sm text-gray-300">{selectedSong.publisher}</span>
                  </div>
                )}
                {selectedSong.genre && (
                  <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                    <span className="text-sm text-gray-300">{selectedSong.genre}</span>
                  </div>
                )}
              </div>

              {/* Audio Player */}
              {selectedSong.audioUrl ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-400 ml-1">Preview MP3</p>
                  <audio 
                    controls 
                    className="w-full h-12"
                    controlsList="nodownload"
                    autoPlay
                    src={selectedSong.audioUrl}
                  />
                </div>
              ) : (
                 <div className="p-4 bg-white/5 rounded-xl text-center text-gray-400 text-sm">
                   Preview Audio tidak tersedia untuk lagu ini.
                 </div>
              )}
              
              {/* Download Action */}
              {selectedSong.isDownloadable ? (
                <a 
                  href={selectedSong.audioUrl}
                  download
                  target="_blank"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold hover:opacity-90 transition flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] mt-2"
                >
                  <Download className="w-5 h-5" />
                  Download MP3
                </a>
              ) : (
                <div className="w-full py-4 rounded-xl bg-white/5 text-gray-400 font-bold flex justify-center items-center gap-2 border border-white/10 mt-2 cursor-not-allowed">
                  <Download className="w-5 h-5 opacity-50" />
                  Download Tidak Tersedia
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
