"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogSongsAction, deleteCatalogSongAction, createCatalogSongAction, updateCatalogSongAction, toggleCatalogSongStatusAction, deleteAllCatalogAction } from "@/app/actions/catalog";
import { Loader2, RefreshCw, Trash2, Search, Plus, Edit, X, Link, AlertCircle, LayoutList, Database, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { VirtuosoGrid } from "react-virtuoso";

export function CatalogAdminClient({ initialTotal }: { initialTotal: number }) {
  const router = useRouter();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(initialTotal);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const LIMIT = 20;

  const fetchSongs = useCallback(async (pageNum: number, searchQuery: string, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    const res = await getCatalogSongsAction({ page: pageNum, limit: LIMIT, search: searchQuery, isAdmin: true });
    
    if (res.success && res.songs) {
      setSongs(prev => isNewSearch ? res.songs : [...prev, ...res.songs]);
      setTotal(res.total || 0);
      setHasMore(res.songs.length === LIMIT);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchSongs(1, search, true);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, fetchSongs]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, search, false);
    }
  }, [loading, loadingMore, hasMore, page, search, fetchSongs]);

  const handleClearAll = async () => {
    if (!confirm("Yakin ingin hapus SEMUA lagu dari katalog? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsClearing(true);
    const res = await deleteAllCatalogAction();
    setIsClearing(false);
    if (res.success) {
      setSongs([]);
      setTotal(0);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini dari katalog?")) return;
    const res = await deleteCatalogSongAction(id);
    if (res.success) {
      setPage(1);
      fetchSongs(1, search, true);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await toggleCatalogSongStatusAction(id, 'isActive');
    if (res.success) {
      setSongs(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    } else {
      alert(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);

    try {
      let res;
      if (editingSong) {
        res = await updateCatalogSongAction(editingSong.id, formData);
      } else {
        res = await createCatalogSongAction(formData);
      }

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsModalOpen(false);
        setEditingSong(null);
        setPage(1);
        fetchSongs(1, search, true);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      {/* Header Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transform-gpu">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white shadow-md flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Database Katalog MP3</h2>
              <p className="text-gray-500 text-sm font-medium">{total.toLocaleString("id-ID")} lagu terdaftar di sistem</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => { setEditingSong(null); setErrorMsg(""); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 transition-all border border-purple-500"
            >
              <Plus className="w-4 h-4" />
              Tambah Data Baru
            </button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 border border-white flex flex-col justify-between shadow-md">
          <div>
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-500" /> Zona Bahaya
            </h3>
            <p className="text-sm text-gray-500 font-medium">Tindakan ini tidak bisa dikembalikan.</p>
          </div>
          <button 
            onClick={handleClearAll}
            disabled={isClearing || total === 0}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Seluruh Katalog
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-5 md:p-6 border border-white shadow-md transform-gpu">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Cari Data Katalog MP3</h3>
          
          <button onClick={() => { setPage(1); fetchSongs(1, search, true); }} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 transition-all border border-purple-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan judul, artis, vokal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3.5 w-full bg-white/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl outline-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
          />
        </div>
      </div>

      {/* Premium Virtualized Grid */}
      <div className="transform-gpu">
        {loading && songs.length === 0 ? (
           <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /></div>
        ) : songs.length === 0 ? (
           <div className="py-24 text-center text-blue-300 font-medium">Katalog kosong atau lagu tidak ditemukan.</div>
        ) : (
          <div className="bg-transparent border-none shadow-none pb-10">
            <VirtuosoGrid
              useWindowScroll
              data={songs}
              endReached={loadMore}
              overscan={200}
              listClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              itemClassName="w-full"
              itemContent={(i, song) => (
                  <div className="bg-white/60 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-gray-900 rounded-[2rem] hover:-translate-y-1 hover:shadow-xl transition-all p-5 sm:p-6 group flex flex-col h-full">
                    <div className="flex gap-4 items-start mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-sm border border-gray-200">
                        <img src="/images/music-default.jpg" alt="Cover" className="w-full h-full object-cover opacity-90" />
                        <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {song.title || "-"}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 truncate mt-1 uppercase tracking-wider">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 mb-5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Vokal</span>
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[60%] text-right">{song.vokal || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Publisher</span>
                        <span className="text-sm font-black text-gray-800 truncate max-w-[60%] text-right uppercase">{song.publisher || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 mt-2">
                         <span className="text-sm font-semibold text-gray-400">Status</span>
                         <button 
                          onClick={() => handleToggle(song.id)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${song.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                        >
                          {song.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                      {song.driveLink ? (
                        <a 
                          href={song.driveLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-colors shrink-0 border border-purple-100"
                          title="Buka Link Drive"
                        >
                          <Link className="w-5 h-5" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center shrink-0 border border-gray-100 cursor-not-allowed">
                          <Link className="w-5 h-5" />
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }}
                        className="flex-1 h-12 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold flex items-center justify-center gap-2 transition-colors border border-blue-100"
                      >
                        <Settings className="w-4 h-4" /> Edit Data
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="w-12 h-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0 border border-red-100"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
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
      </div>

      {/* Light Theme Modal Add/Edit (Match Screenshot) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-fade-in transform-gpu">
          <div className="bg-[#F8F9FA] rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden transform-gpu font-sans">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-white shrink-0">
              <h2 className="text-xl font-bold text-gray-800">
                {editingSong ? 'Edit Lagu MP3' : 'Tambah Lagu MP3 Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-5 bg-[#F8F9FA]">
              {errorMsg && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Judul Lagu *</label>
                  <input required name="title" defaultValue={editingSong?.title} type="text" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Nama Artis *</label>
                  <input required name="artist" defaultValue={editingSong?.artist} type="text" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Publisher</label>
                  <input name="publisher" defaultValue={editingSong?.publisher} type="text" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                    placeholder="Optional" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700">Genre</label>
                  <input name="genre" defaultValue={editingSong?.genre} type="text" 
                    className="w-full bg-white border border-gray-300 text-gray-900 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                    placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">Cover Image</label>
                <div className="relative">
                  <input type="file" name="coverFile" accept="image/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-300 rounded-lg bg-white cursor-pointer" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700">File MP3 {editingSong ? '' : '*'}</label>
                <div className="relative">
                  <input type="file" name="audioFile" accept="audio/*" className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 border border-gray-300 rounded-lg bg-white cursor-pointer" />
                </div>
                {editingSong?.audioUrl && <p className="text-xs text-green-600 mt-1">File MP3 sudah ada (Upload baru untuk mengganti).</p>}
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
                  <input type="checkbox" name="isActive" value="true" defaultChecked={editingSong ? editingSong.isActive : true} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  Status Aktif (Ditampilkan)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 font-medium">
                  <input type="checkbox" name="isDownloadable" value="true" defaultChecked={editingSong ? editingSong.isDownloadable : false} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  Boleh di Download
                </label>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-[#4267B2] hover:bg-[#365899] text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Lagu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
