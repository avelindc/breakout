"use client";

import { useState, useRef, useEffect } from "react";
import { uploadCatalogExcelAction, getCatalogSongsAction, deleteAllCatalogAction, deleteCatalogSongAction } from "@/app/actions/catalog";
import { Loader2, UploadCloud, RefreshCw, Trash2, Search, FileSpreadsheet } from "lucide-react";
import { useRouter } from "next/navigation";

export function CatalogAdminClient({ initialTotal }: { initialTotal: number }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{success?: boolean, error?: string, count?: number} | null>(null);
  
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const fetchSongs = async (pageNum = 1, searchQuery = search) => {
    setLoading(true);
    const res = await getCatalogSongsAction({ page: pageNum, limit: 10, search: searchQuery });
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await uploadCatalogExcelAction(formData);
    
    setIsUploading(false);
    if (res.error) {
      setUploadResult({ error: res.error });
    } else {
      setUploadResult({ success: true, count: res.count });
      setPage(1);
      fetchSongs(1, search);
      router.refresh(); // Refresh to update total count on page
    }
    
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to delete ALL catalog songs? This cannot be undone.")) return;
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
    if (!confirm("Delete this song?")) return;
    const res = await deleteCatalogSongAction(id);
    if (res.success) {
      fetchSongs(page, search);
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <input 
          type="file" 
          accept=".xlsx, .xls"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
          {isUploading ? "Uploading & Processing..." : "Upload Excel"}
        </button>

        <button 
          onClick={() => fetchSongs(page, search)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <button 
          onClick={handleClearAll}
          disabled={isClearing}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition ml-auto disabled:opacity-50"
        >
          <Trash2 className="w-5 h-5" />
          Hapus Semua Katalog
        </button>
      </div>

      {uploadResult && (
        <div className={`p-4 rounded-xl ${uploadResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {uploadResult.success 
            ? `Berhasil memproses dan menyimpan ${uploadResult.count} lagu ke database!` 
            : `Gagal upload: ${uploadResult.error}`
          }
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Daftar Katalog</h2>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Cari lagu, artis..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-4 text-sm font-semibold text-gray-500">Judul Lagu</th>
                <th className="p-4 text-sm font-semibold text-gray-500">Artis</th>
                <th className="p-4 text-sm font-semibold text-gray-500">Publisher</th>
                <th className="p-4 text-sm font-semibold text-gray-500">ISRC</th>
                <th className="p-4 text-sm font-semibold text-gray-500 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && songs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat katalog...
                  </td>
                </tr>
              ) : songs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Katalog kosong atau lagu tidak ditemukan.
                  </td>
                </tr>
              ) : (
                songs.map(song => (
                  <tr key={song.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{song.title}</td>
                    <td className="p-4 text-gray-600">{song.artist}</td>
                    <td className="p-4 text-gray-500">{song.publisher || '-'}</td>
                    <td className="p-4 text-gray-500">{song.isrc || '-'}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Simple pagination for admin */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between">
          <button 
            disabled={page === 1} 
            onClick={() => { setPage(p => p - 1); fetchSongs(page - 1); }}
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Sebelumnya
          </button>
          <span className="text-sm font-medium text-gray-500">Halaman {page}</span>
          <button 
            disabled={songs.length < 10} 
            onClick={() => { setPage(p => p + 1); fetchSongs(page + 1); }}
            className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-100"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
