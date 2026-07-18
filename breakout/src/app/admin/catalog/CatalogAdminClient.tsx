"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, deleteCatalogSongAction, createCatalogSongAction, updateCatalogSongAction, toggleCatalogSongStatusAction, deleteAllCatalogAction } from "@/app/actions/catalog";
import { Loader2, RefreshCw, Trash2, Search, Plus, Edit, Music, X, Link, Mic2 } from "lucide-react";
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
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-blue-700/60 backdrop-blur-sm p-6 rounded-3xl border border-blue-500/30">
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Tambah Lagu Baru
        </button>

        <button 
          onClick={() => fetchSongs(page, search)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500/50 text-white rounded-xl font-bold hover:bg-blue-500/70 transition border border-blue-400/30"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <button 
          onClick={handleClearAll}
          disabled={isClearing}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/30 transition border border-red-400/20 ml-auto disabled:opacity-50"
        >
          {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          Hapus Semua Katalog
        </button>
      </div>

      {/* Songs Table */}
      <div className="bg-blue-700/60 backdrop-blur-sm rounded-3xl border border-blue-500/30 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Daftar Katalog</h2>
          <div className="relative w-full sm:w-auto">
            <Search className="w-5 h-5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari judul, artis, vokal..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-blue-600/50 border border-blue-400/30 text-white placeholder-blue-300 rounded-lg outline-none focus:border-white/50 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-blue-800/50">
                <th className="p-4 text-sm font-semibold text-blue-200">Judul</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Artist</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Vokal</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Publisher</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Link Drive</th>
                <th className="p-4 text-sm font-semibold text-blue-200 text-center">Status</th>
                <th className="p-4 text-sm font-semibold text-blue-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-600/30">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-blue-300">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat katalog...
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-blue-300">
                    Katalog kosong atau lagu tidak ditemukan.
                  </td>
                </tr>
              ) : (
                songs.map(song => (
                  <tr key={song.id} className="hover:bg-blue-600/30 transition">
                    <td className="p-4 font-medium text-white">{song.title}</td>
                    <td className="p-4 text-blue-200 text-sm">{song.artist}</td>
                    <td className="p-4 text-blue-200 text-sm">{song.vokal || '-'}</td>
                    <td className="p-4 text-blue-300 text-sm">{song.publisher || '-'}</td>
                    <td className="p-4 text-sm">
                      {song.driveLink ? (
                        <a href={song.driveLink} target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-white underline flex items-center gap-1">
                          <Link className="w-3 h-3" /> Buka
                        </a>
                      ) : (
                        <span className="text-blue-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(song.id)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${song.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                      >
                        {song.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openEditModal(song)}
                          className="p-2 text-blue-300 hover:bg-blue-500/20 rounded-lg transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(song.id)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
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
        <div className="p-4 border-t border-blue-600/30 flex items-center justify-between">
          <button 
            disabled={page === 1} 
            onClick={() => { setPage(p => p - 1); fetchSongs(page - 1); }}
            className="px-4 py-2 bg-blue-600/50 text-blue-200 rounded-lg disabled:opacity-40 hover:bg-blue-600/70 transition border border-blue-500/30"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-blue-300">Halaman {page}</span>
          <button 
            disabled={songs.length < 10} 
            onClick={() => { setPage(p => p + 1); fetchSongs(page + 1); }}
            className="px-4 py-2 bg-blue-600/50 text-blue-200 rounded-lg disabled:opacity-40 hover:bg-blue-600/70 transition border border-blue-500/30"
          >
            Selanjutnya
          </button>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSong ? 'Edit Lagu' : 'Tambah Lagu Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Judul *</label>
                <input required name="title" defaultValue={editingSong?.title} type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Masukkan judul lagu" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Artist *</label>
                <input required name="artist" defaultValue={editingSong?.artist} type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nama artis / pengarang" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Vokal</label>
                <input name="vokal" defaultValue={editingSong?.vokal} type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nama penyanyi / vokal" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700">Publisher</label>
                <input name="publisher" defaultValue={editingSong?.publisher} type="text" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="Nama publisher / label" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><Link className="w-4 h-4 text-blue-500" /> Link Drive</label>
                <input name="driveLink" defaultValue={editingSong?.driveLink} type="url" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                  placeholder="https://drive.google.com/..." />
              </div>

              <div className="pt-2 border-t">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="hidden" name="isActive" value="false" />
                  <input type="checkbox" name="isActive" value="true" 
                    defaultChecked={editingSong ? editingSong.isActive : true} 
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Status Aktif (Ditampilkan ke pengguna)</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-2 hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : "Simpan Lagu"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
