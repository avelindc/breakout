"use client";

import { useState, useEffect } from "react";
import { getCatalogSongsAction, deleteCatalogSongAction, createCatalogSongAction, updateCatalogSongAction, toggleCatalogSongStatusAction } from "@/app/actions/catalog";
import { Loader2, RefreshCw, Trash2, Search, Plus, Edit, Music, X, Upload } from "lucide-react";
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

  const fetchSongs = async (pageNum = 1, searchQuery = search) => {
    setLoading(true);
    // Admins can see all, including inactive
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

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini? File MP3 dan Cover juga akan terhapus jika ada.")) return;
    const res = await deleteCatalogSongAction(id);
    if (res.success) {
      fetchSongs(page, search);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleToggle = async (id: string, field: 'isActive' | 'isDownloadable') => {
    const res = await toggleCatalogSongStatusAction(id, field);
    if (res.success) {
      fetchSongs(page, search);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    
    // Check if creating and file sizes
    const cover = formData.get("cover") as File;
    const audio = formData.get("audio") as File;

    if (!editingSong && audio && audio.size === 0) {
      setErrorMsg("File MP3 wajib diupload untuk lagu baru.");
      setIsSubmitting(false);
      return;
    }

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
      setErrorMsg(err.message || "An error occurred");
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
      </div>

      {/* Songs Table */}
      <div className="bg-blue-700/60 backdrop-blur-sm rounded-3xl border border-blue-500/30 overflow-hidden shadow-lg">
        <div className="p-6 border-b border-blue-500/30 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Daftar Katalog MP3</h2>
          <div className="relative">
            <Search className="w-5 h-5 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari lagu, artis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-blue-600/50 border border-blue-400/30 text-white placeholder-blue-300 rounded-lg outline-none focus:border-white/50 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-800/50">
                <th className="p-4 text-sm font-semibold text-blue-200">Lagu</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Publisher</th>
                <th className="p-4 text-sm font-semibold text-blue-200">Genre</th>
                <th className="p-4 text-sm font-semibold text-blue-200 text-center">Status</th>
                <th className="p-4 text-sm font-semibold text-blue-200 text-center">Download</th>
                <th className="p-4 text-sm font-semibold text-blue-200 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-600/30">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-blue-300">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat katalog...
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-blue-300">
                    Katalog kosong atau lagu tidak ditemukan.
                  </td>
                </tr>
              ) : (
                songs.map(song => (
                  <tr key={song.id} className="hover:bg-blue-600/30 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-blue-800 flex-shrink-0 flex items-center justify-center">
                          {song.coverUrl ? (
                            <img src={song.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                          ) : (
                            <Music className="w-5 h-5 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{song.title}</p>
                          <p className="text-xs text-blue-200">{song.artist}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-blue-200 text-sm">{song.publisher || '-'}</td>
                    <td className="p-4 text-blue-300 text-sm">{song.genre || '-'}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(song.id, 'isActive')}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${song.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}
                      >
                        {song.isActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleToggle(song.id, 'isDownloadable')}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${song.isDownloadable ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}
                      >
                        {song.isDownloadable ? 'Boleh' : 'Tidak'}
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
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSong ? 'Edit Lagu' : 'Tambah Lagu MP3 Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Judul Lagu *</label>
                  <input required name="title" defaultValue={editingSong?.title} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Nama Artis *</label>
                  <input required name="artist" defaultValue={editingSong?.artist} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Publisher</label>
                  <input name="publisher" defaultValue={editingSong?.publisher} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Genre</label>
                  <input name="genre" defaultValue={editingSong?.genre} type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500" placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Cover Image {editingSong ? '(Biarkan kosong jika tidak diubah)' : ''}</label>
                <div className="border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2 bg-gray-50">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <input name="cover" type="file" accept="image/*" className="w-full text-sm text-gray-600" />
                </div>
                {editingSong?.coverUrl && <p className="text-xs text-blue-600 mt-1">Cover saat ini sudah ada.</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">File MP3 {editingSong ? '(Biarkan kosong jika tidak diubah)' : '*'}</label>
                <div className="border border-gray-300 rounded-lg px-3 py-2 flex items-center gap-2 bg-gray-50">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <input name="audio" type="file" accept="audio/mpeg,audio/mp3" className="w-full text-sm text-gray-600" />
                </div>
                {editingSong?.audioUrl && <p className="text-xs text-blue-600 mt-1">Audio saat ini sudah ada.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="hidden" name="isActive" value="false" />
                  <input type="checkbox" name="isActive" value="true" defaultChecked={editingSong ? editingSong.isActive : true} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Status Aktif (Ditampilkan)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="hidden" name="isDownloadable" value="false" />
                  <input type="checkbox" name="isDownloadable" value="true" defaultChecked={editingSong ? editingSong.isDownloadable : false} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Boleh di Download</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-6 hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
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
