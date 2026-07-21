"use client";

import { useState, useRef } from "react";
import { 
  ArrowLeft, Edit, Ban, CheckCircle, Key, Mail, 
  Music, Disc, DollarSign, ArrowDownCircle, Play, Pause,
  Search, Filter, Activity, Eye, Trash2, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateArtistStatusAction, resetUserPassword, deleteUserAction, resetArtistDataAction } from "@/app/actions/admin";

type ArtistDetailClientProps = {
  user: any;
  stats: {
    totalReleases: number;
    totalTracks: number;
    totalRoyalties: number;
    totalStreams: number;
    totalWithdrawals: number;
  };
  allTracks: any[];
};

export function ArtistDetailClient({ user, stats, allTracks }: ArtistDetailClientProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  
  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const primaryArtist = user.artists[0] || {};
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount));
  };

  // Filter tracks
  const filteredTracks = allTracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (track.release.title && track.release.title.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterStatus === "ALL") return matchesSearch;
    return matchesSearch && track.release.status === filterStatus;
  });

  const handlePlay = (trackId: string, url: string) => {
    if (playingTrack === trackId) {
      audioRef.current?.pause();
      setPlayingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingTrack(trackId);
      }
    }
  };
  
  const handleStatusChange = async (newStatus: "APPROVED" | "SUSPENDED") => {
    setIsProcessing(true);
    const res = await updateArtistStatusAction(user.id, newStatus, user.name || "Artist", user.email);
    setIsProcessing(false);
    
    if (res?.error) {
      setMessage({ text: res.error, type: 'error' });
    } else {
      setMessage({ text: `Account successfully ${newStatus.toLowerCase()}`, type: 'success' });
      router.refresh();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    const res = await resetUserPassword(user.id, newPassword);
    setIsProcessing(false);
    
    if (res?.error) {
      setMessage({ text: res.error, type: 'error' });
    } else {
      setMessage({ text: 'Password successfully reset', type: 'success' });
      setShowPasswordModal(false);
      setNewPassword("");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("PERINGATAN: Apakah Anda yakin ingin menghapus Artis dan User ini secara permanen? Seluruh lagu, royalty, dan data terkait akan terhapus dan TIDAK DAPAT dikembalikan!")) return;
    
    setIsProcessing(true);
    const res = await deleteUserAction(user.id);
    if (res?.error) {
      setIsProcessing(false);
      setMessage({ text: res.error, type: 'error' });
    } else {
      router.push('/admin/artists');
    }
  };

  const handleResetData = async () => {
    if (!primaryArtist.id) return;
    if (!confirm("PERINGATAN: Anda akan mereset seluruh data streaming & royalty hasil import untuk artis ini menjadi 0. Data lagu master tetap aman. Yakin?")) return;
    
    setIsProcessing(true);
    const res = await resetArtistDataAction(primaryArtist.id);
    setIsProcessing(false);
    
    if (res?.error) {
      setMessage({ text: res.error, type: 'error' });
    } else {
      setMessage({ text: 'Data streaming & royalty berhasil direset menjadi 0.', type: 'success' });
      router.refresh();
    }
  };

  return (
    <div className="text-gray-700 pb-20 font-sans animate-fade-in w-full h-full max-w-7xl mx-auto">
      <audio ref={audioRef} onEnded={() => setPlayingTrack(null)} />
      
      {/* Header & Back Button */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/admin/all-artists" className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back to Artists</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
            user.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
            user.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
            'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {user.status}
          </span>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl border text-sm font-medium ${
          message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Profile & Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
            <img 
              src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg mb-4"
            />
            <h2 className="text-xl font-bold text-gray-900">{primaryArtist.stageName || user.name}</h2>
            <p className="text-sm text-gray-500 mb-4">{user.name}</p>
            
            <div className="w-full space-y-3 text-sm text-left border-t border-gray-100 pt-4">
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Email</span>
                <span className="text-gray-800 font-medium truncate">{user.email}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">WhatsApp</span>
                <span className="text-gray-800 font-medium">{user.whatsapp || '-'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Joined</span>
                <span className="text-gray-800 font-medium">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Admin Actions</h3>
            <div className="space-y-3">
              {user.status !== 'APPROVED' && (
                <button 
                  onClick={() => handleStatusChange("APPROVED")}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 rounded-xl transition font-medium"
                >
                  <CheckCircle className="w-4 h-4" /> Activate Account
                </button>
              )}
              {user.status !== 'SUSPENDED' && (
                <button 
                  onClick={() => handleStatusChange("SUSPENDED")}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl transition font-medium"
                >
                  <Ban className="w-4 h-4" /> Suspend Account
                </button>
              )}
              
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition font-bold shadow-sm"
              >
                <Key className="w-4 h-4" /> Reset Password
              </button>
              
              <a 
                href={`mailto:${user.email}`}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl transition font-bold shadow-sm"
              >
                <Mail className="w-4 h-4" /> Send Message
              </a>

              <div className="pt-4 border-t border-gray-100 mt-4 space-y-3">
                <button 
                  onClick={handleResetData}
                  disabled={isProcessing || !primaryArtist.id}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-400 rounded-xl transition font-medium"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Royalty Data
                </button>
                
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isProcessing}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-red-600/10 hover:bg-red-600/20 border border-red-600/20 text-red-500 rounded-xl transition font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Delete Account & Artist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Songs */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition shadow-sm overflow-hidden">
              <Music className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate w-full px-1" title={stats.totalTracks.toString()}>{stats.totalTracks}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Songs</div>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition shadow-sm overflow-hidden">
              <Disc className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate w-full px-1" title={stats.totalReleases.toString()}>{stats.totalReleases}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Releases</div>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition shadow-sm overflow-hidden">
              <DollarSign className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-lg sm:text-xl lg:text-xl font-extrabold text-gray-900 truncate w-full px-1" title={formatCurrency(stats.totalRoyalties)}>{formatCurrency(stats.totalRoyalties)}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Royalties</div>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-5 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition shadow-sm overflow-hidden">
              <ArrowDownCircle className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-lg sm:text-xl lg:text-xl font-extrabold text-gray-900 truncate w-full px-1" title={formatCurrency(stats.totalWithdrawals)}>{formatCurrency(stats.totalWithdrawals)}</div>
              <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Withdrawals</div>
            </div>
          </div>

          {/* Songs List Section */}
          <div className="bg-white/60 backdrop-blur-md border border-white/50 rounded-3xl p-6 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Music className="w-5 h-5 text-purple-500" /> Artist Tracks
              </h2>
              
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="Search songs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded-full pl-9 pr-4 py-2 w-full md:w-64 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                  />
                </div>
                
                <select 
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border border-gray-200 text-sm font-medium text-gray-800 rounded-full px-4 py-2 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 transition cursor-pointer appearance-none shadow-sm"
                >
                  <option value="ALL">All Status</option>
                  <option value="APPROVED">Approved</option>
                  <option value="PENDING">Pending</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredTracks.map((track) => (
                <div key={track.id} className="flex flex-col md:flex-row items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl hover:border-purple-300 hover:shadow-md transition shadow-sm group">
                  
                  {/* Play Button & Cover */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 group/cover border border-gray-100">
                    <img src={track.release.coverArtworkUrl} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition">
                      <button 
                        onClick={() => handlePlay(track.id, track.audioUrl)}
                        className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-purple-600 hover:scale-110 transition shadow-lg"
                      >
                        {playingTrack === track.id ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                      </button>
                    </div>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-purple-600 transition">{track.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mt-1">
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-md">{track.release.type}</span>
                      <span>•</span>
                      <span>{track.release.genre}</span>
                      <span>•</span>
                      <span>{new Date(track.release.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Additional Info (ISRC/UPC/Status) */}
                  <div className="flex-1 min-w-0 text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium text-xs">ISRC:</span>
                      <span className="text-gray-600 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{track.isrc || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 font-medium text-xs">UPC:</span>
                      <span className="text-gray-600 font-mono text-xs bg-gray-50 px-2 py-0.5 rounded">{track.upc || '-'}</span>
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end gap-3 ml-auto">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      track.release.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                      track.release.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {track.release.status}
                    </span>
                    
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handlePlay(track.id, track.audioUrl)}
                        className={`p-2 rounded-lg transition flex items-center justify-center shadow-sm ${playingTrack === track.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'}`}
                        title={playingTrack === track.id ? "Pause" : "Play"}
                      >
                        {playingTrack === track.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTracks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Music className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p>No tracks found matching your filter.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-gray-100 p-8 rounded-3xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Key className="w-5 h-5 text-purple-500"/> Reset Password</h3>
            <p className="text-sm font-medium text-gray-500 mb-6">Enter a new password for {user.name}.</p>
            
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <input 
                  type="text" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password..."
                  required
                  minLength={8}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition font-medium"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isProcessing}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition"
                >
                  Save Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
