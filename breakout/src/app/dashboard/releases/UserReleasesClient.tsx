"use client";

import { useState } from "react";
import { 
  X, Eye, Edit2, Play, CheckCircle2, Tag, 
  Compass, Radio, User, ChevronRight, Clock, Download
} from "lucide-react";

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
  const [selected, setSelected] = useState<Release | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

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

  const handleDownload = async (url: string, filename: string) => {
    try {
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error("Proxy download failed");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download file:", err);
      alert("Gagal mendownload file. Pastikan koneksi stabil.");
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'RELEASED' || status === 'APPROVED') return 'bg-green-500';
    if (status === 'PENDING') return 'bg-yellow-500';
    if (status === 'REVIEW') return 'bg-blue-500';
    if (status === 'PROCESSING') return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusText = (status: string) => {
    if (status === 'RELEASED' || status === 'APPROVED') return 'APPROVED';
    return status;
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {releases.map(rel => (
          <div
            key={rel.id}
            onClick={() => { setSelected(rel); }}
            className="cursor-pointer group bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1 flex flex-col"
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
              <span className={`absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 text-white rounded-full shadow flex items-center gap-1 ${getStatusColor(rel.status)}`}>
                <CheckCircle2 className="w-3.5 h-3.5" /> {getStatusText(rel.status)}
              </span>
            </div>

            {/* Info body */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-gray-900 truncate text-base mb-1 group-hover:text-blue-600 transition">
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
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { setSelected(null); audioElement?.pause(); setPlayingTrackId(null); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative"
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
                <div className="relative w-20 h-20 rounded-2xl bg-white/10 overflow-hidden shadow-lg border border-white/15 group/cover">
                  <img src={selected.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/cover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDownload(selected.coverArtworkUrl, `${selected.title} - Cover.jpg`); }} 
                      className="p-2 bg-white/20 hover:bg-white/40 rounded-full transition text-white"
                      title="Download Cover"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="min-w-0 flex-1 pr-6">
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
              
              {/* Specs Grid */}
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
                      onClick={() => playAudio(selected.tracks[0]!)}
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
                    onClick={() => handleDownload(selected.tracks[0].audioUrl, `${selected.title} - ${selected.tracks[0].title}.mp3`)}
                    className="h-10 px-4 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Download</span>
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
