"use client";

import { useState } from "react";
import { withdrawAction } from "@/app/actions/withdraw";
import { Loader2, CreditCard, CheckCircle2 } from "lucide-react";

export function WithdrawForm({ availableBalance }: { availableBalance: number }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await withdrawAction(formData);
      
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 4000);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Withdrawal request submitted! We will process it shortly.
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-300">Amount (IDR)</label>
        <div className="relative">
          <span className="absolute left-4 top-3.5 text-gray-500 font-bold">Rp</span>
          <input
            required
            name="amount"
            type="number"
            step="1"
            max={availableBalance}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 outline-none focus:border-[#7000FF] transition"
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500">Minimum withdrawal is Rp 50.000</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-300">Bank Name</label>
        <input required name="bankName" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="e.g. BCA, Mandiri, BRI" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-300">Account Name</label>
        <input required name="accountName" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="Budi Santoso" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-300">Account Number</label>
        <input required name="accountNumber" type="text" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition" placeholder="1234567890" />
      </div>

      <button
        type="submit"
        disabled={loading || availableBalance < 50}
        className="mt-4 w-full py-4 rounded-xl bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-bold hover:opacity-90 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 relative overflow-hidden"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>Request Submitted!</span>
          </>
        ) : (
          <span>Submit Request</span>
        )}
      </button>
    </form>
  );
}
