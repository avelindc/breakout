"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, Building, X, ExternalLink, Mic2, Library, Settings } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";

const SkeletonSongCard = React.memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 rounded-xl bg-gray-200 flex-shrink-0"></div>
      <div className="min-w-0 flex-1 pt-1 space-y-2">
        <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
        <div className="h-4 bg-gray-100 rounded-md w-1/2"></div>
      </div>
    </div>
    <div className="flex flex-col gap-2.5">
      <div className="h-4 bg-gray-100 rounded-md w-full"></div>
      <div className="h-4 bg-gray-100 rounded-md w-full"></div>
    </div>
    <div className="mt-5 pt-4 border-t border-gray-100">
      <div className="w-full h-11 rounded-xl bg-gray-100"></div>
    </div>
  </div>
));
SkeletonSongCard.displayName = "SkeletonSongCard";

const SongCard = React.memo(({ song, onClick }: { song: any; onClick: (song: any) => void }) => (
  <div 
    onClick={() => onClick(song)}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/10 transition group"
  >
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 transition overflow-hidden">
        <img src="/images/music-default.jpg" alt="Music Icon" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition">{song.title}</div>
        <div className="text-sm font-medium text-gray-500 mt-1 truncate">{song.artist}</div>
      </div>
    </div>

    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-semibold text-gray-400 shrink-0">Vokal</span>
        <span className="text-sm font-bold text-gray-700 text-right break-words">{song.vokal || "Instrumental"}</span>
      </div>
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-semibold text-gray-400 shrink-0">Publisher</span>
        <span className="text-sm font-bold text-gray-700 text-right break-words">{song.publisher || "Independent"}</span>
      </div>
    </div>

    <div className="mt-5 pt-4 border-t border-gray-100">
      <button className="w-full h-11 rounded-xl bg-gray-50 text-gray-600 group-hover:bg-blue-600 group-hover:text-white font-bold flex items-center justify-center gap-2 transition text-sm">
        <Settings className="w-4 h-4 shrink-0" /> Buka Detail
      </button>
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
      {/* Light Theme Search & Filter Bar */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-600" />
            <input 
              type="text" 
              placeholder="Cari lagu idamanmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-gray-900 transition-all placeholder-gray-400 font-medium"
            />
          </div>
          
          <select 
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="sm:w-64 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 md:py-4 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 text-gray-900 transition-all font-medium cursor-pointer"
          >
            <option value="">Semua Publisher</option>
            {publishers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            {!loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
          </span>
          <p className="text-gray-500 font-medium text-sm tracking-wide">
            {loading ? "Mencari..." : `${total.toLocaleString("id-ID")} Lagu Ditemukan`}
          </p>
        </div>
      </div>

      {/* Grid of Songs */}
      {songs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Library className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada lagu</h3>
          <p className="text-gray-500 max-w-sm">Coba cari dengan kata kunci lain atau pilih publisher yang berbeda.</p>
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
              overscan={200}
              listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              itemClassName="w-full"
              itemContent={(index, song) => (
                <SongCard song={song} onClick={setSelectedSong} />
              )}
              components={{
                Footer: () => (
                  loadingMore ? (
                    <div className="col-span-full py-8 flex justify-center">
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                  ) : null
                )
              }}
            />
          )}
        </>
      )}

      {/* Detail Modal (Light Theme) */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="absolute inset-0 z-0" 
            onClick={() => setSelectedSong(null)}
          ></div>
          
          <div className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-2xl transform animate-scale-up flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header Area */}
            <div className="relative shrink-0 h-40 md:h-48 bg-gray-50 flex items-end p-6 md:p-8 border-b border-gray-100">
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setSelectedSong(null)}
                  className="w-10 h-10 bg-white hover:bg-gray-100 shadow-sm rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all border border-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="relative z-10 flex items-center gap-4 md:gap-5 w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-200 shrink-0 overflow-hidden">
                  <img src="/images/music-default.jpg" alt="Music Icon" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 truncate">{selectedSong.title}</h2>
                  <p className="text-gray-500 font-medium text-base md:text-lg truncate mt-1">{selectedSong.artist}</p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6 overflow-y-auto overscroll-contain touch-pan-y">
              {/* Info Cards */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                    <Mic2 className="w-3.5 h-3.5"/> Vokal
                  </p>
                  <p className="text-sm md:text-base text-gray-900 font-bold truncate">{selectedSong.vokal || "-"}</p>
                </div>
                <div className="bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5"/> Publisher
                  </p>
                  <p className="text-sm md:text-base text-gray-900 font-bold truncate">{selectedSong.publisher || "-"}</p>
                </div>
              </div>

              {/* Action Button */}
              {selectedSong.driveLink ? (
                <a 
                  href={selectedSong.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  <ExternalLink className="w-5 h-5" />
                  Buka di Google Drive
                </a>
              ) : (
                <div className="w-full py-4 rounded-2xl bg-gray-100 text-gray-400 font-bold flex justify-center items-center gap-2 cursor-not-allowed">
                  <ExternalLink className="w-5 h-5" />
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
