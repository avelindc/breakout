"use client";

import { useState } from "react";
import { 
  X, Eye, Play, Pause, Check, Download, Info, Clock, 
  Tag, Compass, Radio, User, FileText, ChevronRight, Music, AlertCircle, Loader2
} from "lucide-react";
import { updateReleaseStatusAction } from "@/app/actions/admin";

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

export function ReviewList({ releases }: { releases: Release[] }) {
  const [list, setList] = useState<Release[]>(releases);
  const [selected, setSelected] = useState<Release | null>(null);
  
  // Audio Player State
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Action states
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");

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

  const handleApprove = async (rel: Release) => {
    setLoadingApprove(true);
    await updateReleaseStatusAction(rel.id, rel.artistUserId, "APPROVED", rel.artistName, rel.artistEmail, rel.title, "");
    setList(prev => prev.filter(item => item.id !== rel.id));
    setLoadingApprove(false);
    setSelected(null);
    audioElement?.pause();
    setPlayingTrackId(null);
  };

  const handleReject = async (rel: Release) => {
    if (!reason.trim()) {
      alert("Alasan penolakan harus diisi!");
      return;
    }
    setLoadingReject(true);
    await updateReleaseStatusAction(rel.id, rel.artistUserId, "REJECTED", rel.artistName, rel.artistEmail, rel.title, reason);
    setList(prev => prev.filter(item => item.id !== rel.id));
    setLoadingReject(false);
    setRejectMode(false);
    setReason("");
    setSelected(null);
    audioElement?.pause();
    setPlayingTrackId(null);
  };

  return (
    <>
      {/* Pending Grid List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {list.map(rel => (
          <div
            key={rel.id}
            onClick={() => { setSelected(rel); setRejectMode(false); setReason(""); }}
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
              <span className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 bg-yellow-400 text-yellow-950 rounded-full shadow">
                PENDING REVIEW
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
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {(() => {
                    const d = new Date(rel.releaseDate);
                    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
                  })()}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
          onClick={() => { setSelected(null); setRejectMode(false); audioElement?.pause(); setPlayingTrackId(null); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative p-6 pb-4 bg-gradient-to-br from-[#7c3aed] to-[#a855f7] rounded-t-3xl text-white">
              <button
                onClick={() => { setSelected(null); setRejectMode(false); audioElement?.pause(); setPlayingTrackId(null); }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex gap-5 items-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 overflow-hidden shadow-lg border border-white/15">
                  <img src={selected.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-extrabold tracking-widest bg-yellow-400 text-yellow-950 px-2.5 py-0.5 rounded-full uppercase">
                    Review Queue
                  </span>
                  <h2 className="text-xl font-bold mt-1.5 truncate">{selected.title}</h2>
                  <p className="text-white/80 text-sm truncate">by {selected.primaryArtist}</p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              
              {/* Audio Track Player */}
              {selected.tracks.map((track) => (
                <div key={track.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={() => playAudio(track)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        playingTrackId === track.id 
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25" 
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      }`}
                    >
                      {playingTrackId === track.id ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate text-sm">{track.title}</p>
                      <p className="text-xs text-gray-500 truncate flex items-center gap-1.5 mt-0.5">
                        <Music className="w-3.5 h-3.5" /> Audio File
                      </p>
                    </div>
                  </div>

                  <a
                    href={track.audioUrl}
                    target="_blank"
                    download
                    className="h-10 px-4 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              ))}

               {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <SpecItem label="Genre" value={selected.genre} icon={<Compass className="w-4 h-4 text-purple-600" />} />
                <SpecItem label="Bahasa" value={selected.language} icon={<Radio className="w-4 h-4 text-purple-600" />} />
                <SpecItem label="TikTok Clip Start" value={selected.tracks?.[0]?.tiktokClipStart ? `Detik ${selected.tracks?.[0]?.tiktokClipStart}` : "-"} icon={<Clock className="w-4 h-4 text-purple-600" />} />
                <SpecItem label="Artis Terdaftar" value={selected.artistName} icon={<User className="w-4 h-4 text-purple-600" />} />
                <SpecItem label="ISRC" value={selected.tracks?.[0]?.isrc || "Auto-Generate"} icon={<Tag className="w-4 h-4 text-purple-600" />} />
                <SpecItem label="UPC" value={selected.tracks?.[0]?.upc || "Auto-Generate"} icon={<Tag className="w-4 h-4 text-purple-600" />} />
              </div>

              {/* Lyrics Panel */}
              {selected.tracks?.[0]?.lyrics && (
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gray-400" /> Lirik Lagu
                  </h4>
                  <pre className="text-xs text-gray-700 leading-relaxed font-sans whitespace-pre-wrap max-h-32 overflow-y-auto bg-white p-3.5 rounded-xl border border-gray-100">
                    {selected.tracks?.[0].lyrics}
                  </pre>
                </div>
              )}

              {/* Reject Reason Form */}
              {rejectMode && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-red-700 text-sm flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" /> Alasan Penolakan Musik
                  </h4>
                  <textarea
                    className="w-full text-sm p-3 border border-red-200 rounded-xl outline-none focus:border-red-500 transition bg-white text-gray-900"
                    rows={3}
                    placeholder="Contoh: Kualitas cover buram/blur, audio noise, dll..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setRejectMode(false)}
                      className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleReject(selected)}
                      disabled={loadingReject}
                      className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {loadingReject && <Loader2 className="w-3 h-3 animate-spin" />}
                      Tolak & Buang
                    </button>
                  </div>
                </div>
              )}

              {/* Decision Action Buttons */}
              {!rejectMode && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={loadingApprove || loadingReject}
                    className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-green-500/25"
                  >
                    {loadingApprove ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Approve Release
                  </button>
                  <button
                    onClick={() => setRejectMode(true)}
                    disabled={loadingApprove || loadingReject}
                    className="flex-1 h-12 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject Release
                  </button>
                </div>
              )}

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
      <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
