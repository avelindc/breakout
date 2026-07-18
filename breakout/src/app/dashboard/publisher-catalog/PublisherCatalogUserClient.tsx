"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getPublisherCatalogAction, getPublisherCatalogFiltersAction } from "@/app/actions/publisherCatalog";
import { Search, Loader2, BookOpen, Hash, BarChart3, Clock, Disc, Building, User, X } from "lucide-react";
import { Virtuoso } from "react-virtuoso";

const SkeletonMobileCard = React.memo(() => (
  <div className="p-5 animate-pulse bg-transparent">
    <div className="h-5 bg-white/20 rounded-md w-3/4 mb-2"></div>
    <div className="h-4 bg-white/10 rounded-md w-1/2 mb-3"></div>
    <div className="flex gap-2">
      <div className="h-6 w-16 bg-white/10 rounded-lg"></div>
      <div className="h-6 w-12 bg-white/10 rounded-lg"></div>
    </div>
  </div>
));
SkeletonMobileCard.displayName = "SkeletonMobileCard";

const MobileSongCard = React.memo(({ song, index, onClick }: { song: any; index: number; onClick: (song: any) => void }) => (
  <div onClick={() => onClick(song)}
    className={`p-5 hover:bg-white/[0.08] transition-all cursor-pointer transform-gpu contain-paint ${index % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
    <h4 className="font-bold text-white text-lg truncate mb-1">{song.title || "Unknown"}</h4>
    <p className="text-sm font-medium text-blue-300 truncate">{song.artist || "Unknown"}</p>
    <div className="flex flex-wrap gap-2 mt-3">
      {song.publisher && <span className="text-xs px-2.5 py-1 bg-white/10 rounded-lg text-gray-300 border border-white/5">{song.publisher}</span>}
      {song.year && <span className="text-xs px-2.5 py-1 bg-white/10 rounded-lg text-gray-300 border border-white/5">{song.year}</span>}
      {song.isrc && <span className="text-xs px-2.5 py-1 bg-black/30 font-mono rounded-lg text-gray-400 border border-white/5">{song.isrc}</span>}
    </div>
  </div>
));
MobileSongCard.displayName = "MobileSongCard";

export function PublisherCatalogUserClient() {
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publishers, setPublishers] = useState<string[]>([]);
  const [filterPublisher, setFilterPublisher] = useState("");
  const [selectedSong, setSelectedSong] = useState<any | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const LIMIT = 20;

  useEffect(() => {
    getPublisherCatalogFiltersAction().then(res => {
      if (res.success) setPublishers(res.publishers || []);
    });
  }, []);

  const fetchSongs = useCallback(async (pageNum: number, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    const res = await getPublisherCatalogAction({ page: pageNum, limit: LIMIT, search, publisher: filterPublisher });
    
    if (res.success && res.songs) {
      setSongs(prev => isNewSearch ? res.songs : [...prev, ...res.songs]);
      setTotal(res.total || 0);
      setHasMore(res.songs.length === LIMIT);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [search, filterPublisher]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchSongs(1, true);
    }, 500);
    return () => clearTimeout(t);
  }, [search, filterPublisher, fetchSongs]);

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
              placeholder="Cari judul lagu, artis, ISRC..."
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-black/20 border border-white/5 rounded-2xl outline-none focus:border-blue-400/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 text-white transition-all placeholder-blue-200/50 font-medium"
            />
          </div>
          <select
            value={filterPublisher} 
            onChange={(e) => setFilterPublisher(e.target.value)}
            className="sm:w-64 bg-black/20 border border-white/5 rounded-2xl px-5 py-3.5 md:py-4 outline-none focus:border-blue-400/50 focus:bg-black/40 focus:ring-4 focus:ring-blue-500/10 text-white transition-all appearance-none font-medium cursor-pointer"
          >
            <option value="" className="bg-blue-900">Semua Publisher</option>
            {publishers.map(p => <option key={p} value={p} className="bg-blue-900">{p}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            {!loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-gray-500' : 'bg-blue-500'}`}></span>
          </span>
          <p className="text-blue-200/70 font-medium text-sm tracking-wide">
            {loading ? "Mencari..." : `${total.toLocaleString("id-ID")} Data Terdaftar`}
          </p>
        </div>
      </div>

      {loading && songs.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl overflow-clip transform-gpu">
           <div className="sm:hidden divide-y divide-white/5">
             {[...Array(6)].map((_, i) => <SkeletonMobileCard key={i} />)}
           </div>
           <div className="hidden sm:flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /></div>
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 transform-gpu">
          <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-blue-400/50" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Belum ada katalog</h3>
          <p className="text-blue-200/70 max-w-sm">Data publisher catalog tidak ditemukan atau belum diimport oleh Admin.</p>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-white/10 bg-[#0f141e]/80 md:bg-white/5 shadow-xl md:shadow-2xl md:backdrop-blur-md overflow-clip transform-gpu">
          {/* Desktop Table - Premium Look (Pagination applies to both desktop and mobile now via infinite scroll) */}
          <div className="hidden sm:block overflow-x-auto touch-pan-y">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/10">
                  {["Judul Lagu", "Artis", "Publisher", "Composer", "Album", "ISRC", "UPC", "Tahun"].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {songs.map((song, i) => (
                  <tr
                    key={song.id}
                    onClick={() => setSelectedSong(song)}
                    className={`group hover:bg-white/[0.08] transition-all cursor-pointer ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                  >
                    <td className="px-5 py-4 font-bold text-white group-hover:text-blue-300 transition-colors max-w-[200px] truncate">{song.title || "Unknown"}</td>
                    <td className="px-5 py-4 text-blue-100/90 text-sm font-medium max-w-[140px] truncate">{song.artist || "Unknown"}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm max-w-[130px] truncate">
                      {song.publisher ? <span className="px-2 py-1 bg-white/5 rounded-md border border-white/5">{song.publisher}</span> : "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm max-w-[120px] truncate">{song.composer || "-"}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm max-w-[120px] truncate">{song.album || "-"}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">{song.isrc || "-"}</td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">{song.upc || "-"}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm font-medium">{song.year || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Desktop Load More Button since Desktop doesn't use Virtuoso here */}
            {hasMore && (
              <div className="p-6 flex justify-center border-t border-white/5">
                <button 
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm font-medium disabled:opacity-50 hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {loadingMore ? "Memuat..." : "Muat Lebih Banyak"}
                </button>
              </div>
            )}
          </div>

          {/* Mobile Cards - Virtualized Premium Look */}
          <div className="sm:hidden">
            <Virtuoso
              useWindowScroll
              data={songs}
              endReached={loadMore}
              overscan={400}
              itemContent={(index, song) => (
                <MobileSongCard song={song} index={index} onClick={setSelectedSong} />
              )}
              components={{
                Footer: () => (
                  loadingMore ? (
                    <div className="py-6 flex justify-center">
                      <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    </div>
                  ) : null
                )
              }}
            />
          </div>
        </div>
      )}

      {/* Premium Detail Modal */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in transform-gpu">
          <div 
            className="absolute inset-0 z-0" 
            onClick={() => setSelectedSong(null)}
          ></div>
          
          <div className="relative z-10 bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] max-w-lg w-full border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform animate-scale-up flex flex-col max-h-[90vh] transform-gpu">
            
            <div className="relative shrink-0 h-32 bg-gradient-to-br from-blue-900/60 via-purple-900/40 to-black flex items-end p-6 border-b border-white/5">
              <div className="absolute top-4 right-4 z-20">
                <button 
                  onClick={() => setSelectedSong(null)}
                  className="w-8 h-8 bg-black/40 backdrop-blur-md hover:bg-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="relative z-10 w-full">
                <h2 className="text-xl md:text-2xl font-black text-white truncate drop-shadow-md pr-8">{selectedSong.title || "Unknown"}</h2>
                <p className="text-blue-300 font-medium text-sm md:text-base truncate drop-shadow-md opacity-90">{selectedSong.artist || "Unknown"}</p>
              </div>
            </div>

            <div className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Publisher", value: selectedSong.publisher, icon: Building },
                  { label: "Composer", value: selectedSong.composer, icon: User },
                  { label: "Album", value: selectedSong.album, icon: Disc },
                  { label: "Tahun Rilis", value: selectedSong.year, icon: Clock },
                  { label: "ISRC", value: selectedSong.isrc, icon: Hash },
                  { label: "UPC", value: selectedSong.upc, icon: BarChart3 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] text-blue-300/60 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                      <Icon className="w-3 h-3" /> {label}
                    </p>
                    <p className="text-sm text-white font-medium truncate">{value || "-"}</p>
                  </div>
                ))}
              </div>
              
              {selectedSong.keterangan && (
                <div className="bg-blue-900/10 p-5 rounded-2xl border border-blue-500/20 shadow-inner">
                  <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Extra Data / Keterangan
                  </p>
                  <div className="text-sm text-blue-100/80 font-medium leading-relaxed break-words whitespace-pre-wrap font-mono">
                    {selectedSong.keterangan.split(" | ").map((item: string, idx: number) => {
                      const [key, ...val] = item.split(":");
                      return (
                        <div key={idx} className="mb-1 last:mb-0">
                          <span className="text-blue-300 font-bold">{key}:</span> {val.join(":")}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
