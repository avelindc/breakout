"use client";

import { useState } from "react";
import { 
  X, Eye, Edit2, Play, CheckCircle2, ShieldAlert, Tag, 
  Compass, Radio, User, FileText, ChevronRight, Music, AlertCircle, Loader2, Clock
} from "lucide-react";
import { adminTakedownReleaseAction, adminEditReleaseAction } from "@/app/actions/adminReleaseManagement";

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
      // Update list state
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
      {/* Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {list.map(rel => (
          <div
            key={rel.id}
            onClick={() => { setSelected(rel); setIsEditing(false); }}
            className="cursor-pointer group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
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
        ))}
      </div>

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
                <div className="w-20 h-20 rounded-2xl bg-white/10 overflow-hidden shadow-lg border border-white/15">
                  <img src={selected.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
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
                  <a href={selected.tracks[0].audioUrl} target="_blank" download className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-sm">
                    Download
                  </a>
                </div>
              )}

              {/* Management Control Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                {!isEditing && (
                  <button
                    onClick={() => startEditing(selected)}
                    className="flex-1 h-12 bg-purple-50 text-purple-700 hover:bg-purple-100 transition font-bold rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Metadata
                  </button>
                )}
                
                <button
                  onClick={() => handleTakedown(selected)}
                  disabled={loadingTakedown}
                  className="flex-1 h-12 bg-red-50 text-red-600 hover:bg-red-100 transition font-bold rounded-2xl flex items-center justify-center gap-2"
                >
                  {loadingTakedown ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
                  Takedown Musik
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
