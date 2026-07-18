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
  Upload, FileSpreadsheet, FileText
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
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-blue-700/60 backdrop-blur-sm p-5 rounded-3xl border border-blue-500/30">
        <input
          ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf"
          className="hidden" onChange={handleImport}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
          className="flex items-center gap-2 px-5 py-3 bg-white text-blue-600 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
        >
          {isImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
          {isImporting ? "Mengimport..." : "Import Excel / PDF"}
        </button>

        <button
          onClick={() => { setEditingSong(null); setErrorMsg(""); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-3 bg-blue-500/50 text-white rounded-xl font-bold hover:bg-blue-500/70 transition border border-blue-400/30"
        >
          <Plus className="w-5 h-5" /> Tambah Manual
        </button>

        <button
          onClick={() => fetchSongs(page)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-500/30 text-white rounded-xl font-bold hover:bg-blue-500/50 transition border border-blue-400/20"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>

        <button
          onClick={handleClearAll} disabled={isClearing}
          className="flex items-center gap-2 px-5 py-3 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/30 transition border border-red-400/20 ml-auto disabled:opacity-50"
        >
          {isClearing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
          Hapus Semua
        </button>
      </div>

      {importResult && (
        <div className={`p-4 rounded-xl border text-sm ${importResult.success ? "bg-green-500/20 text-green-300 border-green-400/30" : "bg-red-500/20 text-red-300 border-red-400/30"}`}>
          {importResult.success ? `✅ Berhasil import ${importResult.count} lagu ke database!` : `❌ ${importResult.error}`}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-blue-300 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Cari judul, artis, ISRC..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 w-full bg-blue-700/50 border border-blue-400/30 text-white placeholder-blue-300 rounded-xl outline-none focus:border-white/50"
          />
        </div>
        <input
          type="text" placeholder="Filter Publisher..." value={filterPublisher}
          onChange={(e) => setFilterPublisher(e.target.value)}
          className="px-4 py-2.5 w-full bg-blue-700/50 border border-blue-400/30 text-white placeholder-blue-300 rounded-xl outline-none focus:border-white/50"
        />
        <input
          type="text" placeholder="Filter Artis..." value={filterArtist}
          onChange={(e) => setFilterArtist(e.target.value)}
          className="px-4 py-2.5 w-full bg-blue-700/50 border border-blue-400/30 text-white placeholder-blue-300 rounded-xl outline-none focus:border-white/50"
        />
      </div>

      <div className="text-sm text-blue-200 font-medium">Total: {total.toLocaleString("id-ID")} lagu</div>

      {/* Table */}
      <div className="bg-blue-700/60 backdrop-blur-sm rounded-3xl border border-blue-500/30 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-blue-800/50">
                {["Judul", "Artis", "Publisher", "Composer", "Album", "ISRC", "Tahun", "Aksi"].map(h => (
                  <th key={h} className="p-3 text-xs font-semibold text-blue-200 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-600/30">
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-blue-300"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : songs.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-blue-300">Belum ada data. Import Excel atau tambah manual.</td></tr>
              ) : songs.map(song => (
                <tr key={song.id} className="hover:bg-blue-600/20 transition">
                  <td className="p-3 font-medium text-white max-w-[180px] truncate">{song.title || "-"}</td>
                  <td className="p-3 text-blue-200 text-sm max-w-[140px] truncate">{song.artist || "-"}</td>
                  <td className="p-3 text-blue-300 text-sm max-w-[120px] truncate">{song.publisher || "-"}</td>
                  <td className="p-3 text-blue-300 text-sm max-w-[120px] truncate">{song.composer || "-"}</td>
                  <td className="p-3 text-blue-300 text-sm max-w-[120px] truncate">{song.album || "-"}</td>
                  <td className="p-3 text-blue-400 text-xs font-mono">{song.isrc || "-"}</td>
                  <td className="p-3 text-blue-300 text-sm">{song.year || "-"}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }}
                        className="p-1.5 text-blue-300 hover:bg-blue-500/20 rounded-lg transition">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(song.id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition">
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
        <div className="p-4 border-t border-blue-600/30 flex items-center justify-between gap-2">
          <button disabled={page === 1} onClick={() => { setPage(p => p - 1); fetchSongs(page - 1); }}
            className="px-4 py-2 bg-blue-600/50 text-blue-200 rounded-lg disabled:opacity-40 hover:bg-blue-600/70 transition border border-blue-500/30 text-sm">
            ← Sebelumnya
          </button>
          <span className="text-sm text-blue-300 font-medium">Halaman {page} / {Math.max(1, totalPages)}</span>
          <button disabled={page >= totalPages} onClick={() => { setPage(p => p + 1); fetchSongs(page + 1); }}
            className="px-4 py-2 bg-blue-600/50 text-blue-200 rounded-lg disabled:opacity-40 hover:bg-blue-600/70 transition border border-blue-500/30 text-sm">
            Selanjutnya →
          </button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editingSong ? "Edit Lagu" : "Tambah Lagu Baru"}</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3">
              {errorMsg && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-lg">{errorMsg}</div>}

              {[
                { name: "title", label: "Judul", required: false },
                { name: "artist", label: "Artis", required: false },
                { name: "publisher", label: "Publisher", required: false },
                { name: "composer", label: "Composer", required: false },
                { name: "album", label: "Album", required: false },
                { name: "isrc", label: "ISRC", required: false },
                { name: "upc", label: "UPC", required: false },
                { name: "year", label: "Tahun", required: false },
                { name: "keterangan", label: "Keterangan / Lainnya", required: false },
              ].map(field => (
                <div key={field.name} className="space-y-1">
                  <label className="text-sm font-semibold text-gray-700">{field.label}</label>
                  <input
                    name={field.name} required={field.required}
                    defaultValue={editingSong?.[field.name] || ""}
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 outline-none focus:border-blue-500"
                    placeholder={field.label.replace(" *", "")}
                  />
                </div>
              ))}

              <button type="submit" disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2 mt-4">
                {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
