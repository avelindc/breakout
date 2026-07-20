"use client";

import { useState } from "react";
import { updateCatalogVisibility } from "@/app/actions/settings";
import { Save, Loader2, Library, EyeOff, Eye } from "lucide-react";

export function CatalogVisibilitySettings({ 
  initialRph = true, 
  initialKhana = true, 
  initialHalo = true 
}: { 
  initialRph?: boolean, 
  initialKhana?: boolean, 
  initialHalo?: boolean 
}) {
  const [rph, setRph] = useState(initialRph);
  const [khana, setKhana] = useState(initialKhana);
  const [halo, setHalo] = useState(initialHalo);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    const res = await updateCatalogVisibility({ rph, khana, halo });
    if (res.success) {
      alert("Pengaturan katalog berhasil disimpan!");
    } else {
      alert(res.error || "Gagal menyimpan");
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Library className="w-6 h-6 text-indigo-500" /> Pengaturan Visibilitas Katalog
      </h2>
      <p className="text-sm text-gray-500 mb-6">Aktifkan atau matikan katalog ini agar muncul atau hilang dari Dashboard Artis (User).</p>
      
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Katalog RPH</h3>
            <p className="text-xs text-gray-500">Tampilkan menu Katalog RPH di dasbor user</p>
          </div>
          <button 
            onClick={() => setRph(!rph)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${rph ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${rph ? "translate-x-6" : "translate-x-0"}`}>
              {rph ? <Eye className="w-3 h-3 text-green-500" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Katalog Khana</h3>
            <p className="text-xs text-gray-500">Tampilkan menu Katalog Khana di dasbor user</p>
          </div>
          <button 
            onClick={() => setKhana(!khana)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${khana ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${khana ? "translate-x-6" : "translate-x-0"}`}>
              {khana ? <Eye className="w-3 h-3 text-green-500" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
            </div>
          </button>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">Katalog Halo</h3>
            <p className="text-xs text-gray-500">Tampilkan menu Katalog Halo di dasbor user</p>
          </div>
          <button 
            onClick={() => setHalo(!halo)}
            className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors ${halo ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform flex items-center justify-center ${halo ? "translate-x-6" : "translate-x-0"}`}>
              {halo ? <Eye className="w-3 h-3 text-green-500" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
            </div>
          </button>
        </div>
      </div>

      <button 
        onClick={handleSave}
        disabled={loading}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {loading ? "Menyimpan..." : "Simpan Visibilitas"}
      </button>
    </div>
  );
}
