"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  getPublisherCatalogAction,
  getPublisherCatalogFiltersAction,
  importPublisherCatalogExcelAction,
  importPublisherCatalogPdfAction,
  createPublisherCatalogSongAction,
  updatePublisherCatalogSongAction,
  deletePublisherCatalogSongAction,
  deleteAllPublisherCatalogAction,
  deletePublisherCatalogByPublisherAction,
} from "@/app/actions/publisherCatalog";
import {
  Loader2, RefreshCw, Trash2, Search, Plus, Edit, X,
  Upload, Database, LayoutList, CheckCircle2, AlertCircle, PlayCircle, Settings, ChevronLeft, ChevronRight, Library
} from "lucide-react";
import { useRouter } from "next/navigation";
import { VirtuosoGrid } from "react-virtuoso";

const getYoutubeLink = (song: any) => {
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s|]+)/i;
  let match = null;
  if (song.keterangan) match = song.keterangan.match(ytRegex);
  if (!match && song.composer) match = song.composer.match(ytRegex);
  if (!match && song.artist) match = song.artist.match(ytRegex);
  return match ? match[1] : null;
};

const getCleanText = (text: string | null) => {
  if (!text) return "-";
  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^\s|]+)/i;
  const clean = text.replace(ytRegex, '').replace(/^URL:\s*/i, '').replace(/YOUTUBE LINK REFERENCE:\s*/i, '').replace(/Youtube link \(if Any\):\s*/i, '').replace(/\|\s*$/, '').trim();
  return clean || "-";
};

