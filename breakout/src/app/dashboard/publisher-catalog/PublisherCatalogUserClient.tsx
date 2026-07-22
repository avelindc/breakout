"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getPublisherCatalogAction, getPublisherCatalogFiltersAction } from "@/app/actions/publisherCatalog";
import { Search, Loader2, BookOpen, Hash, BarChart3, Clock, Disc, Building, User, X, Settings, PlayCircle } from "lucide-react";
import { VirtuosoGrid } from "react-virtuoso";

const SkeletonMobileCard = React.memo(() => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse mb-4 mx-4 sm:mx-0">
    <div className="h-5 bg-gray-200 rounded-md w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-100 rounded-md w-1/2 mb-3"></div>
    <div className="flex gap-2">
      <div className="h-6 w-16 bg-gray-100 rounded-lg"></div>
      <div className="h-6 w-12 bg-gray-100 rounded-lg"></div>
    </div>
  </div>
));
SkeletonMobileCard.displayName = "SkeletonMobileCard";

const getYoutubeLink = (song: any) => {
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s|]+)/i;
  let match = null;
  if (song.keterangan) match = song.keterangan.match(ytRegex);
  if (!match && song.composer) match = song.composer.match(ytRegex);
  if (!match && song.artist) match = song.artist.match(ytRegex);
  return match ? match[1] : null;
};

const getCleanText = (text: string | null) => {
  if (!text) return "-";
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s|]+)/i;
  const clean = text.replace(ytRegex, '').replace(/^URL:\s*/i, '').replace(/YOUTUBE LINK REFERENCE:\s*/i, '').replace(/Youtube link \(if Any\):\s*/i, '').replace(/\|\s*$/, '').trim();
  return clean || "-";
};

