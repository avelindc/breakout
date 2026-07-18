"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

interface WithdrawalRequest {
  id: string;
  amount: number;
  userId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  user: {
    name: string | null;
    artists: { stageName: string }[];
  };
}

interface WithdrawalActionButtonsProps {
  req: WithdrawalRequest;
  updateAction: (formData: FormData) => Promise<void>;
}

export function WithdrawalActionButtons({ req, updateAction }: WithdrawalActionButtonsProps) {
  const [loadingAction, setLoadingAction] = useState<"REJECTED" | "PAID" | null>(null);

  async function handleAction(status: "REJECTED" | "PAID") {
    setLoadingAction(status);
    const formData = new FormData();
    formData.set("requestId", req.id);
    formData.set("userId", req.userId);
    formData.set("amount", String(req.amount));
    formData.set("status", status);
    try {
      await updateAction(formData);
    } finally {
      setLoadingAction(null);
    }
  }

  const isLoading = loadingAction !== null;

  return (
    <div className="mt-auto flex gap-3 border-t border-gray-100 pt-4">
      {/* Reject Button */}
      <button
        onClick={() => handleAction("REJECTED")}
        disabled={isLoading}
        className="flex-1 py-2.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 active:scale-95 font-medium transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingAction === "REJECTED" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Rejecting...</span>
          </>
        ) : (
          <>
            <X className="w-4 h-4" />
            <span>Reject</span>
          </>
        )}
      </button>

      {/* Mark Paid Button */}
      <button
        onClick={() => handleAction("PAID")}
        disabled={isLoading}
        className="flex-1 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 active:scale-95 font-medium transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingAction === "PAID" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Check className="w-4 h-4" />
            <span>Mark Paid</span>
          </>
        )}
      </button>
    </div>
  );
}
