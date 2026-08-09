"use client";

import { useState } from "react";
import { updateWithdrawalSettings } from "@/app/actions/settings";
import { Save, Loader2, Wallet, ToggleLeft, ToggleRight } from "lucide-react";

export function WithdrawalSettingsForm({ initialEnabled = true }: { initialEnabled?: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const res = await updateWithdrawalSettings({ enabled });
    if (res.success) {
      alert("Pengaturan penarikan berhasil disimpan!");
    } else {
      alert(res.error || "Gagal menyimpan");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-green-500" /> Pengaturan Penarikan (Withdrawal)
      </h2>
      <p className="text-sm text-gray-500 mb-6">Aktifkan atau matikan fitur penarikan saldo untuk seluruh user.</p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Izinkan Penarikan Saldo</h3>
            <p className="text-xs text-gray-500">Jika dimatikan, user tidak akan bisa membuat request penarikan baru.</p>
          </div>
          <button 
            onClick={() => setEnabled(!enabled)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${enabled ? "bg-green-500" : "bg-red-500"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${enabled ? "translate-x-6" : "translate-x-0"}`}>
              {enabled ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-red-500" />}
            </div>
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading}
        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </div>
  );
}
