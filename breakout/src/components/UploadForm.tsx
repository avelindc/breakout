"use client";

import { useState } from "react";
import { getMusicUploadUrlsAction, submitMusicMetadataAction } from "@/app/actions/upload";
import { createArtistAction } from "@/app/actions/artist";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UploadCloud, CheckCircle2, Plus } from "lucide-react";

export function UploadForm({ artists, userId }: { artists: any[]; userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCover = searchParams.get("cover") === "true";
  const defaultTitle = searchParams.get("title") || "";
  const defaultArtist = searchParams.get("originalArtist") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [coverFileName, setCoverFileName] = useState("");
  const [audioFileName, setAudioFileName] = useState("");

  const [showNewArtistModal, setShowNewArtistModal] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [creatingArtist, setCreatingArtist] = useState(false);

  async function handleCreateArtist(e: React.FormEvent) {
    e.preventDefault();
    if (!newArtistName.trim()) return;
    
    setCreatingArtist(true);
    try {
      const res = await createArtistAction(newArtistName, userId);
      if (res?.error) {
        alert(res.error);
      } else {
        setShowNewArtistModal(false);
        setNewArtistName("");
        router.refresh();
      }
    } catch (err) {
      alert("Failed to create artist.");
    } finally {
      setCreatingArtist(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      
      const coverFile = formData.get("coverArtwork") as File;
      const audioFile = formData.get("audioFile") as File;
      
      if (coverFile && audioFile) {
        // Find selected artist ID
        const primaryArtistId = formData.get("primaryArtistId") as string;
        if (!primaryArtistId) throw new Error("Silakan pilih artis terlebih dahulu.");

        const coverExt = coverFile.name.split('.').pop() || "jpg";
        const audioExt = audioFile.name.split('.').pop() || "wav";

        // 1. Get Signed URLs
        const urlsRes = await getMusicUploadUrlsAction(primaryArtistId, coverExt, audioExt);
        if (urlsRes?.error || !urlsRes.cover || !urlsRes.audio) {
          throw new Error(urlsRes?.error || "Gagal menyiapkan penyimpanan file.");
        }

        // 2. Upload Cover directly to Supabase
        const coverUpload = await fetch(urlsRes.cover.url, {
          method: "PUT",
          body: coverFile,
          headers: { "Content-Type": coverFile.type || "image/jpeg" }
        });
        if (!coverUpload.ok) throw new Error("Gagal mengunggah cover artwork.");

        // 3. Upload Audio directly to Supabase
        const audioUpload = await fetch(urlsRes.audio.url, {
          method: "PUT",
          body: audioFile,
          headers: { "Content-Type": audioFile.type || "audio/wav" }
        });
        if (!audioUpload.ok) throw new Error("Gagal mengunggah file audio.");

        // 4. Submit Metadata
        // Convert FormData to a plain object to avoid Next.js serializing it as a multipart request,
        // which can trigger Vercel's 4.5MB payload limit if the original form had large files.
        const metadata = {
          title: formData.get("title"),
          genre: formData.get("genre"),
          language: formData.get("language"),
          primaryArtistId: formData.get("primaryArtistId"),
          featuredArtist: formData.get("featuredArtist"),
          composer: formData.get("composer"),
          producer: formData.get("producer"),
          lyrics: formData.get("lyrics"),
          isrc: formData.get("isrc"),
          upc: formData.get("upc"),
          releaseDateStr: formData.get("releaseDate")
        };
        
        const res = await submitMusicMetadataAction(metadata, urlsRes.cover.path, urlsRes.audio.path);

        setLoading(false);

        if (res?.error) {
          setError(res.error);
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push("/dashboard/releases");
            router.refresh();
          }, 2000);
        }
      } else {
        throw new Error("File audio atau cover tidak ditemukan.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected error occurred during upload.");
    }
  }

  return (
    <>
      {showNewArtistModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[#12121A] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Create New Artist</h3>
            <form onSubmit={handleCreateArtist} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Artist Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={newArtistName}
                  onChange={(e) => setNewArtistName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] text-white"
                  placeholder="e.g. Breakout Band"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowNewArtistModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={creatingArtist}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition font-medium disabled:opacity-50 flex justify-center items-center text-white"
                >
                  {creatingArtist ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Artist"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {success ? (
        <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
          <p className="text-gray-400 mb-6 max-w-md">Your track has been submitted for review. It will appear in your releases shortly.</p>
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)] rounded-[2rem] p-6 md:p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Basic Info</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Song Title *</label>
                <input defaultValue={defaultTitle} required name="title" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="e.g. Midnight City" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Primary Artist *</label>
                <div className="flex gap-2">
                  <select 
                    required 
                    name="primaryArtistId" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white"
                  >
                    {artists.length === 0 && <option value="" className="text-gray-900">No artists created yet</option>}
                    {artists.map(artist => (
                      <option key={artist.id} value={artist.id} className="bg-[#09090B] text-white">{artist.stageName}</option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowNewArtistModal(true)}
                    className="px-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:text-[#00F0FF] transition flex items-center justify-center text-white"
                    title="Create New Artist"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Featured Artist</label>
                <input name="featuredArtist" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Optional" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Release Date *</label>
                <input required name="releaseDate" type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Genre *</label>
                <select required name="genre" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white">
                  <option value="" className="bg-[#09090B] text-white">Select Genre</option>
                  <option value="Pop" className="bg-[#09090B] text-white">Pop</option>
                  <option value="Hip Hop" className="bg-[#09090B] text-white">Hip Hop</option>
                  <option value="Electronic" className="bg-[#09090B] text-white">Electronic</option>
                  <option value="R&B" className="bg-[#09090B] text-white">R&B</option>
                  <option value="Rock" className="bg-[#09090B] text-white">Rock</option>
                  <option value="Other" className="bg-[#09090B] text-white">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Language *</label>
                <input required name="language" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="e.g. English" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Credits & Metadata</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Composer / Original Artist {isCover && "(Cover)"}</label>
                <input defaultValue={defaultArtist} name="composer" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Writer name or Original Artist" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">Producer</label>
                <input name="producer" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Producer name" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">ISRC Code (Optional)</label>
                <input name="isrc" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Leave blank to auto-generate" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80 md:text-gray-300">UPC Code (Optional)</label>
                <input name="upc" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Leave blank to auto-generate" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-white/80 md:text-gray-300">Lyrics</label>
              <textarea name="lyrics" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition resize-none text-white" placeholder="Enter lyrics here..." />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold border-b border-white/10 pb-2">Files</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <input 
                  type="file" 
                  name="coverArtwork" 
                  accept="image/jpeg, image/png"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setCoverFileName(e.target.files?.[0]?.name || "")}
                />
                <div className="h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-white/5 group-hover:border-[#00F0FF] transition">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#00F0FF] transition" />
                  <p className="text-sm font-medium text-gray-300">Upload Cover Artwork</p>
                  <p className="text-xs text-gray-500 mt-1">3000x3000px JPG/PNG</p>
                  {coverFileName && <p className="text-xs text-[#00F0FF] mt-2 font-medium truncate max-w-[80%]">{coverFileName}</p>}
                </div>
              </div>

              <div className="relative group">
                <input 
                  type="file" 
                  name="audioFile" 
                  accept="audio/*, .wav, .mp3, .flac, audio/wav, audio/mpeg, audio/flac"
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={(e) => setAudioFileName(e.target.files?.[0]?.name || "")}
                />
                <div className="h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-white/5 group-hover:border-[#7000FF] transition">
                  <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#7000FF] transition" />
                  <p className="text-sm font-medium text-gray-300">Upload Audio File</p>
                  <p className="text-xs text-gray-500 mt-1">WAV (16/24 bit, 44.1kHz+)</p>
                  {audioFileName && <p className="text-xs text-[#7000FF] mt-2 font-medium truncate max-w-[80%]">{audioFileName}</p>}
                </div>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold text-lg hover:opacity-90 transition flex justify-center items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Release"}
          </button>
        </form>
      )}
    </>
  );
}
