"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, Building, X, ExternalLink, Mic2, PlayCircle, Library } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";

// Skeleton component for Loading State
const SkeletonSongCard = React.memo(() => (
  <div className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-3xl p-5 shadow-lg transform-gpu animate-pulse">
    <div className="relative z-10">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex-shrink-0"></div>
        <div className="min-w-0 flex-1 pt-1 space-y-2">
          <div className="h-5 bg-white/20 rounded-md w-3/4"></div>
          <div className="h-4 bg-white/10 rounded-md w-1/2"></div>
        </div>
      </div>
      <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
        <div className="h-4 bg-white/10 rounded-md w-1/2"></div>
        <div className="h-4 bg-white/10 rounded-md w-2/3"></div>
      </div>
      <div className="mt-5">
        <div className="w-full py-2.5 rounded-xl bg-white/5 h-10"></div>
      </div>
    </div>
  </div>
));
SkeletonSongCard.displayName = "SkeletonSongCard";

// Memoized Song Card Component to prevent re-renders
const SongCard = React.memo(({ song, onClick }: { song: any; onClick: (song: any) => void }) => (
  <div 
    onClick={() => onClick(song)}
    className="group relative bg-white/[0.03] backdrop-blur-sm border border-white/5 rounded-3xl p-5 cursor-pointer hover:bg-white/[0.08] hover:border-white/20 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-blue-900/20 transform-gpu contain-paint"
  >
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/0 via-blue-600/0 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
    
    <div className="relative z-10">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 border border-white/10 shadow-inner">
          <Music className="w-6 h-6 text-blue-300 drop-shadow-md" />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <h4 className="text-lg font-bold text-white truncate group-hover:text-blue-200 transition-colors">{song.title}</h4>
          <p className="text-sm text-blue-300/80 truncate font-medium">{song.artist}</p>
        </div>
      </div>

      <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Mic2 className="w-3.5 h-3.5 text-blue-400/70" />
          <span className="truncate">{song.vokal || "Instrumental"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
          <Building className="w-3.5 h-3.5 text-purple-400/70" />
          <span className="truncate">{song.publisher || "Independent"}</span>
        </div>
      </div>

      <div className="mt-5">
        <div className="w-full py-2.5 rounded-xl bg-white/5 text-blue-300 text-sm font-bold flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white transition-colors border border-white/5 group-hover:border-blue-500">
          <PlayCircle className="w-4 h-4" /> Lihat Detail
        </div>
      </div>
    </div>
  </div>
));
SongCard.displayName = "SongCard";

export function CatalogClient() {
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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

  const fetchSongs = useCallback(async (pageNum: number, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    const res = await getCatalogSongsAction({
      page: pageNum,
      limit: 20,
      search,
      publisher: selectedPublisher,
    });
    
    if (res.success && res.songs) {
      setSongs(prev => isNewSearch ? res.songs : [...prev, ...res.songs]);
      setTotal(res.total || 0);
      setHasMore(res.songs.length === 20);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [search, selectedPublisher]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchSongs(1, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedPublisher, fetchSongs]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, false);
    }
  }, [loading, loadingMore, hasMore, page, fetchSongs]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      {/* Premium Search & Filter Bar */}
      <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 backdrop-blur-md md:backdrop-blur-xl rounded-3xl p-5 md:p-6 border border-white/10 shadow-lg transform-gpu">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="w-5 h-5 text-blue-300 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-white" />
            <input 
              type="text" 
              placeholder="Cari lagu idamanmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-black/20 border border-white/5 rounded-2xl outline-none focus:border-blue-400/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 text-white transition-all placeholder-blue-200/50 font-medium"
            />
          </div>
          
          <select 
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="sm:w-64 bg-black/20 border border-white/5 rounded-2xl px-5 py-3.5 md:py-4 outline-none focus:border-blue-400/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 text-white transition-all appearance-none font-medium cursor-pointer"
          >
            <option value="" className="bg-blue-900 text-white">Semua Publisher</option>
            {publishers.map(p => (
              <option key={p} value={p} className="bg-blue-900 text-white">{p}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            {!loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-gray-500' : 'bg-blue-500'}`}></span>
          </span>
          <p className="text-blue-200/70 font-medium text-sm tracking-wide">
            {loading ? "Mencari..." : `${total.toLocaleString("id-ID")} Lagu Ditemukan`}
          </p>
        </div>
      </div>

      {/* Grid of Songs (Virtual List for Mobile Performance) */}
      {songs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 transform-gpu">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <Library className="w-12 h-12 text-blue-400/50" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Belum ada lagu</h3>
          <p className="text-blue-200/70 max-w-sm">Coba cari dengan kata kunci lain atau pilih publisher yang berbeda.</p>
        </div>
      ) : (
        <>
          {loading && songs.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(8)].map((_, i) => <SkeletonSongCard key={i} />)}
            </div>
          ) : (
            <VirtuosoGrid
              useWindowScroll
              data={songs}
              endReached={loadMore}
              overscan={200} // Load items outside viewport for smooth scrolling
              listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              itemClassName="w-full"
              itemContent={(index, song) => (
                <SongCard song={song} onClick={setSelectedSong} />
              )}
              components={{
                Footer: () => (
                  loadingMore ? (
                    <div className="col-span-full py-8 flex justify-center">
                      <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    </div>
                  ) : null
                )
              }}
            />
          )}
        </>
      )}

      {/* Premium Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in transform-gpu">
          <div 
            className="absolute inset-0 z-0" 
            onClick={() => setSelectedSong(null)}
          ></div>
          
          <div className="relative z-10 bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] max-w-lg w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform animate-scale-up flex flex-col max-h-[90vh] overflow-hidden transform-gpu">
            {/* Header Area with Graphic */}
            <div className="relative shrink-0 h-40 md:h-48 bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-black/40 flex items-end p-6 md:p-8 border-b border-white/5">
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setSelectedSong(null)}
                  className="w-10 h-10 bg-black/40 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative z-10 flex items-center gap-4 md:gap-5 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-xl border border-white/20 transform -rotate-3 shrink-0">
                  <Music className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-md" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white truncate drop-shadow-md">{selectedSong.title}</h2>
                  <p className="text-blue-200 font-medium text-base md:text-lg truncate drop-shadow-md opacity-90 mt-1">{selectedSong.artist}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto overscroll-contain touch-pan-y">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-white/5 p-4 md:p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] md:text-xs text-blue-300/60 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5"/> Vokal
                  </p>
                  <p className="text-sm md:text-base text-white font-semibold truncate">{selectedSong.vokal || "-"}</p>
                </div>
                <div className="bg-white/5 p-4 md:p-5 rounded-2xl border border-white/5">
                  <p className="text-[10px] md:text-xs text-purple-300/60 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5"/> Publisher
                  </p>
                  <p className="text-sm md:text-base text-white font-semibold truncate">{selectedSong.publisher || "-"}</p>
                </div>
              </div>

              {/* Action Button */}
              {selectedSong.driveLink ? (
                <a 
                  href={selectedSong.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative w-full py-4 rounded-2xl bg-white text-blue-900 font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center gap-2 overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.15)] transform-gpu"
                >
                  <ExternalLink className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Buka di Google Drive</span>
                </a>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-white/5 text-white/40 font-bold flex justify-center items-center gap-2 border border-white/5 cursor-not-allowed">
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
