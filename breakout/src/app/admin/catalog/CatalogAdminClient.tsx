"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getCatalogSongsAction, deleteCatalogSongAction, createCatalogSongAction, updateCatalogSongAction, toggleCatalogSongStatusAction, deleteAllCatalogAction } from "@/app/actions/catalog";
import { Loader2, RefreshCw, Trash2, Search, Plus, Edit, X, Link, AlertCircle, LayoutList, Database, Settings, ChevronLeft, ChevronRight, Library } from "lucide-react";
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

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchSongs(newPage, search, true);
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const startItem = (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

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

      <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-2">
        <div>{total > 0 ? `${startItem}-${endItem} dari ${total.toLocaleString("id-ID")} lagu` : "Tidak ada data"}</div>
      </div>

      {/* Premium Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-6 transform-gpu">
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-bold pl-6">SONG ID</th>
                <th className="p-4 font-bold">JUDUL LAGU</th>
                <th className="p-4 font-bold">VOKAL / ARTIS</th>
                <th className="p-4 font-bold">PUBLISHER</th>
                <th className="p-4 font-bold">STATUS</th>
                <th className="p-4 font-bold text-center pr-6">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Library className="w-12 h-12 text-gray-200 mb-3" />
                      <p className="font-bold text-gray-900">Belum ada lagu</p>
                      <p className="text-sm">Katalog kosong atau lagu tidak ditemukan.</p>
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
                        {song.publisher || "-"}
                      </td>
                      <td className="p-4">
                         <button 
                          onClick={() => handleToggle(song.id)}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border ${song.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                        >
                          {song.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                        </button>
                      </td>
                      <td className="p-4 pr-6">
                        <div className="flex items-center justify-center gap-2">
                          {song.driveLink ? (
                            <a href={song.driveLink} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition" title="Link Drive">
                              <Link className="w-4 h-4" />
                            </a>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-300 cursor-not-allowed">
                              <Link className="w-4 h-4" />
                            </div>
                          )}
                          <button onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition" title="Edit">
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(song.id)} className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition" title="Hapus">
                            <Trash2 className="w-4 h-4" />
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
