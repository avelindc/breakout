"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  Upload, Database, LayoutList, CheckCircle2, AlertCircle, PlayCircle, Settings
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

  const LIMIT = 20;

  const fetchSongs = useCallback(async (pageNum: number, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    const res = await getPublisherCatalogAction({
      page: pageNum, limit: LIMIT, search, publisher: filterPublisher, artist: filterArtist,
    });
    
    if (res.success && res.songs) {
      setSongs(prev => isNewSearch ? res.songs : [...prev, ...res.songs]);
      setTotal(res.total || 0);
      setHasMore(res.songs.length === LIMIT);
    }
    
    setLoading(false);
    setLoadingMore(false);
  }, [search, filterPublisher, filterArtist]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchSongs(1, true);
    }, 500);
    return () => clearTimeout(t);
  }, [search, filterPublisher, filterArtist, fetchSongs]);

  const loadMore = useCallback(() => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSongs(nextPage, false);
    }
  }, [loading, loadingMore, hasMore, page, fetchSongs]);

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
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900/60 to-blue-800/20 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 shadow-lg flex flex-wrap gap-4 items-center justify-between">
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
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50 border border-blue-400/50"
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

        <div className="bg-gradient-to-br from-red-900/40 to-red-800/10 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-6 border border-red-500/20 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-lg font-bold text-red-100 flex items-center gap-2 mb-1">
              <AlertCircle className="w-5 h-5 text-red-400" /> Zona Bahaya
            </h3>
            <p className="text-sm text-red-200/70 font-medium">Tindakan ini tidak bisa dikembalikan.</p>
          </div>
          <button
            onClick={handleClearAll} disabled={isClearing || total === 0}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-500/20 text-red-300 rounded-xl font-bold hover:bg-red-500/40 transition-all border border-red-400/30 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Hapus Seluruh Database
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
      <div className="bg-white/5 backdrop-blur-md md:backdrop-blur-xl rounded-[2rem] p-5 md:p-6 border border-white/10 shadow-lg transform-gpu">
        <div className="flex items-center gap-3 mb-5">
          <LayoutList className="w-5 h-5 text-blue-300" />
          <h3 className="text-lg font-bold text-white">Filter & Cari Data</h3>
          
          <button onClick={() => { setPage(1); fetchSongs(1, true); }} className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-200 rounded-lg text-sm font-bold hover:bg-blue-500/40 transition-all border border-blue-400/20">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> <span className="hidden sm:inline">Refresh</span>
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

      {/* Premium Virtualized Grid */}
      <div className="transform-gpu">
        {loading && songs.length === 0 ? (
           <div className="py-24 flex justify-center"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /></div>
        ) : songs.length === 0 ? (
           <div className="py-24 text-center text-blue-300 font-medium">Belum ada data. Import Excel atau tambah manual.</div>
        ) : (
          <div className="overflow-x-auto touch-pan-y">
          <div className="bg-transparent border-none shadow-none pb-10">
            <VirtuosoGrid
              useWindowScroll
              data={songs}
              endReached={loadMore}
              overscan={200}
              listClassName="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
              itemClassName="w-full"
              itemContent={(index, song) => {
                const ytLink = getYoutubeLink(song);
                return (
                  <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all p-5 sm:p-6 group flex flex-col h-full">
                    <div className="flex gap-4 items-start mb-5">
                      <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-300 shadow-inner">
                        <img src="/images/music-default.jpg" alt="Cover" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {song.title || "-"}
                        </h3>
                        <p className="text-sm font-medium text-gray-500 truncate mt-1 uppercase tracking-wider">{getCleanText(song.artist)}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 flex-1 mb-5">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Composer</span>
                        <span className="text-sm font-bold text-gray-700 truncate max-w-[60%] text-right">{getCleanText(song.composer)}</span>
                      </div>
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-sm font-semibold text-gray-400">Publisher</span>
                        <span className="text-sm font-black text-gray-900 truncate max-w-[60%] text-right uppercase">{song.publisher || "-"}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-3">
                      {ytLink ? (
                        <a 
                          href={ytLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="w-12 h-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors shrink-0 border border-red-100 hover:border-red-500"
                          title="Buka di YouTube"
                        >
                          <PlayCircle className="w-5 h-5" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gray-50 text-gray-300 flex items-center justify-center shrink-0 border border-gray-100 cursor-not-allowed">
                          <PlayCircle className="w-5 h-5" />
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setEditingSong(song); setErrorMsg(""); setIsModalOpen(true); }}
                        className="flex-1 h-12 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-blue-600 font-bold flex items-center justify-center gap-2 transition-colors border border-gray-100 hover:border-blue-200"
                      >
                        <Settings className="w-4 h-4" /> Buka Detail
                      </button>
                      
                      <button 
                        onClick={() => handleDelete(song.id)}
                        className="w-12 h-12 rounded-xl bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shrink-0 border border-gray-100 hover:border-red-200"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              }}
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
