"use client";

import { useState, useCallback } from "react";
import {
  X, Eye, FileText, Phone, Mail, MapPin, CreditCard,
  Calendar, Check, Loader2, Trash2, Shield, ZoomIn, ZoomOut
} from "lucide-react";
import { updateArtistStatusAction, deleteUserAction } from "@/app/actions/admin";

interface CardData {
  id: string;
  name: string;
  email: string;
  whatsapp: string | null;
  nik: string | null;
  address: string | null;
  status: string;
  createdAt: string;
  ktpUrl: string | null;
  contractUrl: string | null;
  signatureUrl: string | null;
  hasContract: boolean;
  contractSignedAt: string | null;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function maskNIK(nik: string) {
  if (nik.length <= 6) return nik;
  return nik.slice(0, 4) + " •••• •••• " + nik.slice(-4);
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-400",
    APPROVED: "bg-green-400",
    REJECTED: "bg-red-400",
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status] || "bg-gray-400"}`}></span>;
}

/* ========================= */
/* Document Zoom Viewer      */
/* ========================= */


/* ========================= */
/* Main Component            */
/* ========================= */
export function RegistrationCards({ cards }: { cards: CardData[] }) {
  const [visibleCards, setVisibleCards] = useState<CardData[]>(cards);
  const [selectedCard, setSelectedCard] = useState<CardData | null>(null);
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const [docViewer, setDocViewer] = useState<{ url: string; label: string } | null>(null);

  const removeCard = useCallback((id: string) => {
    setVisibleCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleApprove = async (card: CardData) => {
    setLoadingApprove(true);
    await updateArtistStatusAction(card.id, "APPROVED", card.name, card.email, "");
    
    // Update status in local state and re-sort: PENDING first, then APPROVED
    setVisibleCards(prev => {
      const updated = prev.map(c => c.id === card.id ? { ...c, status: "APPROVED" } : c);
      return [...updated].sort((a, b) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });
    setLoadingApprove(false);
    setSelectedCard(null);
  };

  const handleReject = async (card: CardData) => {
    if (!reason.trim()) {
      alert("Alasan penolakan harus diisi!");
      return;
    }
    setLoadingReject(true);
    await updateArtistStatusAction(card.id, "REJECTED", card.name, card.email, reason);
    // Instantly remove from view (thrown to trash)
    removeCard(card.id);
    setLoadingReject(false);
    setRejectMode(false);
    setReason("");
    setSelectedCard(null);
  };

  const handleDelete = async (card: CardData) => {
    if (confirm(`Hapus pendaftaran ${card.name} secara permanen?`)) {
      setLoadingDelete(true);
      const res = await deleteUserAction(card.id);
      if (res.error) { alert(res.error); setLoadingDelete(false); return; }
      removeCard(card.id);
      setLoadingDelete(false);
      setSelectedCard(null);
    }
  };

  return (
    <>
      {/* Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleCards.map((card) => (
          <div
            key={card.id}
            onClick={() => { setSelectedCard(card); setRejectMode(false); setReason(""); }}
            className="cursor-pointer group"
          >
            {/* Visa-style Card */}
            <div className="relative w-full aspect-[1.586/1] rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
              {/* Background gradient - green for approved, purple for pending */}
              <div className={`absolute inset-0 ${
                card.status === "APPROVED"
                  ? "bg-gradient-to-br from-[#059669] via-[#10b981] to-[#34d399]"
                  : "bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#a855f7]"
              }`}></div>
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-[0.08]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}></div>
              {/* Glow */}
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/10 rounded-full blur-2xl"></div>

              {/* Content */}
              <div className="relative z-10 h-full p-5 flex flex-col justify-between">
                {/* Top: chip + status */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-inner flex items-center justify-center">
                    <div className="w-6 h-4 border border-yellow-600/30 rounded-sm bg-gradient-to-r from-yellow-400 to-yellow-300"></div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                    <StatusDot status={card.status} />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                      {card.status === "APPROVED" ? "Verified" : "Pending"}
                    </span>
                  </div>
                </div>

                {/* Middle: Name */}
                <div className="mt-auto">
                  <p className="text-white/50 text-[9px] font-bold uppercase tracking-[0.3em] mb-1">Member</p>
                  <p className="text-white font-bold text-base md:text-lg tracking-wide truncate">
                    {card.name}
                  </p>
                </div>

                {/* Bottom: email + date */}
                <div className="flex items-end justify-between mt-2">
                  <div className="min-w-0 flex-1 pr-4">
                    <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mb-0.5">Email</p>
                    <p className="text-white/80 text-[10px] font-medium truncate">{card.email}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-white/40 text-[8px] font-bold uppercase tracking-widest mb-0.5">Since</p>
                    <p className="text-white/80 text-[10px] font-medium">{formatDate(card.createdAt)}</p>
                  </div>
                </div>

                {/* Contactless icon */}
                <div className="absolute top-5 right-[4.5rem] text-white/20">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6.5 6.5c3.5-3.5 8.5-3.5 11 0" /><path d="M8.5 8.5c2-2 5-2 7 0" /><path d="M10.5 10.5c1-1 2.5-1 3.5 0" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {visibleCards.length === 0 && (
        <div className="text-center py-16 text-gray-400 bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
          <p className="text-lg font-semibold">Semua registrasi sudah diproses.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCard && !docViewer && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99998] flex items-center justify-center p-4"
          onClick={() => { setSelectedCard(null); setRejectMode(false); }}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`relative p-6 pb-4 rounded-t-3xl ${
              selectedCard.status === "APPROVED"
                ? "bg-gradient-to-br from-[#059669] via-[#10b981] to-[#34d399]"
                : "bg-gradient-to-br from-[#7c3aed] via-[#9333ea] to-[#a855f7]"
            }`}>
              <button
                onClick={() => { setSelectedCard(null); setRejectMode(false); }}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-xl shadow-lg">
                  {getInitials(selectedCard.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-bold text-white truncate">{selectedCard.name}</h2>
                  <p className="text-white/70 text-sm truncate">{selectedCard.email}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <StatusDot status={selectedCard.status} />
                <span className="text-white/90 text-xs font-bold uppercase tracking-wider">
                  {selectedCard.status === "APPROVED" ? "Verified" : selectedCard.status}
                </span>
                <span className="text-white/50 text-xs ml-auto">Daftar: {formatDate(selectedCard.createdAt)}</span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Info rows */}
              <div className="grid grid-cols-1 gap-3">
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={selectedCard.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="WhatsApp" value={selectedCard.whatsapp || "Tidak diisi"} />
                <InfoRow icon={<CreditCard className="w-4 h-4" />} label="NIK" value={selectedCard.nik ? maskNIK(selectedCard.nik) : "Tidak diisi"} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Alamat" value={selectedCard.address || "Tidak diisi"} />
              </div>

              {/* Documents */}
              <div className="pt-3 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dokumen</h3>
                <div className="flex flex-col gap-3">
                  {/* KTP */}
                  {selectedCard.ktpUrl ? (
                    <button
                      onClick={() => setDocViewer({ url: selectedCard.ktpUrl!, label: `KTP — ${selectedCard.name}` })}
                      className="flex items-center gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition group text-left w-full"
                    >
                      <Eye className="w-4 h-4 text-blue-600 animate-pulse" />
                      <span className="text-sm font-bold text-blue-700">Lihat KTP (Zoom)</span>
                      <ZoomIn className="w-3.5 h-3.5 text-blue-400 ml-auto opacity-0 group-hover:opacity-100 transition" />
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 w-full">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-400">KTP: N/A</span>
                    </div>
                  )}

                  {/* Contract Text */}
                  {selectedCard.hasContract ? (
                    <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-2.5 w-full">
                      <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span>Isi Kontrak Perjanjian (Teks)</span>
                      </div>
                      
                      <div className="text-xs text-gray-700 bg-white p-3.5 rounded-xl border border-gray-100 max-h-56 overflow-y-auto space-y-3 leading-relaxed font-sans shadow-inner">
                        <p className="font-bold text-center uppercase border-b pb-1 text-gray-800">PERJANJIAN DISTRIBUSI DIGITAL</p>
                        <p className="text-[11px] text-justify text-gray-600">
                          Dibuat dan disepakati Perjanjian Distribusi Digital oleh dan antara:
                        </p>
                        <div className="pl-2 border-l-2 border-purple-200 space-y-1 text-[11px] text-gray-800 font-medium">
                          <p><strong>PIHAK PERTAMA:</strong> BREAK OUT MUSIC RECORD (Founder & CEO: Muhammad Belva Citta Apprillio)</p>
                          <p><strong>PIHAK KEDUA:</strong> {selectedCard.name} (NIK: {selectedCard.nik || "-"}, Alamat: {selectedCard.address || "-"})</p>
                        </div>
                        
                        <div className="space-y-2 pt-2 border-t text-[11px]">
                          <p><strong>1. PEMBERIAN HAK:</strong> PIHAK KEDUA melisensikan eksklusif Master Audio & Video kepada PIHAK PERTAMA untuk dieksploitasi dalam format digital di seluruh dunia (World Wide) selama 2 tahun.</p>
                          <p><strong>2. BAGI HASIL:</strong> Komposisi bagi hasil disepakati sebesar 72,5% untuk PIHAK KEDUA dan 27,5% untuk PIHAK PERTAMA.</p>
                          <p><strong>3. JAMINAN KARYA:</strong> PIHAK KEDUA menjamin karya original (bukan plagiarisme, cover tanpa izin, atau vokal AI tanpa izin). PIHAK PERTAMA berhak melakukan take down sepihak jika terbukti melanggar.</p>
                          <p><strong>4. PEMBAYARAN:</strong> Laporan dikirimkan tanggal 5 setiap bulan setelah masa tunggu 90 hari. Minimal pengajuan invoice sebesar Rp10.000.</p>
                        </div>

                        <p className="text-center text-[10px] font-bold text-green-600 bg-green-50 py-1.5 rounded-lg border border-green-200 mt-2">
                          ✓ Ditandatangani secara digital oleh {selectedCard.name}
                        </p>
                      </div>
                      
                      {selectedCard.contractSignedAt && (
                        <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Disetujui tanggal: {formatDate(selectedCard.contractSignedAt)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 w-full">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-medium text-red-400">Belum Ada Kontrak yang Disetujui</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Reject Form */}
              {rejectMode && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-3">
                  <h4 className="font-bold text-red-700 text-sm">Alasan Penolakan</h4>
                  <textarea
                    className="w-full text-sm p-3 border border-red-200 rounded-xl outline-none focus:border-red-500 transition bg-white text-gray-900"
                    rows={3}
                    placeholder="Masukkan alasan penolakan..."
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
                      onClick={() => handleReject(selectedCard)}
                      disabled={loadingReject}
                      className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {loadingReject && <Loader2 className="w-3 h-3 animate-spin" />}
                      Tolak & Buang
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {!rejectMode && (
                <div className="flex gap-2 pt-2">
                  {selectedCard.status !== "APPROVED" && (
                    <button
                      onClick={() => handleApprove(selectedCard)}
                      disabled={loadingApprove || loadingDelete}
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90 transition text-white font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                    >
                      {loadingApprove ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Approve
                    </button>
                  )}
                  {selectedCard.status !== "APPROVED" && (
                    <button
                      onClick={() => setRejectMode(true)}
                      disabled={loadingApprove || loadingDelete}
                      className="flex-1 h-12 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition text-gray-600 font-bold rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(selectedCard)}
                    disabled={loadingApprove || loadingDelete}
                    className="w-12 h-12 bg-gray-100 hover:bg-red-50 hover:text-red-600 transition text-gray-400 rounded-2xl flex items-center justify-center disabled:opacity-50 shrink-0"
                    title="Hapus Permanen"
                  >
                    {loadingDelete ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Document Zoom Viewer (Only for KTP images) */}
      {docViewer && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-[99999] flex flex-col items-center justify-center p-4"
          onClick={() => setDocViewer(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <button
              onClick={() => setDocViewer(null)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 transition flex items-center justify-center text-white font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="max-w-[90vw] max-h-[85vh] flex items-center justify-center relative bg-black/40 p-2 rounded-2xl">
            <img
              src={docViewer.url}
              alt={docViewer.label}
              className="rounded-xl max-w-full max-h-[80vh] object-contain shadow-2xl"
            />
          </div>
          <p className="text-white/60 text-xs font-mono mt-3">{docViewer.label}</p>
        </div>
      )}
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}
