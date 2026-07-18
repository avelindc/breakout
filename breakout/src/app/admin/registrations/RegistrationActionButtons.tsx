"use client";

import { useState } from "react";
import { Check, X, Loader2, Trash2 } from "lucide-react";
import { updateArtistStatusAction, deleteUserAction } from "@/app/actions/admin";

export function RegistrationActionButtons({ userId, userName, userEmail }: { userId: string, userName: string, userEmail: string }) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Apakah Anda yakin ingin MENGHAPUS pendaftaran ${userName} secara permanen? Email ini akan bisa digunakan lagi untuk mendaftar.`)) {
      setLoadingDelete(true);
      await deleteUserAction(userId);
      setLoadingDelete(false);
    }
  };

  const handleApprove = async () => {
    setLoadingApprove(true);
    await updateArtistStatusAction(userId, "APPROVED", userName, userEmail, "");
    setLoadingApprove(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Alasan penolakan harus diisi!");
      return;
    }
    setLoadingReject(true);
    await updateArtistStatusAction(userId, "REJECTED", userName, userEmail, reason);
    setLoadingReject(false);
    setIsRejecting(false);
  };

  return (
    <div className="flex gap-2 justify-end relative">
      {isRejecting ? (
        <div className="absolute right-10 top-0 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-10 w-72">
          <h4 className="font-bold text-gray-900 mb-2">Alasan Penolakan</h4>
          <textarea
            className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition mb-3"
            rows={3}
            placeholder="Masukkan alasan penolakan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsRejecting(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700"
              disabled={loadingReject}
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center gap-1"
              disabled={loadingReject}
            >
              {loadingReject ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              Tolak
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={handleApprove}
        title="Approve"
        disabled={loadingApprove || loadingReject || loadingDelete}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-green-500 hover:bg-green-50 group-hover:text-white group-hover:hover:bg-white/20 transition disabled:opacity-50"
      >
        {loadingApprove ? <Loader2 className="w-4 h-4 animate-spin text-green-500" /> : <Check className="w-4 h-4" />}
      </button>

      <button
        onClick={() => setIsRejecting(true)}
        title="Reject"
        disabled={loadingApprove || loadingReject || loadingDelete}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 group-hover:text-white group-hover:hover:bg-white/20 transition disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>

      <button
        onClick={handleDelete}
        title="Hapus Permanen"
        disabled={loadingApprove || loadingReject || loadingDelete}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 group-hover:text-red-400 group-hover:hover:bg-red-500/20 transition disabled:opacity-50"
      >
        {loadingDelete ? <Loader2 className="w-4 h-4 animate-spin text-red-500" /> : <Trash2 className="w-4 h-4" />}
      </button>
    </div>
  );
}
