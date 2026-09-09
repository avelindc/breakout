"use client";

import React, { useState } from "react";
import { 
  X, Eye, Edit2, Play, Pause, CheckCircle2, Tag, 
  Compass, Radio, User, ChevronRight, ChevronLeft, Clock, Download, Trash2,
  Search, Filter, Disc, Loader2
} from "lucide-react";
import { bulkDeleteReleasesAction } from "@/app/actions/admin";

interface Track {
  id: string;
  title: string;
  audioUrl: string;
  composer: string | null;
  producer: string | null;
  lyrics: string | null;
  isrc: string | null;
  upc: string | null;
  tiktokClipStart: string | null;
}

interface Release {
  id: string;
  title: string;
  genre: string;
  language: string;
  primaryArtist: string;
  featuredArtist: string | null;
  releaseDate: Date | string;
  coverArtworkUrl: string;
  status: string;
  tracks: Track[];
}

export function UserReleasesClient({ releases }: { releases: Release[] }) {
  const [list, setList] = useState<Release[]>(releases);
  const [selected, setSelected] = useState<Release | null>(null);
  
  // Search & Status Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Pagination (20 items per page for instant loading)
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  // Audio Player State
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredList = list.filter(rel => {
    const matchesSearch = 
      rel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.primaryArtist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rel.featuredArtist && rel.featuredArtist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rel.tracks?.[0]?.isrc && rel.tracks[0].isrc.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rel.tracks?.[0]?.upc && rel.tracks[0].upc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === "ALL" || rel.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const total = filteredList.length;
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const safePage = Math.min(page, totalPages);
  const startItem = total > 0 ? (safePage - 1) * LIMIT + 1 : 0;
  const endItem = Math.min(safePage * LIMIT, total);
  const paginatedList = filteredList.slice((safePage - 1) * LIMIT, safePage * LIMIT);

  const playAudio = (track: Track, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (playingTrackId === track.id) {
      audioElement?.pause();
      setPlayingTrackId(null);
    } else {
      audioElement?.pause();
      const audio = new Audio(track.audioUrl);
      audio.play();
      setAudioElement(audio);
      setPlayingTrackId(track.id);
      
      audio.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  const handleDownload = async (url: string, filename: string, id?: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (id) setDownloadingId(id);
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        return;
      }
      // Fallback to direct download
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Failed to download file:", err);
      window.open(url, "_blank");
    } finally {
      if (id) setDownloadingId(null);
    }
  };

  const handleDeleteRelease = async (rel: Release, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!confirm(`Apakah Anda yakin ingin membatalkan dan menghapus rilis "${rel.title}"?`)) return;
    setIsDeleting(true);
    const res = await bulkDeleteReleasesAction([rel.id]);
    setIsDeleting(false);
    if (res.error) {
      alert(res.error);
    } else {
      setList(prev => prev.filter(item => item.id !== rel.id));
      if (selected?.id === rel.id) setSelected(null);
      audioElement?.pause();
      setPlayingTrackId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'RELEASED' || status === 'APPROVED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shadow-sm whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> APPROVED
        </span>
      );
    }
    if (status === 'PENDING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full shadow-sm whitespace-nowrap">
          <Clock className="w-3 h-3 text-yellow-600" /> PENDING
        </span>
      );
    }
    if (status === 'REVIEW' || status === 'PROCESSING') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full shadow-sm whitespace-nowrap">
          <Clock className="w-3 h-3 text-blue-600" /> REVIEW
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full shadow-sm whitespace-nowrap">
        <X className="w-3 h-3 text-red-600" /> REJECTED
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar (Style Katalog Musik) */}
      <div className="bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <Search className="w-4 h-4 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari lagu, genre, ISRC, UPC..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="pl-11 pr-10 py-3.5 w-full bg-white border border-gray-200 text-gray-900 placeholder-gray-400 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(""); setPage(1); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400 hidden sm:inline" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="text-xs font-bold bg-white border border-gray-200 text-gray-700 py-3.5 px-4 rounded-2xl outline-none focus:border-blue-500 cursor-pointer shadow-sm w-full md:w-auto"
          >
            <option value="ALL">Semua Status</option>
            <option value="APPROVED">Approved / Released</option>
            <option value="PENDING">Pending Review</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Info Status Bar */}
      <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-2">
        <div>
          {total > 0 ? (
            <span>Menampilkan <strong className="text-gray-800">{startItem}-{endItem}</strong> dari <strong className="text-gray-800">{total.toLocaleString("id-ID")}</strong> rilisan</span>
          ) : (
            "Tidak ada data rilisan"
          )}
        </div>
      </div>

      {/* Premium Table View */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-3 md:p-6 transform-gpu">
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500 text-[10px] uppercase tracking-wider border-b border-gray-100">
                <th className="p-3.5 md:p-4 font-bold pl-4 md:pl-6 w-16 text-center">COVER</th>
                <th className="p-3.5 md:p-4 font-bold">JUDUL RILISAN & TRACK</th>
                <th className="p-3.5 md:p-4 font-bold">ARTIS</th>
                <th className="p-3.5 md:p-4 font-bold">GENRE / BAHASA</th>
                <th className="p-3.5 md:p-4 font-bold">TANGGAL RILIS</th>
                <th className="p-3.5 md:p-4 font-bold">STATUS</th>
                <th className="p-3.5 md:p-4 font-bold text-center pr-4 md:pr-6">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Disc className="w-12 h-12 text-gray-200 mb-3 animate-pulse" />
                      <p className="font-bold text-gray-900 text-base">Tidak ada rilisan ditemukan</p>
                      <p className="text-sm text-gray-400 mt-1">Coba ubah kata kunci pencarian atau filter status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedList.map((rel) => {
                  const firstTrack = rel.tracks?.[0];
                  const isPlaying = firstTrack && playingTrackId === firstTrack.id;

                  return (
                    <tr 
                      key={rel.id} 
                      onClick={() => setSelected(rel)}
                      className="hover:bg-blue-50/30 transition cursor-pointer group"
                    >
                      {/* Cover Thumbnail with Mini Play Button */}
                      <td className="p-3.5 md:p-4 pl-4 md:pl-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 mx-auto group/thumb shadow-sm">
                          <img 
                            src={rel.coverArtworkUrl} 
                            alt={rel.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                          {firstTrack && (
                            <button
                              onClick={(e) => playAudio(firstTrack, e)}
                              className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover/thumb:opacity-100 transition"
                              title={isPlaying ? "Pause" : "Play Audio"}
                            >
                              {isPlaying ? (
                                <Pause className="w-4 h-4 fill-current text-blue-400" />
                              ) : (
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Title & Track Details */}
                      <td className="p-3.5 md:p-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 text-sm group-hover:text-blue-600 transition truncate max-w-xs">
                            {rel.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                            {firstTrack?.isrc && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">{firstTrack.isrc}</span>}
                            {firstTrack?.upc && <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px] text-gray-600">UPC: {firstTrack.upc}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Primary Artist & Feat */}
                      <td className="p-3.5 md:p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-800 text-sm">{rel.primaryArtist}</span>
                          {rel.featuredArtist && (
                            <span className="text-xs text-gray-400">feat. {rel.featuredArtist}</span>
                          )}
                        </div>
                      </td>

                      {/* Genre & Language */}
                      <td className="p-3.5 md:p-4 text-xs font-medium text-gray-600">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg">
                          <Compass className="w-3 h-3 text-blue-500" />
                          {rel.genre}
                        </span>
                      </td>

                      {/* Release Date */}
                      <td className="p-3.5 md:p-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                        {(() => {
                          const d = new Date(rel.releaseDate);
                          return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                        })()}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 md:p-4">
                        {getStatusBadge(rel.status)}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 md:p-4 pr-4 md:pr-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Play Button */}
                          {firstTrack && (
                            <button
                              onClick={(e) => playAudio(firstTrack, e)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${
                                isPlaying ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                              }`}
                              title={isPlaying ? "Pause" : "Play"}
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                            </button>
                          )}

                          {/* Download Button */}
                          {firstTrack && (
                            <button
                              onClick={(e) => handleDownload(firstTrack.audioUrl, `${rel.title} - ${firstTrack.title}.mp3`, firstTrack.id, e)}
                              disabled={downloadingId === firstTrack.id}
                              className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition shadow-sm disabled:opacity-50"
                              title="Download Audio"
                            >
                              {downloadingId === firstTrack.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                            </button>
                          )}

                          {/* Detail Button */}
                          <button
                            onClick={() => setSelected(rel)}
                            className="w-8 h-8 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition shadow-sm"
                            title="Lihat Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Button (for PENDING / REJECTED) */}
                          {rel.status !== 'APPROVED' && (
                            <button
                              onClick={(e) => handleDeleteRelease(rel, e)}
                              disabled={isDeleting}
                              className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition shadow-sm"
                              title="Hapus Rilisan Ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-gray-100 text-xs">
            <span className="text-gray-500 font-medium">
              Halaman <strong>{safePage}</strong> dari <strong>{totalPages}</strong> ({total} total rilisan)
            </span>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pNum = i + 1;
                if (totalPages > 5) {
                  if (safePage > 3) {
                    pNum = safePage - 2 + i;
                    if (pNum > totalPages) pNum = totalPages - (4 - i);
                  }
                }
                return (
                  <button
                    key={pNum}
                    onClick={() => setPage(pNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition ${
                      safePage === pNum
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                className="p-2 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { setSelected(null); audioElement?.pause(); setPlayingTrackId(null); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-t-3xl text-white">
              <button
                onClick={() => { setSelected(null); audioElement?.pause(); setPlayingTrackId(null); }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-5 items-center">
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 overflow-hidden shadow-lg border border-white/15">
                  <img src={selected.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase border border-white/10">
                    Release Detail
                  </span>
                  <h2 className="text-xl font-bold mt-1.5 truncate">{selected.title}</h2>
                  <p className="text-white/80 text-sm truncate">by {selected.primaryArtist}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-3.5">
                <SpecItem label="Genre" value={selected.genre} icon={<Compass className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="Bahasa" value={selected.language} icon={<Radio className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="TikTok Clip Start" value={selected.tracks?.[0]?.tiktokClipStart ? `Detik ${selected.tracks?.[0]?.tiktokClipStart}` : "-"} icon={<Clock className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="Artis Terdaftar" value={selected.primaryArtist} icon={<User className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="ISRC" value={selected.tracks?.[0]?.isrc || "-"} icon={<Tag className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="UPC" value={selected.tracks?.[0]?.upc || "-"} icon={<Tag className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="Composer" value={selected.tracks?.[0]?.composer || "-"} icon={<User className="w-4 h-4 text-[#10b981]" />} />
                <SpecItem label="Producer" value={selected.tracks?.[0]?.producer || "-"} icon={<User className="w-4 h-4 text-[#10b981]" />} />
              </div>

              {/* Audio Play preview inside modal */}
              {selected.tracks && selected.tracks.length > 0 && selected.tracks[0] && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => playAudio(selected.tracks[0]!, e)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        playingTrackId === selected.tracks[0].id 
                          ? "bg-emerald-600 text-white shadow-lg" 
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {playingTrackId === selected.tracks[0].id ? (
                        <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{selected.tracks[0].title}</p>
                      <p className="text-xs text-gray-400">Audio Preview</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => handleDownload(selected.tracks[0].audioUrl, `${selected.title} - ${selected.tracks[0].title}.mp3`, selected.tracks[0].id, e)}
                    disabled={downloadingId === selected.tracks[0].id}
                    className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0 disabled:opacity-50"
                  >
                    {downloadingId === selected.tracks[0].id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">Download</span>
                  </button>
                </div>
              )}

              {/* Action buttons for pending/rejected */}
              {selected.status !== 'APPROVED' && (
                <div className="pt-2 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={(e) => handleDeleteRelease(selected, e)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Rilisan Ini
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SpecItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
