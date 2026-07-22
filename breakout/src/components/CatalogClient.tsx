"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogSongsAction, getCatalogFiltersAction } from "@/app/actions/catalog";
import { Search, Loader2, Music, Building, X, ExternalLink, Mic2, Library, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

export function CatalogClient() {
  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  
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

  const fetchSongs = useCallback(async (pageNum: number) => {
    setLoading(true);

    const res = await getCatalogSongsAction({
      page: pageNum,
      limit,
      search,
      publisher: selectedPublisher,
    });
    
    if (res.success && res.songs) {
      setSongs(res.songs);
      setTotal(res.total || 0);
    }
    
    setLoading(false);
  }, [search, selectedPublisher, limit]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchSongs(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedPublisher, limit, fetchSongs]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchSongs(newPage);
  };

  const totalPages = Math.ceil(total / limit) || 1;
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const getPaginationNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 group">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari lagu idamanmu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-full outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 transition-all font-medium text-sm"
            />
          </div>
          
          <select 
            value={selectedPublisher}
            onChange={(e) => setSelectedPublisher(e.target.value)}
            className="md:w-64 bg-white border border-gray-200 rounded-full px-5 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 font-medium text-sm"
          >
            <option value="">Semua Publisher</option>
            {publishers.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={limit} 
            onChange={(e) => setLimit(Number(e.target.value))}
            className="md:w-36 bg-white border border-gray-200 rounded-full px-5 py-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-gray-900 font-medium text-sm"
          >
            <option value={10}>10 / halaman</option>
            <option value={20}>20 / halaman</option>
            <option value={50}>50 / halaman</option>
            <option value={100}>100 / halaman</option>
          </select>

          <button onClick={() => fetchSongs(page)} className="w-[46px] h-[46px] flex-shrink-0 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition text-gray-600">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4 text-xs text-gray-500 font-medium px-2">
          <div>{total > 0 ? `${startItem}-${endItem} dari ${total.toLocaleString("id-ID")} lagu` : "Tidak ada data"}</div>
          {selectedPublisher && <div className="uppercase tracking-wider">{selectedPublisher}</div>}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-bold pl-6">SONG ID</th>
                <th className="p-4 font-bold">JUDUL LAGU</th>
                <th className="p-4 font-bold">VOKAL / ARTIS</th>
                <th className="p-4 font-bold">PUBLISHER</th>
                <th className="p-4 font-bold text-center pr-6">REFERENSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Library className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="font-bold text-gray-900">Belum ada lagu</p>
                      <p className="text-sm">Coba cari dengan kata kunci lain atau pilih publisher yang berbeda.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                songs.map((song, i) => {
                  const displayId = song.isrc || `SNG${(startItem + i).toString().padStart(6, '0')}`;
                  
                  return (
                    <tr key={song.id} className="hover:bg-gray-50/80 transition group">
                      <td className="p-4 pl-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#cdff9c] text-green-900 whitespace-nowrap shadow-sm">
                          {displayId}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-800 text-sm">
                        {song.title || "-"}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-700">{song.vokal || "Instrumental"}</span>
                          <span className="text-xs text-gray-400 uppercase tracking-wider">{song.artist || "-"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-600 uppercase font-medium">
                        {song.publisher || "Independent"}
                      </td>
                      <td className="p-4 text-center pr-6">
                        <div className="flex items-center justify-center gap-3">
                          {song.driveLink ? (
                            <a href={song.driveLink} target="_blank" rel="noreferrer" className="text-teal-600 hover:text-teal-800 text-sm font-bold flex items-center gap-1 transition">
                              Buka Drive
                            </a>
                          ) : (
                            <span className="text-gray-300 text-sm">—</span>
                          )}
                          <button onClick={() => setSelectedSong(song)} className="text-blue-600 hover:text-blue-800 text-sm font-bold flex items-center gap-1 transition opacity-0 group-hover:opacity-100">
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 border-t border-gray-100 pt-6 px-2">
            <div className="text-sm text-gray-500 font-medium">
              Halaman {page} dari {totalPages}
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {page > 3 && (
                <>
                  <button onClick={() => handlePageChange(1)} className="w-8 h-8 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50">1</button>
                  {page > 4 && <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>}
                </>
              )}

              {getPaginationNumbers().map(num => (
                <button
                  key={num}
                  onClick={() => handlePageChange(num)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition ${page === num ? 'bg-[#cdff9c] text-green-900 border border-[#b8ff75] font-bold' : 'text-gray-600 hover:bg-gray-50 border border-transparent'}`}
                >
                  {num}
                </button>
              ))}

              {page < totalPages - 2 && (
                <>
                  {page < totalPages - 3 && <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>}
                  <button onClick={() => handlePageChange(totalPages)} className="w-8 h-8 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50">{totalPages}</button>
                </>
              )}

              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
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
