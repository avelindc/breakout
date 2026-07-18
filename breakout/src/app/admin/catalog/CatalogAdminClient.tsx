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
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/60 to-blue-800/20 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-lg flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
              <Database className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Katalog MP3</h2>
              <p className="text-blue-200/70 text-sm font-medium">{total.toLocaleString("id-ID")} lagu terdaftar di sistem</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={() => { setEditingSong(null); setErrorMsg(""); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all border border-blue-400/50"
            >
              <Plus className="w-4 h-4" />
              Tambah Data Baru
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-800/10 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-6 border border-red-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-red-100 flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-400" /> Zona Bahaya
            </h3>
            <p className="text-sm text-red-200/70 font-medium">Tindakan ini tidak bisa dikembalikan.</p>
          </div>
          <button 
            onClick={handleClearAll}
            disabled={isClearing || total === 0}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/40 transition-all border border-red-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Seluruh Katalog
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/5 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-5 md:p-6 border border-white/10 shadow-lg transform-gpu">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Cari Data Katalog MP3</h3>
          
          <button onClick={() => { setPage(1); fetchSongs(1, search, true); }} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-sm font-bold hover:bg-blue-500/40 transition-all border border-blue-400/20">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan judul, artis, vokal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11 pr-4 py-3.5 w-full bg-black/20 border border-white/10 text-white placeholder-blue-200/50 rounded-xl outline-none focus:border-blue-400/50 focus:bg-black/40 transition-all font-medium"
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
                  <div className="bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white rounded-[2rem] border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)] md:bg-white md:bg-none md:text-gray-900 md:border-gray-100 md:shadow-sm hover:shadow-md transition-all p-5 sm:p-6 group flex flex-col h-full">
                    <div className="flex gap-4 items-start mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 md:bg-gray-900 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-inner">
                        <img src="/images/music-default.jpg" alt="Cover" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-bold text-white md:text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {song.title || "-"}
                        </h3>
                        <p className="text-sm font-medium text-white/80 md:text-gray-500 truncate mt-1 uppercase tracking-wider">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 mb-5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-white/60 md:text-gray-400">Vokal</span>
                        <span className="text-sm font-bold text-white md:text-gray-700 truncate max-w-[60%] text-right">{song.vokal || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-white/60 md:text-gray-400">Publisher</span>
                        <span className="text-sm font-black text-white md:text-gray-900 truncate max-w-[60%] text-right uppercase">{song.publisher || "-"}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2 mt-2">
                         <span className="text-sm font-semibold text-white/60 md:text-gray-400">Status</span>
                         <button 
                          onClick={() => handleToggle(song.id)}
                          className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${song.isActive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20 md:bg-emerald-50 md:text-emerald-600 md:border-emerald-200 md:hover:bg-emerald-100' : 'bg-red-500/10 text-red-300 border-red-500/30 hover:bg-red-500/20 md:bg-red-50 md:text-red-600 md:border-red-200 md:hover:bg-red-100'}`}
                        >
                          {song.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                        </button>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/15 md:border-gray-100 flex items-center gap-3">
                      {song.driveLink ? (
                        <a 
                          href={song.driveLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white hover:text-[#8a2be2] md:bg-blue-50 md:text-blue-500 md:hover:bg-blue-600 md:hover:text-white flex items-center justify-center transition-colors shrink-0 border border-white/10 md:border-blue-100 hover:border-white/20 md:hover:border-blue-600"
                          title="Buka Link Drive"
                        >
                          <Link className="w-5 h-5" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-white/10 md:bg-gray-50 text-white/30 md:text-gray-300 flex items-center justify-center shrink-0 border border-white/10 md:border-gray-100 cursor-not-allowed">
                          <Link className="w-5 h-5" />
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }}
                        className="flex-1 h-12 rounded-xl bg-white/10 hover:bg-white hover:text-[#8a2be2] text-white md:bg-gray-50 md:text-gray-600 md:hover:bg-blue-55 md:hover:text-blue-600 font-bold flex items-center justify-center gap-2 transition-colors border border-white/10 md:border-gray-100 md:hover:border-blue-200"
                      >
                        <Settings className="w-4 h-4" /> Edit Data
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="w-12 h-12 rounded-xl bg-white/10 text-white hover:bg-white hover:text-red-500 md:bg-gray-50 md:text-gray-400 md:hover:bg-red-50 md:hover:text-red-500 flex items-center justify-center transition-colors shrink-0 border border-white/10 md:border-gray-100 md:hover:border-red-200"
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

      {/* Premium Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in transform-gpu">
          <div className="bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh] border border-white/10 transform animate-scale-up overflow-hidden transform-gpu">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingSong ? <Edit className="w-5 h-5 text-blue-400"/> : <Plus className="w-5 h-5 text-blue-400"/>}
                {editingSong ? 'Edit Data Lagu' : 'Tambah Data Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4">
              {errorMsg && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">Judul *</label>
                <input required name="title" defaultValue={editingSong?.title} type="text" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium" 
                  placeholder="Masukkan judul lagu" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">Artist *</label>
                <input required name="artist" defaultValue={editingSong?.artist} type="text" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium" 
                  placeholder="Nama artis / pengarang" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">Vokal</label>
                <input name="vokal" defaultValue={editingSong?.vokal} type="text" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium" 
                  placeholder="Nama penyanyi / vokal" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">Publisher</label>
                <input name="publisher" defaultValue={editingSong?.publisher} type="text" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium" 
                  placeholder="Nama publisher / label" />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1 flex items-center gap-1.5">Link Drive</label>
                <input name="driveLink" defaultValue={editingSong?.driveLink} type="url" 
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium" 
                  placeholder="https://drive.google.com/..." />
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer bg-white/5 p-4 rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
                  <input type="hidden" name="isActive" value="false" />
                  <input type="checkbox" name="isActive" value="true" 
                    defaultChecked={editingSong ? editingSong.isActive : true} 
                    className="w-5 h-5 text-blue-600 rounded border-gray-600 bg-black focus:ring-blue-500 focus:ring-offset-gray-900" />
                  <span className="text-sm font-bold text-white">Status Aktif (Ditampilkan ke pengguna)</span>
                </label>
              </div>

              <div className="pt-2 mt-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-blue-400/50"
                >
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Menyimpan Data..." : "Simpan Data Lagu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
