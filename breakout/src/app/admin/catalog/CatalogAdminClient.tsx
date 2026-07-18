"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, deleteCatalogSongAction, createCatalogSongAction, updateCatalogSongAction, toggleCatalogSongStatusAction, deleteAllCatalogAction } from "@/app/actions/catalog";
import { Loader2, RefreshCw, Trash2, Search, Plus, Edit, Music, X, Link, Mic2, AlertCircle, LayoutList, Database } from "lucide-react";
import { useRouter } from "next/navigation";

export function CatalogAdminClient({ initialTotal }: { initialTotal: number }) {
  const router = useRouter();
  
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const fetchSongs = async (pageNum = 1, searchQuery = search) => {
    setLoading(true);
    const res = await getCatalogSongsAction({ page: pageNum, limit: 10, search: searchQuery, isAdmin: true });
    if (res.success && res.songs) {
      setSongs(res.songs);
    }
    setLoading(false);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchSongs(1, search);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleClearAll = async () => {
    if (!confirm("Yakin ingin hapus SEMUA lagu dari katalog? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsClearing(true);
    const res = await deleteAllCatalogAction();
    setIsClearing(false);
    if (res.success) {
      setSongs([]);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini dari katalog?")) return;
    const res = await deleteCatalogSongAction(id);
    if (res.success) {
      fetchSongs(page, search);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleToggle = async (id: string) => {
    const res = await toggleCatalogSongStatusAction(id, 'isActive');
    if (res.success) {
      fetchSongs(page, search);
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
        fetchSongs(page, search);
        router.refresh();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = () => {
    setEditingSong(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (song: any) => {
    setEditingSong(song);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/60 to-blue-800/20 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center border border-blue-400/30">
              <Database className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Database Katalog MP3</h2>
              <p className="text-blue-200/70 text-sm font-medium">{initialTotal.toLocaleString("id-ID")} lagu terdaftar di sistem</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button 
              onClick={openAddModal}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all border border-blue-400/50"
            >
              <Plus className="w-4 h-4" />
              Tambah Data Baru
            </button>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-900/40 to-red-800/10 backdrop-blur-xl rounded-[2rem] p-6 border border-red-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-red-100 flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-400" /> Zona Bahaya
            </h3>
            <p className="text-sm text-red-200/70 font-medium">Tindakan ini tidak bisa dikembalikan.</p>
          </div>
          <button 
            onClick={handleClearAll}
            disabled={isClearing || initialTotal === 0}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/40 hover:text-red-100 transition-all border border-red-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Seluruh Katalog
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Cari Data Katalog MP3</h3>
          
          <button onClick={() => fetchSongs(page, search)} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-sm font-bold hover:bg-blue-500/40 transition-all border border-blue-400/20">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
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

      {/* Premium Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-clip shadow-2xl">
        <div className="overflow-x-auto touch-pan-y">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-black/20 border-b border-white/10">
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">Judul</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">Artist</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">Vokal</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">Publisher</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">Link Drive</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-blue-300">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Memuat katalog...
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-blue-300 font-medium">
                    Katalog kosong atau lagu tidak ditemukan.
                  </td>
                </tr>
              ) : (
                songs.map((song, i) => (
                  <tr key={song.id} className={`group hover:bg-white/[0.08] transition-all ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                    <td className="px-5 py-4 font-bold text-white group-hover:text-blue-300 transition-colors max-w-[200px] truncate">{song.title}</td>
                    <td className="px-5 py-4 text-blue-100/90 text-sm font-medium max-w-[140px] truncate">{song.artist}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm max-w-[120px] truncate">{song.vokal || '-'}</td>
                    <td className="px-5 py-4 text-gray-400 text-sm max-w-[130px] truncate">
                      {song.publisher ? <span className="px-2.5 py-1 bg-white/5 rounded-md border border-white/5">{song.publisher}</span> : "-"}
                    </td>
                    <td className="px-5 py-4 text-sm">
                      {song.driveLink ? (
                        <a href={song.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-300 font-bold hover:bg-blue-500/20 hover:text-white transition-all border border-transparent hover:border-blue-400/30">
                          <Link className="w-3 h-3" /> Buka Link
                        </a>
                      ) : (
                        <span className="text-gray-500 italic">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button 
                        onClick={() => handleToggle(song.id)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${song.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50' : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50'}`}
                      >
                        {song.isActive ? '✅ Aktif' : '❌ Nonaktif'}
                      </button>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(song)}
                          className="p-2 text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/40 rounded-xl transition-all border border-transparent hover:border-blue-400/30"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(song.id)}
                          className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/40 rounded-xl transition-all border border-transparent hover:border-red-400/30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-5 border-t border-white/5 bg-black/10 flex items-center justify-between gap-4 flex-wrap">
          <button 
            disabled={page === 1} 
            onClick={() => { setPage(p => p - 1); fetchSongs(page - 1); }}
            className="px-5 py-2.5 bg-white/5 text-white rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all border border-white/10 text-sm font-bold flex items-center gap-2"
          >
            ← Prev
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Halaman</span>
            <span className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white font-bold text-sm shadow-lg">{page}</span>
          </div>

          <button 
            disabled={songs.length < 10} 
            onClick={() => { setPage(p => p + 1); fetchSongs(page + 1); }}
            className="px-5 py-2.5 bg-white/5 text-white rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all border border-white/10 text-sm font-bold flex items-center gap-2"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Premium Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col border border-white/10 transform animate-scale-up">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingSong ? <Edit className="w-5 h-5 text-blue-400"/> : <Plus className="w-5 h-5 text-blue-400"/>}
                {editingSong ? 'Edit Data Lagu' : 'Tambah Data Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain space-y-4">
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