const MobileSongCard = React.memo(({ song, index, onClick }: { song: any; index: number; onClick: (song: any) => void }) => {
  const ytLink = getYoutubeLink(song);
  
  return (
  <div onClick={() => onClick(song)}
    className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-gray-900 rounded-[2rem] hover:-translate-y-1 hover:shadow-xl p-5 cursor-pointer transition-all group mb-4 mx-4 sm:mx-0">
    <div className="flex items-start gap-4 mb-4">
      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 transition overflow-hidden border border-gray-200">
        <img src="/images/publisher-default.jpg" alt="Publisher Icon" className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-300" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 transition flex items-center gap-2 group-hover:text-purple-600">
          <span>{song.title || "Unknown"}</span>
        </div>
        <div className="text-sm font-medium text-gray-500 mt-1 truncate uppercase tracking-wider">{getCleanText(song.artist)}</div>
      </div>
    </div>

    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-semibold text-gray-400 shrink-0">Composer</span>
        <span className="text-sm font-bold text-gray-700 text-right break-words line-clamp-2">{getCleanText(song.composer)}</span>
      </div>
      <div className="flex justify-between items-start gap-2">
        <span className="text-sm font-semibold text-gray-400 shrink-0">Publisher</span>
        <span className="text-sm font-black text-gray-800 text-right break-words line-clamp-1 uppercase">{song.publisher || "-"}</span>
      </div>
    </div>

    <div className="mt-5 pt-4 border-t border-gray-100 flex gap-2">
      {ytLink && (
        <a href={ytLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center shrink-0 transition border border-purple-100" title="Buka di YouTube">
          <PlayCircle className="w-5 h-5" />
        </a>
      )}
      <button className="flex-1 h-11 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold flex items-center justify-center gap-2 transition text-sm border border-blue-100">
        <Settings className="w-4 h-4 shrink-0" /> Buka Detail
      </button>
    </div>
  </div>
)});
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
      {/* Light Theme Search & Filter Bar */}
      <div className="bg-white/60 backdrop-blur-xl border border-white shadow-md text-gray-900 rounded-[2rem] p-5 md:p-6 mx-4 sm:mx-0">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-purple-500" />
            <input
              type="text" 
              placeholder="Cari judul lagu, artis, ISRC..."
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 md:py-4 bg-white/80 border border-gray-200 rounded-2xl outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 text-gray-900 transition-all placeholder-gray-400 font-medium"
            />
          </div>
          <select
            value={filterPublisher} 
            onChange={(e) => setFilterPublisher(e.target.value)}
            className="sm:w-64 bg-white/80 border border-gray-200 rounded-2xl px-5 py-3.5 md:py-4 outline-none focus:border-purple-300 focus:bg-white focus:ring-4 focus:ring-purple-500/10 text-gray-900 transition-all font-medium cursor-pointer"
          >
            <option value="" className="text-gray-900">Semua Publisher</option>
            {publishers.map(p => <option key={p} value={p} className="text-gray-900">{p}</option>)}
          </select>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            {!loading && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${loading ? 'bg-gray-300' : 'bg-purple-500'}`}></span>
          </span>
          <p className="text-gray-600 font-medium text-sm tracking-wide">
            {loading ? "Mencari..." : `${total.toLocaleString("id-ID")} Data Terdaftar`}
          </p>
        </div>
      </div>

      {loading && songs.length === 0 ? (
        <div className="sm:bg-white sm:rounded-3xl sm:border sm:border-gray-100 sm:shadow-sm">
           <div className="sm:hidden pt-2">
             {[...Array(6)].map((_, i) => <SkeletonMobileCard key={i} />)}
           </div>
           <div className="hidden sm:flex justify-center py-20"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
        </div>
      ) : songs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-100 shadow-sm mx-4 sm:mx-0">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <BookOpen className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Belum ada katalog</h3>
          <p className="text-gray-500 max-w-sm">Data publisher catalog tidak ditemukan atau belum diimport oleh Admin.</p>
        </div>
      ) : (
        <div className="bg-transparent border-none shadow-none pb-10">
          <VirtuosoGrid
            useWindowScroll
            data={songs}
            endReached={loadMore}
            overscan={200}
            listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mx-4 sm:mx-0"
            itemClassName="w-full"
            itemContent={(index, song) => (
              <MobileSongCard song={song} index={index} onClick={setSelectedSong} />
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
        </div>
      )}

      {/* Detail Modal (Light Theme) */}
      {selectedSong && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="absolute inset-0 z-0" 
            onClick={() => setSelectedSong(null)}
          ></div>
          
          <div className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-2xl transform animate-scale-up flex flex-col max-h-[90vh] overflow-hidden">
            
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
                  <img src="/images/publisher-default.jpg" alt="Publisher Icon" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-gray-900 truncate pr-8">{selectedSong.title || "Unknown"}</h2>
                  <p className="text-gray-500 font-medium text-base md:text-lg truncate mt-1">{selectedSong.artist || "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Publisher", value: selectedSong.publisher, icon: Building },
                  { label: "Composer", value: getCleanText(selectedSong.composer), icon: User },
                  { label: "Album", value: selectedSong.album, icon: Disc },
                  { label: "Tahun Rilis", value: selectedSong.year, icon: Clock },
                  { label: "ISRC", value: selectedSong.isrc, icon: Hash },
                  { label: "UPC", value: selectedSong.upc, icon: BarChart3 },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1.5">
                      <Icon className="w-3 h-3" /> {label}
                    </p>
                    <p className="text-sm text-gray-900 font-bold truncate">{value || "-"}</p>
                  </div>
                ))}
              </div>
              
              {selectedSong.keterangan && (
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <p className="text-[10px] text-blue-600 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Extra Data / Keterangan
                  </p>
                  <div className="text-sm text-gray-700 font-medium leading-relaxed break-words whitespace-pre-wrap font-mono">
                    {selectedSong.keterangan.split(" | ").map((item: string, idx: number) => {
                      const ytLink = getYoutubeLink({ keterangan: item });
                      if (ytLink || item.toLowerCase().includes("youtube link")) return null; // hide youtube links from extra data
                      if (item.trim() === "-" || !item.includes(":")) return null;
                      
                      const parts = item.split(":");
                      const key = parts[0];
                      const val = parts.slice(1).join(":");
                      return (
                        <div key={idx} className="mb-1 last:mb-0">
                          <span className="text-gray-900 font-bold">{key}:</span> {val}
                        </div>
                      )
                    })}
                    {getYoutubeLink(selectedSong) && (
                      <a href={getYoutubeLink(selectedSong)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg border border-red-100 transition">
                        <PlayCircle className="w-4 h-4" /> Tonton di YouTube
                      </a>
                    )}
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