export function PublisherCatalogAdminClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [songs, setSongs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterPublisher, setFilterPublisher] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [hasMore, setHasMore] = useState(true);

  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success?: boolean; error?: string; count?: number } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSong, setEditingSong] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  const [publishers, setPublishers] = useState<string[]>([]);
  const [deleteSelection, setDeleteSelection] = useState<string>("");

  const LIMIT = 20;

  const fetchPublishers = useCallback(async () => {
    const res = await getPublisherCatalogFiltersAction();
    if (res.success) setPublishers(res.publishers || []);
  }, []);

  useEffect(() => {
    fetchPublishers();
  }, [fetchPublishers]);

  const fetchSongs = useCallback(async (pageNum: number, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    const res = await getPublisherCatalogAction({
      page: pageNum, limit: LIMIT, search, publisher: filterPublisher, artist: filterArtist,
    });
    
    if (res.success && res.songs) {
      setSongs(res.songs);
      setTotal(res.total || 0);
    }
    
    setLoading(false);
  }, [search, filterPublisher, filterArtist]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchSongs(1, true);
    }, 500);
    return () => clearTimeout(t);
  }, [search, filterPublisher, filterArtist, fetchSongs]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchSongs(newPage, true);
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
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    return pages;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const defaultPub = prompt("Masukkan Nama Publisher untuk file ini (Kosongkan jika di dalam file Excel sudah ada kolom khusus Publisher):");
    
    setIsImporting(true);
    setImportResult(null);
    const formData = new FormData();
    formData.append("file", file);
    if (defaultPub) {
      formData.append("defaultPublisher", defaultPub);
    }
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    const res = isExcel
      ? await importPublisherCatalogExcelAction(formData)
      : await importPublisherCatalogPdfAction(formData);
    setIsImporting(false);
    setImportResult(res.error ? { error: res.error } : { success: true, count: (res as any).count });
    if (!res.error) { setPage(1); fetchSongs(1, true); router.refresh(); }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearDatabase = async () => {
    if (!deleteSelection) {
      alert("Pilih data yang ingin dihapus terlebih dahulu.");
      return;
    }
    
    if (deleteSelection === "ALL") {
      if (!confirm("YAKIN HAPUS SEMUA DATA PUBLISHER CATALOG? Tindakan ini tidak dapat dibatalkan.")) return;
      setIsClearing(true);
      const res = await deleteAllPublisherCatalogAction();
      setIsClearing(false);
      if (res.success) { 
        setSongs([]); setTotal(0); fetchPublishers(); router.refresh(); 
        setDeleteSelection("");
      } else {
        alert(res.error);
      }
    } else {
      if (!confirm(`Yakin hapus data untuk publisher: ${deleteSelection}?`)) return;
      setIsClearing(true);
      const res = await deletePublisherCatalogByPublisherAction(deleteSelection);
      setIsClearing(false);
      if (res.success) { 
        setPage(1); fetchSongs(1, true); fetchPublishers(); router.refresh(); 
        setDeleteSelection("");
      } else {
        alert(res.error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus lagu ini?")) return;
    await deletePublisherCatalogSongAction(id);
    setPage(1);
    fetchSongs(1, true);
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
    else { setIsModalOpen(false); setEditingSong(null); setPage(1); fetchSongs(1, true); router.refresh(); }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
      
      {/* Header Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 transform-gpu">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-[2rem] p-4 md:p-6 border border-white shadow-md flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center border border-purple-200">
              <Database className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Database Publisher</h2>
              <p className="text-gray-500 text-sm font-medium">{total.toLocaleString("id-ID")} lagu terdaftar di sistem</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" className="hidden" onChange={handleImport} />
            
            <button
              onClick={() => fileInputRef.current?.click()} disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 border border-purple-500"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isImporting ? "Proses..." : "Smart Import"}
            </button>
            <button
              onClick={() => { setEditingSong(null); setErrorMsg(""); setIsModalOpen(true); }}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all border border-gray-200"
            >
              <Plus className="w-4 h-4" /> Tambah Manual
            </button>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-4 md:p-6 border border-white flex flex-col shadow-md">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-red-600 flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-500" /> Zona Bahaya
            </h3>
            <p className="text-sm text-gray-500 font-medium">Hapus data berdasarkan publisher atau semuanya.</p>
          </div>
          
          <select
            value={deleteSelection}
            onChange={(e) => setDeleteSelection(e.target.value)}
            className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl px-4 py-2.5 outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/10 transition-all font-medium mb-3 text-sm cursor-pointer"
          >
            <option value="">-- Pilih Data yang Dihapus --</option>
            {publishers.map((p) => (
              <option key={p} value={p}>Hapus Publisher: {p}</option>
            ))}
            <option value="ALL" className="text-red-600 font-bold">⚠️ HAPUS SELURUH DATABASE</option>
          </select>
          
          <button
            onClick={handleClearDatabase} disabled={isClearing || !deleteSelection}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-all border border-red-200 disabled:opacity-30 disabled:cursor-not-allowed text-sm"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleteSelection === "ALL" ? "Hapus Semua Data" : deleteSelection ? "Hapus Publisher" : "Hapus Data"}
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-5 rounded-2xl border flex items-start gap-4 animate-scale-up shadow-lg transform-gpu ${importResult.success ? "bg-emerald-900/40 text-emerald-100 border-emerald-500/30" : "bg-red-900/40 text-red-100 border-red-500/30"}`}>
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
      <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-5 md:p-6 border border-white shadow-md transform-gpu">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Filter & Cari Data</h3>
          
          <button onClick={() => { setPage(1); fetchSongs(1, true); }} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-sm font-bold hover:bg-purple-100 transition-all border border-purple-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text" placeholder="Cari judul, ISRC..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 pr-4 py-3.5 w-full bg-white/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl outline-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
            />
          </div>
          <input
            type="text" placeholder="Filter Publisher..." value={filterPublisher}
            onChange={(e) => setFilterPublisher(e.target.value)}
            className="px-5 py-3.5 w-full bg-white/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl outline-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
          />
          <input
            type="text" placeholder="Filter Artis..." value={filterArtist}
            onChange={(e) => setFilterArtist(e.target.value)}
            className="px-5 py-3.5 w-full bg-white/80 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-xl outline-none focus:border-purple-400 focus:bg-white focus:ring-4 focus:ring-purple-500/10 transition-all font-medium"
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-2">
        <div>{total > 0 ? `${startItem}-${endItem} dari ${total.toLocaleString("id-ID")} lagu` : "Tidak ada data"}</div>
      </div>

      {/* Premium Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-3 md:p-6 transform-gpu">
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-3 md:p-4 font-bold pl-4 md:pl-6">SONG ID</th>
                <th className="p-3 md:p-4 font-bold">JUDUL LAGU</th>
                <th className="p-3 md:p-4 font-bold">KOMPOSER</th>
                <th className="p-3 md:p-4 font-bold">PUBLISHER</th>
                <th className="p-3 md:p-4 font-bold">PERFORMER</th>
                <th className="p-3 md:p-4 font-bold text-center pr-4 md:pr-6">AKSI</th>
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
                      <p className="text-sm">Import Excel atau tambah manual.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                songs.map((song, i) => {
                  const displayId = song.isrc || `SNG${(startItem + i).toString().padStart(6, '0')}`;
                  const ytLink = getYoutubeLink(song);
                  
                  return (
                    <tr key={song.id} className="hover:bg-gray-50/80 transition group">
                      <td className="p-3 md:p-4 pl-4 md:pl-6">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#cdff9c] text-green-900 whitespace-nowrap shadow-sm">
                          {displayId}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 font-bold text-gray-800 text-sm">
                        {song.title || "-"}
                      </td>
                      <td className="p-3 md:p-4 text-sm text-gray-600">
                        {getCleanText(song.composer)}
                      </td>
                      <td className="p-3 md:p-4 text-xs text-gray-600 uppercase font-medium">
                        {song.publisher || "-"}
                      </td>
                      <td className="p-3 md:p-4 text-sm text-gray-600">
                        {getCleanText(song.artist)}
                      </td>
                      <td className="p-3 md:p-4 pr-4 md:pr-6">
                        <div className="flex items-center justify-center gap-2">
                          {ytLink ? (
                            <a href={ytLink} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition" title="YouTube">
                              <PlayCircle className="w-4 h-4" />
                            </a>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-300 cursor-not-allowed">
                              <PlayCircle className="w-4 h-4" />
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

      {/* Premium Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in transform-gpu">
          <div className="bg-gradient-to-b from-[#1c2331] to-[#121620] rounded-[2rem] w-full max-w-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden max-h-[90vh] flex flex-col border border-white/10 transform animate-scale-up transform-gpu">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
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
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto overscroll-contain touch-pan-y space-y-4">
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
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 flex justify-center items-center gap-2 border border-blue-400/50"
                >
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
