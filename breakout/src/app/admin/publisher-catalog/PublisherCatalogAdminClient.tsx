"use client";

import { useState, useEffect, useRef } from "react";
import {
  getPublisherCatalogAction,
  importPublisherCatalogExcelAction,
  importPublisherCatalogPdfAction,
  createPublisherCatalogSongAction,
  updatePublisherCatalogSongAction,
  deletePublisherCatalogSongAction,
  deleteAllPublisherCatalogAction,
} from "@/app/actions/publisherCatalog";
import {
  Loader2, RefreshCw, Trash2, Search, Plus, Edit, X,
  Upload, Database, LayoutList, CheckCircle2, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

export function PublisherCatalogAdminClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterArtist, setFilterArtist] = useState("");

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const LIMIT = 15;

  const fetchSongs = async (p = page) => {
    setLoading(true);
    const res = await getPublisherCatalogAction({
      page: p, limit: LIMIT, search, publisher: filterPublisher, artist: filterArtist,
    });
    if (res.success && res.songs) {
      setSongs(res.songs);
      setTotal(res.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchSongs(1); }, 500);
    return () => clearTimeout(t);
  }, [search, filterPublisher, filterArtist]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const res = isExcel
      ? await importPublisherCatalogExcelAction(formData)
      : await importPublisherCatalogPdfAction(formData);
    setIsImporting(false);
    setImportResult(res.error ? { error: res.error } : { success: true, count: (res as any).count });
    if (!res.error) { setPage(1); fetchSongs(1); router.refresh(); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearAll = async () => {
    if (!confirm("Yakin hapus SEMUA data Publisher Catalog? Tindakan ini tidak dapat dibatalkan.")) return;
    setIsClearing(true);
    const res = await deleteAllPublisherCatalogAction();
    setIsClearing(false);
    if (res.success) { setSongs([]); setTotal(0); router.refresh(); }
    else alert(res.error);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini?")) return;
    await deletePublisherCatalogSongAction(id);
    fetchSongs(page);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    const res = editingSong
      ? await updatePublisherCatalogSongAction(editingSong.id, formData)
      : await createPublisherCatalogSongAction(formData);
    setIsSubmitting(false);
    if (res.error) { setErrorMsg(res.error); }
    else { setIsModalOpen(false); setEditingSong(null); fetchSongs(page); router.refresh(); }
  };

  const totalPages = Math.ceil(total / LIMIT);

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
              <h2 className="text-xl font-bold text-white">Database Publisher</h2>
              <p className="text-blue-200/70 text-sm font-medium">{total.toLocaleString("id-ID")} lagu terdaftar di sistem</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" className="hidden" onChange={handleImport} />
            
            <button
              onClick={() => fileInputRef.current?.click()} disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 border border-blue-400/50"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isImporting ? "Proses..." : "Smart Import"}
            </button>
            <button
              onClick={() => { setEditingSong(null); setErrorMsg(""); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
            >
              <Plus className="w-4 h-4" /> Tambah Manual
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
            onClick={handleClearAll} disabled={isClearing || total === 0}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/40 hover:text-red-100 transition-all border border-red-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Seluruh Database
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-5 rounded-2xl border flex items-start gap-4 animate-scale-up shadow-lg ${importResult.success ? "bg-emerald-900/40 text-emerald-100 border-emerald-500/30" : "bg-red-900/40 text-red-100 border-red-500/30"}`}>
          {importResult.success ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <h4 className="font-bold text-lg mb-1">{importResult.success ? "Import Berhasil!" : "Import Gagal"}</h4>
            <p className="text-sm opacity-80 font-medium">
              {importResult.success ? `Sebanyak ${importResult.count} data lagu baru telah berhasil ditambahkan ke database dari file yang Anda unggah.` : importResult.error}
            </p>
          </div>
        </div>
      )}

      {/* Advanced Filters */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Filter & Cari Data</h3>
          
          <button onClick={() => fetchSongs(page)} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-sm font-bold hover:bg-blue-500/40 transition-all border border-blue-400/20">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Cari judul, ISRC..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3.5 w-full bg-black/20 border border-white/10 text-white placeholder-blue-200/50 rounded-xl outline-none focus:border-blue-400/50 focus:bg-black/40 transition-all font-medium"
            />
          </div>
          <input
            type="text" placeholder="Filter Publisher..." value={filterPublisher}
            onChange={(e) => setFilterPublisher(e.target.value)}
            className="px-5 py-3.5 w-full bg-black/20 border border-white/10 text-white placeholder-blue-200/50 rounded-xl outline-none focus:border-blue-400/50 focus:bg-black/40 transition-all font-medium"
          />
          <input
            type="text" placeholder="Filter Artis..." value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            className="px-5 py-3.5 w-full bg-black/20 border border-white/10 text-white placeholder-blue-200/50 rounded-xl outline-none focus:border-blue-400/50 focus:bg-black/40 transition-all font-medium"
          />
        </div>
      </div>

      {/* Premium Table */}
      <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-black/20 border-b border-white/10">
                {["Judul", "Artis", "Publisher", "Composer", "Album", "ISRC", "Tahun", "Aksi"].map(h => (
                  <th key={h} className="px-5 py-4 text-xs font-bold text-blue-300/70 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={8} className="p-12 text-center text-blue-300"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></td></tr>
              ) : songs.length === 0 ? (
                <tr><td colSpan={8} className="p-12 text-center text-blue-300 font-medium">Belum ada data. Import Excel atau tambah manual.</td></tr>
              ) : songs.map((song, i) => (
                <tr key={song.id} className={`group hover:bg-white/[0.08] transition-all ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}>
                  <td className="px-5 py-4 font-bold text-white max-w-[200px] truncate group-hover:text-blue-300 transition-colors">{song.title || "-"}</td>
                  <td className="px-5 py-4 text-blue-100/90 text-sm font-medium max-w-[140px] truncate">{song.artist || "-"}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm max-w-[130px] truncate">
                    {song.publisher ? <span className="px-2.5 py-1 bg-white/5 rounded-md border border-white/5">{song.publisher}</span> : "-"}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-sm max-w-[120px] truncate">{song.composer || "-"}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm max-w-[120px] truncate">{song.album || "-"}</td>
                  <td className="px-5 py-4 text-blue-300/80 text-xs font-mono">{song.isrc || "-"}</td>
                  <td className="px-5 py-4 text-gray-400 text-sm font-medium">{song.year || "-"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }}
                        className="p-2 text-blue-300 hover:text-white bg-blue-500/10 hover:bg-blue-500/40 rounded-xl transition-all border border-transparent hover:border-blue-400/30">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(song.id)}
                        className="p-2 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/40 rounded-xl transition-all border border-transparent hover:border-red-400/30">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-5 border-t border-white/5 bg-black/10 flex items-center justify-between gap-4 flex-wrap">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchSongs(page - 1); }}
            className="px-5 py-2.5 bg-white/5 text-white rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all border border-white/10 text-sm font-bold flex items-center gap-2">
            ← Prev
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-medium">Halaman</span>
            <span className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-lg text-white font-bold text-sm shadow-lg">{page}</span>
            <span className="text-sm text-gray-400 font-medium">dari {Math.max(1, totalPages)}</span>
          </div>
          
          <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchSongs(page + 1); }}
            className="px-5 py-2.5 bg-white/5 text-white rounded-xl disabled:opacity-30 hover:bg-white/10 transition-all border border-white/10 text-sm font-bold flex items-center gap-2">
            Next →
          </button>
        </div>
      </div>

      {/* Premium Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col border border-white/10 transform animate-scale-up">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {editingSong ? <Edit className="w-5 h-5 text-blue-400"/> : <Plus className="w-5 h-5 text-blue-400"/>}
                {editingSong ? "Edit Data Lagu" : "Tambah Data Baru"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 text-sm font-medium rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: "title", label: "Judul Lagu" },
                  { name: "artist", label: "Nama Artis" },
                  { name: "publisher", label: "Publisher" },
                  { name: "composer", label: "Composer" },
                  { name: "album", label: "Album" },
                  { name: "year", label: "Tahun" },
                  { name: "isrc", label: "ISRC" },
                  { name: "upc", label: "UPC" },
                ].map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">{field.label}</label>
                    <input
                      name={field.name}
                      defaultValue={editingSong?.[field.name] || ""}
                      type="text"
                      className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium"
                      placeholder={`Masukkan ${field.label.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <label className="text-xs font-bold text-blue-200/70 uppercase tracking-wider pl-1">Keterangan / Data Lainnya</label>
                <textarea
                  name="keterangan"
                  defaultValue={editingSong?.keterangan || ""}
                  rows={3}
                  className="w-full bg-black/30 border border-white/10 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-black/50 transition-all font-medium resize-none"
                  placeholder="Data tambahan yang tidak masuk di atas..."
                ></textarea>
                <p className="text-xs text-gray-500 font-medium pl-1">Format saat diimport: Key1:Value1 | Key2:Value2</p>
              </div>

              <div className="pt-4 mt-2 border-t border-white/10">
                <button type="submit" disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-blue-400/50">
                  {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isSubmitting ? "Menyimpan Data..." : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
