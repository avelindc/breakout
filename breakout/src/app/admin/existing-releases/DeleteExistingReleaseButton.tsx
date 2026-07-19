"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteExistingReleaseAction } from "@/app/actions/admin";

export default function DeleteExistingReleaseButton({ releaseId, releaseTitle }: { releaseId: string, releaseTitle: string }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus lagu "${releaseTitle}" dari Existing Releases? Data ini akan terhapus permanen.`)) return;
    
    setIsDeleting(true);
    const res = await deleteExistingReleaseAction(releaseId);
    setIsDeleting(false);
    
    if (res?.error) {
      alert("Gagal menghapus: " + res.error);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-gray-400 hover:text-red-500 transition disabled:opacity-50 ml-2"
      title="Hapus Lagu Ini"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
