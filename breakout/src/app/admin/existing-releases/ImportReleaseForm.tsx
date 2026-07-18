"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Loader2, Save, Music, Image as ImageIcon, X, Check,
  Link, Info
} from "lucide-react";
import { getCoverUploadUrlAction, importExistingReleaseAction, getArtistsForImportAction } from "@/app/actions/importRelease";

interface Artist {
  id: string;
  stageName: string;
  user: { name: string | null; email: string };
}

const GENRES = [
  "Pop", "Rock", "Hip-Hop", "R&B", "Electronic", "Dance", "Jazz", "Classical",
  "Country", "Folk", "Reggae", "Metal", "Alternative", "Indie", "Soul", "Blues",
  "Latin", "Dangdut", "Keroncong", "Pop Indonesia", "Other"
];

const LANGUAGES = [
  "Indonesian", "English", "Sundanese", "Javanese", "Batak", "Minang", "Other"
];

const DISTRIBUTORS = [
  "Believe", "Revelator", "DistroKid", "TuneCore", "CD Baby", "Amuse", "Label", "Lainnya"
];

export function ImportReleaseForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [artists, setArtists] = useState<Artist[]>([]);
  const [artistMode, setArtistMode] = useState<"select" | "new">("new");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [artistName, setArtistName] = useState("");

  const [title, setTitle] = useState("");
  const [album, setAlbum] = useState("");
  const [genre, setGenre] = useState("Pop Indonesia");
  const [language, setLanguage] = useState("Indonesian");
  const [releaseType, setReleaseType] = useState("SINGLE");
  const [releaseDate, setReleaseDate] = useState("");
  const [distributor, setDistributor] = useState("Believe");
  const [upc, setUpc] = useState("");
  const [isrc, setIsrc] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [appleMusicUrl, setAppleMusicUrl] = useState("");
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loadingArtists, setLoadingArtists] = useState(true);

  useEffect(() => {
    getArtistsForImportAction().then((res: any) => {
      if (res.success) setArtists(res.artists);
      setLoadingArtists(false);
    });
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg("");

    const effectiveArtistName = artistMode === "select"
      ? artists.find(a => a.id === selectedArtistId)?.stageName || ""
      : artistName;

    if (!effectiveArtistName || !title || !genre || !language || !releaseDate) {
      setStatusMsg("❌ Wajib mengisi: Nama Artis, Judul Lagu, Genre, Bahasa, dan Tanggal Rilis.");
      return;
    }
    if (!coverFile) {
      setStatusMsg("❌ Cover Artwork wajib diupload.");
      return;
    }

    try {
      // 1. Upload cover
      setUploading(true);
      setStatusMsg("⏳ Mengupload cover artwork...");
      const ext = coverFile.name.split(".").pop() || "jpg";
      const urlRes = await getCoverUploadUrlAction(ext);
      if (urlRes.error || !urlRes.signedUrl) {
        setStatusMsg(`❌ ${urlRes.error}`);
        setUploading(false);
        return;
      }

      const uploadRes = await fetch(urlRes.signedUrl, {
        method: "PUT",
        body: coverFile,
        headers: { "Content-Type": coverFile.type },
      });
      if (!uploadRes.ok) {
        setStatusMsg("❌ Gagal mengupload cover ke storage.");
        setUploading(false);
        return;
      }
      setUploading(false);

      // 2. Save release
      setSaving(true);
      setStatusMsg("⏳ Menyimpan release ke database...");
      const formData = new FormData();
      formData.append("artistName", effectiveArtistName);
      formData.append("artistId", artistMode === "select" ? selectedArtistId : "");
      formData.append("title", title);
      formData.append("album", album);
      formData.append("genre", genre);
      formData.append("language", language);
      formData.append("releaseType", releaseType);
      formData.append("releaseDate", releaseDate);
      formData.append("coverPath", urlRes.path!);
      formData.append("distributor", distributor);
      formData.append("upc", upc);
      formData.append("isrc", isrc);
      formData.append("spotifyUrl", spotifyUrl);
      formData.append("appleMusicUrl", appleMusicUrl);
      formData.append("youtubeMusicUrl", youtubeMusicUrl);
      formData.append("tiktokUrl", tiktokUrl);

      const saveRes = await importExistingReleaseAction(formData);
      setSaving(false);

      if (saveRes.error) {
        setStatusMsg(`❌ ${saveRes.error}`);
        return;
      }

      setStatusMsg("✅ Release berhasil diimport! Mengalihkan...");
      setTimeout(() => router.push("/admin/existing-releases"), 1500);
    } catch (err: any) {
      setUploading(false);
      setSaving(false);
      setStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  const isLoading = uploading || saving;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Cover Artwork */}
        <div className="lg:col-span-1 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full aspect-square rounded-3xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition cursor-pointer overflow-hidden bg-gray-50 flex flex-col items-center justify-center group relative"
          >
            {coverPreview ? (
              <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-gray-400 group-hover:text-blue-500 transition p-6 text-center">
                <ImageIcon className="w-12 h-12" />
                <p className="text-sm font-semibold">Klik untuk upload<br />Cover Artwork</p>
                <p className="text-xs">JPG, PNG, WEBP (min. 3000×3000px)</p>
              </div>
            )}
            {coverPreview && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <p className="text-white font-bold text-sm">Ganti Cover</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
          {coverFile && (
            <p className="text-xs text-gray-500 text-center truncate">{coverFile.name}</p>
          )}

          {/* Platform Links */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Link className="w-3.5 h-3.5" /> Platform Links
            </h3>
            {[
              { label: "Spotify", value: spotifyUrl, setter: setSpotifyUrl, placeholder: "https://open.spotify.com/track/..." },
              { label: "Apple Music", value: appleMusicUrl, setter: setAppleMusicUrl, placeholder: "https://music.apple.com/..." },
              { label: "YouTube Music", value: youtubeMusicUrl, setter: setYoutubeMusicUrl, placeholder: "https://music.youtube.com/..." },
              { label: "TikTok", value: tiktokUrl, setter: setTiktokUrl, placeholder: "https://www.tiktok.com/..." },
            ].map(({ label, value, setter, placeholder }) => (
              <div key={label} className="space-y-1">
                <label className="text-xs font-semibold text-gray-500">{label}</label>
                <input
                  type="url"
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs bg-white text-gray-900 outline-none focus:border-blue-500 transition"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Metadata */}
        <div className="lg:col-span-2 space-y-5">

          {/* Artist Selection */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
              <Info className="w-4 h-4" /> Artis
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setArtistMode("new")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${artistMode === "new" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"}`}
              >
                Input Manual
              </button>
              <button
                type="button"
                onClick={() => setArtistMode("select")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${artistMode === "select" ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-200 hover:bg-blue-50"}`}
              >
                Pilih Artis Terdaftar
              </button>
            </div>
            {artistMode === "new" ? (
              <input
                type="text"
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                placeholder="Nama artis / stage name..."
                className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500 transition font-medium"
                required
              />
            ) : (
              <select
                value={selectedArtistId}
                onChange={e => setSelectedArtistId(e.target.value)}
                className="w-full border border-blue-200 rounded-xl px-4 py-3 bg-white text-gray-900 outline-none focus:border-blue-500 transition font-medium cursor-pointer"
              >
                <option value="">— Pilih artis —</option>
                {loadingArtists ? (
                  <option disabled>Loading...</option>
                ) : (
                  artists.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.stageName} ({a.user.email})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          {/* Title & Album */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Judul Lagu *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nama lagu..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Nama Album (Opsional)</label>
              <input
                type="text"
                value={album}
                onChange={e => setAlbum(e.target.value)}
                placeholder="Nama album (jika ada)..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium"
              />
            </div>
          </div>

          {/* Genre & Language & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Genre *</label>
              <select
                value={genre}
                onChange={e => setGenre(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Bahasa *</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Tipe Release</label>
              <select
                value={releaseType}
                onChange={e => setReleaseType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                <option value="SINGLE">Single</option>
                <option value="EP">EP</option>
                <option value="ALBUM">Album</option>
              </select>
            </div>
          </div>

          {/* Release Date & Distributor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Tanggal Rilis *</label>
              <input
                type="date"
                value={releaseDate}
                onChange={e => setReleaseDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">Distributor</label>
              <select
                value={distributor}
                onChange={e => setDistributor(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition cursor-pointer"
              >
                {DISTRIBUTORS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* UPC & ISRC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">UPC (Opsional)</label>
              <input
                type="text"
                value={upc}
                onChange={e => setUpc(e.target.value)}
                placeholder="Universal Product Code..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-600 uppercase">ISRC (Opsional)</label>
              <input
                type="text"
                value={isrc}
                onChange={e => setIsrc(e.target.value)}
                placeholder="ID-xxx-YY-NNNNN..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-mono"
              />
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-2xl">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shrink-0"></div>
            <div>
              <p className="text-sm font-bold text-green-800">Status Otomatis: RELEASED</p>
              <p className="text-xs text-green-600">Release ini akan langsung aktif tanpa proses review.</p>
            </div>
          </div>

          {statusMsg && (
            <div className={`p-4 rounded-xl text-sm font-semibold border ${
              statusMsg.startsWith("❌")
                ? "bg-red-50 text-red-700 border-red-100"
                : statusMsg.startsWith("✅")
                ? "bg-green-50 text-green-700 border-green-100"
                : "bg-blue-50 text-blue-700 border-blue-100"
            }`}>
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-gradient-to-r from-[#f000ff] to-[#8a2be2] hover:opacity-90 transition text-white font-bold rounded-2xl flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-purple-500/30 text-base"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {uploading ? "Mengupload cover..." : "Menyimpan release..."}
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Import Release Sekarang
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
