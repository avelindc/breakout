"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { updateReleaseStatusAction } from "@/app/actions/admin";

export function ReleaseActionButtons({ 
  releaseId, 
  artistUserId, 
  userName, 
  userEmail, 
  title 
}: { 
  releaseId: string, 
  artistUserId: string, 
  userName: string, 
  userEmail: string, 
  title: string 
}) {
  const [isRejecting, setIsRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [loadingApprove, setLoadingApprove] = useState(false);
  const [loadingReject, setLoadingReject] = useState(false);

  const handleApprove = async () => {
    setLoadingApprove(true);
    await updateReleaseStatusAction(releaseId, artistUserId, "APPROVED", userName, userEmail, title, "");
    setLoadingApprove(false);
  };

  const handleReject = async () => {
    if (!reason.trim()) {
      alert("Alasan penolakan harus diisi!");
      return;
    }
    setLoadingReject(true);
    await updateReleaseStatusAction(releaseId, artistUserId, "REJECTED", userName, userEmail, title, reason);
    setLoadingReject(false);
    setIsRejecting(false);
  };

  return (
    <div className="flex gap-2 justify-end">
      {isRejecting ? (
        <div className="absolute right-8 mt-10 bg-white p-4 rounded-xl shadow-xl border border-gray-100 z-10 w-72">
          <h4 className="font-bold text-gray-900 mb-2">Alasan Penolakan Rilisan</h4>
          <textarea
            className="w-full text-sm p-2 border border-gray-200 rounded-lg outline-none focus:border-red-500 transition mb-3"
            rows={3}
            placeholder="Misal: Kualitas audio kurang baik, metadata tidak sesuai..."
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
              Tolak Rilisan
            </button>
          </div>
        </div>
      ) : null}

      <button
        onClick={handleApprove}
        title="Approve"
        disabled={loadingApprove || loadingReject}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition disabled:opacity-50"
      >
        {loadingApprove ? <Loader2 className="w-4 h-4 animate-spin text-green-500" /> : <Check className="w-4 h-4" />}
      </button>

      <button
        onClick={() => setIsRejecting(true)}
        title="Reject"
        disabled={loadingApprove || loadingReject}
        className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition disabled:opacity-50"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
