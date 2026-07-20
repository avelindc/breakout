"use client";

import { useState } from "react";
import { getMusicUploadUrlsAction, submitMusicMetadataAction } from "@/app/actions/upload";
import { createArtistAction } from "@/app/actions/artist";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, UploadCloud, CheckCircle2, Plus, ArrowRight, ArrowLeft, Check, Sparkles } from "lucide-react";

// Modern Streaming Platforms list (30 platforms)
const STREAMING_PLATFORMS = [
  { id: "spotify", name: "Spotify", logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/Spotify_logo_without_text.svg" },
  { id: "apple_music", name: "Apple Music", logo: "https://upload.wikimedia.org/wikipedia/commons/d/df/Apple_Music_logo.svg" },
  { id: "youtube_music", name: "YouTube Music", logo: "https://upload.wikimedia.org/wikipedia/commons/6/6a/Youtube_Music_icon.svg" },
  { id: "tiktok", name: "TikTok", logo: "https://upload.wikimedia.org/wikipedia/commons/3/34/TikTok_logo.svg" },
  { id: "instagram", name: "Instagram Music", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" },
  { id: "facebook", name: "Facebook Stories", logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" },
  { id: "amazon_music", name: "Amazon Music", logo: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Amazon_Music_logo.svg" },
  { id: "deezer", name: "Deezer", logo: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Deezer_logo_2023.svg" },
  { id: "tidal", name: "Tidal", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Tidal_logo.svg" },
  { id: "boomplay", name: "Boomplay", logo: "https://upload.wikimedia.org/wikipedia/en/9/90/Boomplay_Music_Logo.png" },
  { id: "audiomack", name: "Audiomack", logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Audiomack_logo.png" },
  { id: "jiosaavn", name: "JioSaavn", logo: "https://upload.wikimedia.org/wikipedia/commons/8/8c/JioSaavn_Logo.svg" },
  { id: "wynk", name: "Wynk Music", logo: "https://upload.wikimedia.org/wikipedia/en/1/1c/Wynk_Music_logo.png" },
  { id: "kkbox", name: "KKBOX", logo: "https://upload.wikimedia.org/wikipedia/commons/9/9f/KKBOX_logo.svg" },
  { id: "anghami", name: "Anghami", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/Anghami_logo.svg" },
  { id: "netease", name: "NetEase Cloud Music", logo: "https://upload.wikimedia.org/wikipedia/commons/d/df/NetEase_Music_logo.svg" },
  { id: "tencent", name: "Tencent Music (QQ)", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Tencent_Music_Entertainment_Group_Logo.svg" },
  { id: "resso", name: "Resso", logo: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Resso_logo.svg" },
  { id: "pandora", name: "Pandora", logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Pandora_logo.svg" },
  { id: "iheartradio", name: "iHeartRadio", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/IHeartRadio_logo.svg" },
  { id: "napster", name: "Napster", logo: "https://upload.wikimedia.org/wikipedia/commons/0/07/Napster_logo.svg" },
  { id: "qobuz", name: "Qobuz", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2b/Qobuz_logo.png" },
  { id: "shazam", name: "Shazam", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Shazam_logo.svg" },
  { id: "line_music", name: "LINE Music", logo: "https://upload.wikimedia.org/wikipedia/commons/5/52/LINE_Music_logo.svg" },
  { id: "yandex", name: "Yandex Music", logo: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Yandex_Music_logo.svg" },
  { id: "soundcloud", name: "SoundCloud Go", logo: "https://upload.wikimedia.org/wikipedia/commons/8/84/SoundCloud_logo.svg" },
  { id: "claromusica", name: "Claro Música", logo: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Claro_M%C3%BAsica_Logo.svg" },
  { id: "kuack", name: "Kuack Media", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Kuack_Media_Group_Logo.png" },
  { id: "joox", name: "JOOX", logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/JOOX_logo.svg" },
  { id: "snapchat", name: "Snapchat Sounds", logo: "https://upload.wikimedia.org/wikipedia/commons/c/c2/Snapchat_logo.svg" },
];

export function UploadForm({ artists, userId }: { artists: any[]; userId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCover = searchParams.get("cover") === "true";
  const defaultTitle = searchParams.get("title") || "";
  const defaultArtist = searchParams.get("originalArtist") || "";

  const [step, setStep] = useState(1); // 1 = Metadata Form, 2 = Platform & Clip Form, 3 = Progress & Uploading
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [coverFileName, setCoverFileName] = useState("");
  const [audioFileName, setAudioFileName] = useState("");

  const [showNewArtistModal, setShowNewArtistModal] = useState(false);
  const [newArtistName, setNewArtistName] = useState("");
  const [creatingArtist, setCreatingArtist] = useState(false);

  // TikTok Clip start state
  const [tiktokClipStart, setTiktokClipStart] = useState("00:30");

  // Selected platforms state: EMPTY BY DEFAULT so user has to choose
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  // Toggle single platform selection
  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle all platforms
  const toggleAllPlatforms = () => {
    if (selectedPlatforms.length === STREAMING_PLATFORMS.length) {
      setSelectedPlatforms([]);
    } else {
      setSelectedPlatforms(STREAMING_PLATFORMS.map(p => p.id));
    }
  };

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

  // Pre-validate Step 1 fields before moving to Step 2
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const form = document.getElementById("metadata-upload-form") as HTMLFormElement;
    if (form && form.checkValidity()) {
      // Basic check for files
      const coverInput = form.querySelector('input[name="coverArtwork"]') as HTMLInputElement;
      const audioInput = form.querySelector('input[name="audioFile"]') as HTMLInputElement;
      
      if (!coverInput?.files?.length || !audioInput?.files?.length) {
        setError("Silakan pilih file cover artwork dan file audio terlebih dahulu.");
        return;
      }
      setError(null);
      setStep(2);
    } else {
      form.reportValidity();
    }
  };

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setSuccess(false);
    setStep(3); // Go to loading step

    try {
      const formData = new FormData(e.currentTarget);
      
      const coverFile = formData.get("coverArtwork") as File;
      const audioFile = formData.get("audioFile") as File;
      
      if (coverFile && audioFile && coverFile.size > 0 && audioFile.size > 0) {
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
          releaseDateStr: formData.get("releaseDate"),
          tiktokClipStart: tiktokClipStart
        };
        
        const res = await submitMusicMetadataAction(metadata, urlsRes.cover.path, urlsRes.audio.path);

        setLoading(false);

        if (res?.error) {
          setError(res.error);
          setStep(2); // Go back to fix
        } else {
          setSuccess(true);
          setTimeout(() => {
            router.push("/dashboard/releases");
            router.refresh();
          }, 2000);
        }
      } else {
        throw new Error("File audio atau cover tidak ditemukan atau kosong. Silakan kembali ke Langkah 1 dan pilih file Anda.");
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.message || "An unexpected error occurred during upload.");
      setStep(2); // Go back to allow retry
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
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
          <p className="text-gray-400 mb-6 max-w-md">Your track has been submitted for review. It will appear in your releases shortly.</p>
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : (
        <form id="metadata-upload-form" onSubmit={handleFormSubmit} className="bg-gradient-to-br from-[#f000ff] to-[#8a2be2] text-white border border-white/10 shadow-[0_8px_30px_rgba(240,0,255,0.25)] rounded-[2rem] p-6 md:p-8 space-y-8">
          
          {/* Step Indicator Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= 1 ? "bg-white text-purple-700 shadow-md" : "bg-white/15 text-white/50"
              }`}>1</span>
              <span className="text-sm font-semibold hidden sm:inline">Basic Metadata</span>
            </div>
            <div className="w-12 h-[2px] bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= 2 ? "bg-white text-purple-700 shadow-md" : "bg-white/15 text-white/50"
              }`}>2</span>
              <span className="text-sm font-semibold hidden sm:inline">Distribution Channels</span>
            </div>
            <div className="w-12 h-[2px] bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === 3 ? "bg-white text-purple-700 shadow-md" : "bg-white/15 text-white/50"
              }`}>3</span>
              <span className="text-sm font-semibold hidden sm:inline">Uploading</span>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: Basic Metadata Inputs (Always in DOM, hidden when step != 1) */}
          <div className={`space-y-6 animate-fade-in ${step === 1 ? "" : "hidden"}`}>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" /> Informasi Dasar Rilisan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Song Title *</label>
                  <input defaultValue={defaultTitle} required={step === 1} name="title" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="e.g. Midnight City" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Primary Artist *</label>
                  <div className="flex gap-2">
                    <select 
                      required={step === 1} 
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
                  <label className="text-sm font-medium text-white/80">Featured Artist</label>
                  <input name="featuredArtist" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Optional" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Release Date *</label>
                  <input required={step === 1} name="releaseDate" type="date" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Genre *</label>
                  <select required={step === 1} name="genre" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white">
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
                  <label className="text-sm font-medium text-white/80">Language *</label>
                  <input required={step === 1} name="language" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="e.g. English" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold">Kredit & Kode Identitas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Composer / Original Artist {isCover && "(Cover)"}</label>
                  <input defaultValue={defaultArtist} name="composer" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Writer name or Original Artist" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">Producer</label>
                  <input name="producer" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Producer name" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">ISRC Code (Optional)</label>
                  <input name="isrc" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Leave blank to auto-generate" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-white/80">UPC Code (Optional)</label>
                  <input name="upc" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition text-white" placeholder="Leave blank to auto-generate" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-white/80">Lyrics</label>
                <textarea name="lyrics" rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-[#00F0FF] transition resize-none text-white" placeholder="Enter lyrics here..." />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10">
              <h3 className="text-xl font-semibold">Upload Berkas Pendukung</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <input 
                    type="file" 
                    name="coverArtwork" 
                    accept="image/jpeg, image/png"
                    required={step === 1}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setCoverFileName(e.target.files?.[0]?.name || "")}
                  />
                  <div className="h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-white/5 group-hover:border-[#00F0FF] transition">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#00F0FF] transition" />
                    <p className="text-sm font-medium text-gray-300">Upload Cover Artwork *</p>
                    <p className="text-xs text-gray-500 mt-1">3000x3000px JPG/PNG</p>
                    {coverFileName && <p className="text-xs text-[#00F0FF] mt-2 font-medium truncate max-w-[80%]">{coverFileName}</p>}
                  </div>
                </div>

                <div className="relative group">
                  <input 
                    type="file" 
                    name="audioFile" 
                    accept="audio/*, .wav, .mp3, .flac, audio/wav, audio/mpeg, audio/flac"
                    required={step === 1}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={(e) => setAudioFileName(e.target.files?.[0]?.name || "")}
                  />
                  <div className="h-40 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center bg-white/5 group-hover:border-[#7000FF] transition">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2 group-hover:text-[#7000FF] transition" />
                    <p className="text-sm font-medium text-gray-300">Upload Audio File *</p>
                    <p className="text-xs text-gray-500 mt-1">WAV (16/24 bit, 44.1kHz+)</p>
                    {audioFileName && <p className="text-xs text-[#7000FF] mt-2 font-medium truncate max-w-[80%]">{audioFileName}</p>}
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="button" 
              onClick={handleNextStep}
              className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold text-lg hover:opacity-95 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              Lanjutkan <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 2: Platform Selection & TikTok Clip Time (Always in DOM, hidden when step != 2) */}
          <div className={`space-y-6 animate-fade-in ${step === 2 ? "" : "hidden"}`}>
            {/* TikTok Clip Time Selection */}
            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/34/TikTok_logo.svg" alt="TikTok" className="w-8 h-8 object-contain" />
                <div>
                  <h4 className="font-bold text-lg">TikTok Start Time (Bisa Diedit)</h4>
                  <p className="text-xs text-gray-400">Tentukan menit potongan lagu yang akan diputar di TikTok.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-300">Mulai Klip TikTok (Menit:Detik)</label>
                  <input
                    type="text"
                    value={tiktokClipStart}
                    onChange={e => setTiktokClipStart(e.target.value)}
                    placeholder="Contoh: 00:30 atau 01:15"
                    pattern="[0-9]{1,2}:[0-9]{2}"
                    title="Format harus Menit:Detik, contoh: 00:30"
                    className="w-full bg-[#09090B] border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white font-medium"
                  />
                </div>
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                  <p className="text-[11px] text-gray-400">Rekomendasi:</p>
                  <p className="text-xs font-semibold text-white/90">Klip 30 detik pertama biasanya mencakup bait reff utama untuk promosi TikTok/Instagram Reels terbaik.</p>
                </div>
              </div>
            </div>

            {/* Platform Streaming Checkboxes */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-xl font-semibold">Pilih Platform Streaming</h3>
                  <p className="text-xs text-gray-400">Silakan centang platform target rilis (Total {selectedPlatforms.length} platform dipilih)</p>
                </div>
                <button
                  type="button"
                  onClick={toggleAllPlatforms}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold transition flex items-center justify-center gap-1.5 self-start"
                >
                  {selectedPlatforms.length === STREAMING_PLATFORMS.length ? "Hapus Semua" : "Centang Semua"}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {STREAMING_PLATFORMS.map((platform) => {
                  const isChecked = selectedPlatforms.includes(platform.id);
                  return (
                    <div
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`cursor-pointer border p-3 rounded-2xl flex flex-col items-center justify-center gap-2.5 text-center transition-all duration-200 relative overflow-hidden select-none ${
                        isChecked 
                          ? "bg-white/10 border-teal-400/80 shadow-md shadow-teal-500/10 scale-[1.02]" 
                          : "bg-black/20 border-white/5 hover:border-white/10 opacity-60"
                      }`}
                    >
                      {/* Custom indicator badge */}
                      <div className={`absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center ${
                        isChecked ? "bg-teal-400 text-purple-900" : "bg-white/10"
                      }`}>
                        {isChecked && <Check className="w-2.5 h-2.5 stroke-[4]" />}
                      </div>

                      {/* Logo */}
                      <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-xl p-1.5 shadow-inner">
                        <img 
                          src={platform.logo} 
                          alt={platform.name} 
                          className="max-w-full max-h-full object-contain" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E";
                          }}
                        />
                      </div>

                      <span className="text-[11px] font-bold text-white/90 truncate max-w-full px-1">{platform.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition font-bold text-base flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" /> Kembali
              </button>
              <button
                type="submit"
                disabled={selectedPlatforms.length === 0}
                className="flex-[2] py-4 rounded-2xl bg-gradient-to-r from-teal-400 to-blue-500 disabled:opacity-50 text-white font-bold text-base hover:opacity-95 transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25"
              >
                Submit Rilisan <Check className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* STEP 3: Loading Progress Slide (Always in DOM, hidden when step != 3) */}
          <div className={`py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in ${step === 3 ? "" : "hidden"}`}>
            <div className="relative w-24 h-24">
              {/* Modern Gradient Spinner */}
              <div className="absolute inset-0 rounded-full border-4 border-white/10 border-t-teal-400 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-white/5 border-b-purple-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <UploadCloud className="w-8 h-8 text-white/80 animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold">Sedang Mengirim Musik Anda</h3>
              <p className="text-sm text-gray-400 max-w-sm mx-auto">
                Tolong jangan tutup atau segarkan halaman ini. Kami sedang mengupload berkas media & cover ke server.
              </p>
            </div>

            {/* Progress Slide Loading Bar */}
            <div className="w-full max-w-xs bg-white/10 h-2 rounded-full overflow-hidden relative shadow-inner">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-teal-400 via-blue-500 to-purple-600 rounded-full animate-[loading-bar_10s_ease-out_infinite]" style={{ width: "95%" }}></div>
            </div>
          </div>

        </form>
      )}
    </>
  );
}
