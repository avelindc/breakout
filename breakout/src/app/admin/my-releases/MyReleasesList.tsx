"use client";

import { useState } from "react";
import { 
  X, Eye, Edit2, Play, CheckCircle2, ShieldAlert, Tag, 
  Compass, Radio, User, FileText, ChevronRight, Music, AlertCircle, Loader2, Clock, Download,
  Trash2, Search, Filter, CheckSquare, Square
} from "lucide-react";
import { adminTakedownReleaseAction, adminEditReleaseAction } from "@/app/actions/adminReleaseManagement";
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
  releaseDate: string;
  coverArtworkUrl: string;
  status: string;
  artistUserId: string;
  artistName: string;
  artistEmail: string;
  tracks: Track[];
}

export function MyReleasesList({ releases }: { releases: Release[] }) {
  const [list, setList] = useState<Release[]>(releases);
  const [selected, setSelected] = useState<Release | null>(null);
  
  // Selection & Search & Filter States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState("ALL");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Audio Player State
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Management states
  const [isEditing, setIsEditing] = useState(false);
  const [loadingTakedown, setLoadingTakedown] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

  // Edit fields state
  const [editTitle, setEditTitle] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [editUpc, setEditUpc] = useState("");
  const [editIsrc, setEditIsrc] = useState("");

  const uniqueArtists = Array.from(new Set(list.map(r => r.primaryArtist))).sort();

  const filteredList = list.filter(rel => {
    const matchesSearch = 
      rel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rel.primaryArtist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rel.featuredArtist && rel.featuredArtist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (rel.tracks?.[0]?.isrc && rel.tracks[0].isrc.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesArtist = selectedArtist === "ALL" || rel.primaryArtist === selectedArtist;
    return matchesSearch && matchesArtist;
  });

  const isAllSelected = filteredList.length > 0 && filteredList.every(r => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIds = new Set(filteredList.map(r => r.id));
      setSelectedIds(prev => prev.filter(id => !filteredIds.has(id)));
    } else {
      const filteredIds = filteredList.map(r => r.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectOne = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const startEditing = (rel: Release) => {
    setEditTitle(rel.title);
    setEditGenre(rel.genre);
    setEditUpc(rel.tracks?.[0]?.upc || "");
    setEditIsrc(rel.tracks?.[0]?.isrc || "");
    setIsEditing(true);
  };

  const playAudio = (track: Track) => {
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

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (url: string, filename: string, id: string) => {
    setDownloadingId(id);
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
      setDownloadingId(null);
    }
  };

  const handleTakedown = async (rel: Release) => {
    if (confirm(`Apakah Anda yakin ingin men-takedown rilisan "${rel.title}"? Status rilisan akan dirubah menjadi REJECTED dan dihilangkan dari My Releases.`)) {
      setLoadingTakedown(true);
      const res = await adminTakedownReleaseAction(rel.id);
      setLoadingTakedown(false);
      if (res.error) {
        alert(res.error);
      } else {
        setList(prev => prev.filter(item => item.id !== rel.id));
        setSelected(null);
        audioElement?.pause();
        setPlayingTrackId(null);
      }
    }
  };

  const handleSingleDelete = async (rel: Release) => {
    if (confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus permanen rilisan "${rel.title}" beserta semua lagunya? Data akan hilang dari database dan user.`)) {
      setIsDeleting(true);
      const res = await bulkDeleteReleasesAction([rel.id]);
      setIsDeleting(false);
      if (res.error) {
        alert(res.error);
      } else {
        setList(prev => prev.filter(item => item.id !== rel.id));
        setSelected(null);
        audioElement?.pause();
        setPlayingTrackId(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsDeleting(true);
    const res = await bulkDeleteReleasesAction(selectedIds);
    setIsDeleting(false);
    if (res.error) {
      alert(res.error);
    } else {
      setList(prev => prev.filter(r => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setShowDeleteConfirm(false);
      if (selected && selectedIds.includes(selected.id)) {
        setSelected(null);
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    
    setLoadingEdit(true);
    const res = await adminEditReleaseAction(selected.id, {
      title: editTitle,
      genre: editGenre,
      upc: editUpc,
      isrc: editIsrc
    });
    setLoadingEdit(false);
    
    if (res.error) {
      alert(res.error);
    } else {
      setList(prev => prev.map(item => {
        if (item.id === selected.id) {
          const updatedTracks = item.tracks.map(t => ({
            ...t,
            title: editTitle,
            upc: editUpc,
            isrc: editIsrc
          }));
          return {
            ...item,
            title: editTitle,
            genre: editGenre,
            tracks: updatedTracks
          };
        }
        return item;
      }));
      setIsEditing(false);
      setSelected(null);
    }
  };

  return (
    <>
      {/* Search & Filter Toolbar */}
      <div className="mb-6 bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari judul lagu, artis, ISRC..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-800 outline-none focus:border-purple-500 focus:bg-white transition"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Artist & Select All Controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Artist Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 hidden sm:inline" />
            <select
              value={selectedArtist}
              onChange={(e) => setSelectedArtist(e.target.value)}
              className="text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3.5 rounded-2xl outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="ALL">Semua Artis ({uniqueArtists.length})</option>
              {uniqueArtists.map(artist => (
                <option key={artist} value={artist}>{artist}</option>
              ))}
            </select>
          </div>

          {/* Select All Button */}
          <button
            onClick={toggleSelectAll}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition border ${
              isAllSelected 
                ? "bg-purple-50 border-purple-200 text-purple-700" 
                : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
            }`}
          >
            {isAllSelected ? <CheckSquare className="w-4 h-4 text-purple-600" /> : <Square className="w-4 h-4 text-gray-400" />}
            <span>{isAllSelected ? "Batal Semua" : "Pilih Semua"}</span>
          </button>
        </div>
      </div>

      {/* Grid List */}
      {filteredList.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center text-gray-400 shadow-sm font-semibold">
          Tidak ada rilisan yang cocok dengan pencarian / filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-20">
          {filteredList.map(rel => {
            const isChecked = selectedIds.includes(rel.id);
            return (
              <div
                key={rel.id}
                onClick={() => { setSelected(rel); setIsEditing(false); }}
                className={`cursor-pointer group bg-white rounded-3xl border shadow-sm overflow-hidden hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 flex flex-col relative ${
                  isChecked ? "border-purple-500 ring-2 ring-purple-500/20 shadow-purple-500/10" : "border-gray-100"
                }`}
              >
                {/* Checkbox Trigger Top-Left */}
                <div 
                  onClick={(e) => toggleSelectOne(rel.id, e)}
                  className="absolute top-3 right-3 z-20"
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md shadow-md transition-all ${
                    isChecked 
                      ? "bg-purple-600 text-white scale-105" 
                      : "bg-white/80 text-gray-400 hover:bg-white hover:text-gray-700 opacity-90 group-hover:opacity-100"
                  }`}>
                    {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                  </div>
                </div>

                {/* Cover Aspect Box */}
                <div className="aspect-square bg-gray-50 w-full relative overflow-hidden shrink-0">
                  <img
                    src={rel.coverArtworkUrl}
                    alt={rel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      <Eye className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 bg-green-500 text-white rounded-full shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED
                  </span>
                </div>

                {/* Info body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900 truncate text-base mb-1 group-hover:text-purple-600 transition">
                      {rel.title}
                    </h4>
                    <p className="text-xs font-semibold text-gray-500 truncate mb-2">
                      {rel.primaryArtist} {rel.featuredArtist && `(feat. ${rel.featuredArtist})`}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Compass className="w-3.5 h-3.5" />
                      <span>{rel.genre}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Rilis: {(() => {
                        const d = new Date(rel.releaseDate);
                        return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
                      })()}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-4 rounded-3xl shadow-2xl border border-gray-800 flex items-center gap-6 animate-in fade-in slide-in-from-bottom-5">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-sm font-bold">{selectedIds.length} rilisan terpilih</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white transition"
            >
              Batal
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Terpilih ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-1">Konfirmasi Hapus Rilisan</h3>
              <p className="text-sm text-gray-500">
                Anda akan menghapus <span className="font-bold text-red-600">{selectedIds.length} lagu/rilisan</span> secara permanen dari database & panel artis. Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-2xl p-3 space-y-1.5 border border-gray-100">
              {list.filter(r => selectedIds.includes(r.id)).map(r => (
                <div key={r.id} className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">{r.title}</span>
                  <span className="text-gray-400 text-[10px]">{r.primaryArtist}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-2xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5 transition"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Menghapus..." : "Ya, Hapus Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Management Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
          onClick={() => { setSelected(null); setIsEditing(false); audioElement?.pause(); setPlayingTrackId(null); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-t-3xl text-white">
              <button
                onClick={() => { setSelected(null); setIsEditing(false); audioElement?.pause(); setPlayingTrackId(null); }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-5 items-center">
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 overflow-hidden shadow-lg border border-white/15 group/cover">
                  <img src={selected.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(selected.coverArtworkUrl, `${selected.title} - Cover.jpg`, 'cover'); }} 
                      disabled={downloadingId === 'cover'}
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition text-white disabled:opacity-50"
                      title="Download Cover"
                    >
                      {downloadingId === 'cover' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold tracking-widest bg-white/20 text-white px-2.5 py-0.5 rounded-full uppercase border border-white/10">
                    Released Catalog v2
                  </span>
                  <h2 className="text-xl font-bold mt-1.5 truncate">{selected.title}</h2>
                  <p className="text-white/80 text-sm truncate">by {selected.primaryArtist}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {isEditing ? (
                /* EDIT FORM */
                <form onSubmit={handleEditSubmit} className="space-y-4 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                  <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 mb-2">
                    <Edit2 className="w-4 h-4 text-purple-600" /> Edit Detail Rilisan
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Song Title</label>
                      <input 
                        required
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-white text-gray-800 outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">Genre</label>
                      <input 
                        required
                        type="text" 
                        value={editGenre} 
                        onChange={e => setEditGenre(e.target.value)}
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-white text-gray-800 outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">UPC Code</label>
                      <input 
                        type="text" 
                        value={editUpc} 
                        onChange={e => setEditUpc(e.target.value)}
                        placeholder="Automatic if empty"
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-white text-gray-800 outline-none focus:border-purple-500 transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 uppercase">ISRC Code</label>
                      <input 
                        type="text" 
                        value={editIsrc} 
                        onChange={e => setEditIsrc(e.target.value)}
                        placeholder="Automatic if empty"
                        className="w-full text-sm p-3 border border-gray-200 rounded-xl bg-white text-gray-800 outline-none focus:border-purple-500 transition"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={loadingEdit}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow transition flex items-center gap-1.5"
                    >
                      {loadingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Simpan Perubahan
                    </button>
                  </div>
                </form>
              ) : (
                /* Specs Grid */
                <div className="grid grid-cols-2 gap-3.5">
                  <SpecItem label="Genre" value={selected.genre} icon={<Compass className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="Bahasa" value={selected.language} icon={<Radio className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="TikTok Clip Start" value={selected.tracks?.[0]?.tiktokClipStart ? `Detik ${selected.tracks?.[0]?.tiktokClipStart}` : "-"} icon={<Clock className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="Artis Terdaftar" value={selected.artistName} icon={<User className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="ISRC" value={selected.tracks?.[0]?.isrc || "-"} icon={<Tag className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="UPC" value={selected.tracks?.[0]?.upc || "-"} icon={<Tag className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="Composer" value={selected.tracks?.[0]?.composer || "-"} icon={<User className="w-4 h-4 text-[#10b981]" />} />
                  <SpecItem label="Producer" value={selected.tracks?.[0]?.producer || "-"} icon={<User className="w-4 h-4 text-[#10b981]" />} />
                </div>
              )}

              {/* Audio Play preview inside modal */}
              {!isEditing && selected.tracks && selected.tracks.length > 0 && selected.tracks[0] && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playAudio(selected.tracks[0]!)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        playingTrackId === selected.tracks[0].id 
                          ? "bg-emerald-600 text-white shadow-lg" 
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      }`}
                    >
                      {playingTrackId === selected.tracks[0].id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
                    onClick={() => handleDownload(selected.tracks[0].audioUrl, `${selected.title} - ${selected.tracks[0].title}.mp3`, selected.tracks[0].id)}
                    disabled={downloadingId === selected.tracks[0].id}
                    className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                  >
                    {downloadingId === selected.tracks[0].id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloadingId === selected.tracks[0].id ? "Downloading..." : "Download"}
                  </button>
                </div>
              )}

              {/* Management Control Buttons */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {!isEditing && (
                  <button
                    onClick={() => startEditing(selected)}
                    className="flex-1 min-w-[130px] h-12 bg-purple-50 text-purple-700 hover:bg-purple-100 transition font-bold rounded-2xl flex items-center justify-center gap-2 text-xs"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Metadata
                  </button>
                )}
                
                <button
                  onClick={() => handleTakedown(selected)}
                  disabled={loadingTakedown}
                  className="flex-1 min-w-[130px] h-12 bg-amber-50 text-amber-700 hover:bg-amber-100 transition font-bold rounded-2xl flex items-center justify-center gap-2 text-xs"
                >
                  {loadingTakedown ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  Takedown
                </button>

                <button
                  onClick={() => handleSingleDelete(selected)}
                  disabled={isDeleting}
                  className="flex-1 min-w-[130px] h-12 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold rounded-2xl flex items-center justify-center gap-2 text-xs"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Hapus Permanen
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SpecItem({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
