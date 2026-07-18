"use client";

import { useState, useEffect } from "react";
import { saveMaintenanceSettingsAction } from "@/app/actions/settingsMaintenance";
import { 
  Construction, Calendar, Clock, AlertCircle, Save, Loader2, 
  Monitor, Smartphone, HelpCircle
} from "lucide-react";

interface MaintenanceSettingsFormProps {
  initialData: {
    maintenance_active: string;
    maintenance_title: string;
    maintenance_message: string;
    maintenance_start: string;
    maintenance_end: string;
    maintenance_type: string;
  };
  brandLogo: string;
}

function getIndonesianType(type: string) {
  switch (type) {
    case "system":
      return "Maintenance Sistem";
    case "operasional":
      return "Libur Operasional";
    case "nasional":
      return "Libur Nasional";
    case "server":
      return "Upgrade Server";
    case "kustom":
      return "Pesan Kustom";
    default:
      return "Pemeliharaan Sistem";
  }
}

export function MaintenanceSettingsForm({ initialData, brandLogo }: MaintenanceSettingsFormProps) {
  const [active, setActive] = useState(initialData.maintenance_active === "true");
  const [title, setTitle] = useState(initialData.maintenance_title || "Mohon Maaf");
  const [message, setMessage] = useState(
    initialData.maintenance_message || 
    "Maaf, hari ini operasional BREAKOUT.ID sedang libur. Silakan kembali lagi sesuai jadwal yang telah ditentukan."
  );
  const [start, setStart] = useState(initialData.maintenance_start || "");
  const [end, setEnd] = useState(initialData.maintenance_end || "");
  const [type, setType] = useState(initialData.maintenance_type || "system");

  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString("id-ID", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Autofill current date/time if start is empty
  useEffect(() => {
    if (!start) {
      const now = new Date();
      // Format to YYYY-MM-DDTHH:MM
      const offset = now.getTimezoneOffset();
      const localNow = new Date(now.getTime() - offset * 60 * 1000);
      setStart(localNow.toISOString().slice(0, 16));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg("");

    const formData = new FormData();
    formData.append("active", active ? "true" : "false");
    formData.append("title", title);
    formData.append("message", message);
    formData.append("start", start);
    formData.append("end", end);
    formData.append("type", type);

    const res = await saveMaintenanceSettingsAction(formData);

    if (res.error) {
      setStatusMsg(`❌ ${res.error}`);
    } else {
      setStatusMsg("✅ Maintenance settings saved successfully!");
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }) + " WIB";
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-8 animate-fade-in mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Settings Form */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Maintenance Mode Control</h2>
            <p className="text-gray-500 text-sm">Control the temporary visibility and redirection settings of the platform.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Toggle switch */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900">Maintenance Status</span>
                <span className="text-xs text-gray-500">Redirect users to maintenance page</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={active} 
                  onChange={(e) => setActive(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#f000ff] peer-checked:to-[#8a2be2]"></div>
              </label>
            </div>

            {/* Type & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Jenis Maintenance</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium cursor-pointer"
                >
                  <option value="system">Maintenance Sistem</option>
                  <option value="operasional">Libur Operasional</option>
                  <option value="nasional">Libur Nasional</option>
                  <option value="server">Upgrade Server</option>
                  <option value="kustom">Pesan Kustom</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase">Judul Maintenance</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mohon Maaf"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-bold"
                  required
                />
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-600 uppercase">Pesan Maintenance</label>
                <button 
                  type="button"
                  onClick={() => setMessage("Maaf, hari ini operasional BREAKOUT.ID sedang libur. Silakan kembali lagi sesuai jadwal yang telah ditentukan.")}
                  className="text-xs text-blue-600 font-bold hover:underline"
                >
                  Reset Default
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Pesan khusus untuk user..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium resize-none"
                required
              ></textarea>
            </div>

            {/* Timing Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
                </label>
                <input
                  type="datetime-local"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Tanggal Selesai (Opsional)
                </label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-gray-50 text-gray-900 outline-none focus:border-blue-500 transition font-medium"
                  />
                  {end && (
                    <button 
                      type="button" 
                      onClick={() => setEnd("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 font-bold bg-white/80 px-2 py-1 rounded"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {statusMsg && (
              <div className={`p-4 rounded-xl text-sm font-semibold border ${
                statusMsg.startsWith("❌") 
                  ? "bg-red-50 text-red-700 border-red-100" 
                  : "bg-green-50 text-green-700 border-green-100"
              }`}>
                {statusMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 transition text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {loading ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </form>
        </div>

        {/* Live Preview Container */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-900 text-lg">Live Preview</h3>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button 
                onClick={() => setPreviewMode("desktop")}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${previewMode === "desktop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Monitor className="w-4 h-4" /> Desktop
              </button>
              <button 
                onClick={() => setPreviewMode("mobile")}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${previewMode === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
              >
                <Smartphone className="w-4 h-4" /> Mobile
              </button>
            </div>
          </div>

          {/* Simulated Screen */}
          <div className={`bg-[#0A0A0C] border border-gray-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-300 w-full flex items-center justify-center p-6 ${
            previewMode === "mobile" ? "max-w-[360px] mx-auto aspect-[9/16] min-h-[580px]" : "aspect-[16/10] min-h-[480px]"
          }`}>
            {/* Background Neon Glows */}
            <div className="absolute top-1/4 left-1/4 w-40 h-40 bg-[#f000ff]/10 rounded-full blur-[50px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-[#8a2be2]/10 rounded-full blur-[50px] pointer-events-none"></div>

            <div className="w-full bg-white/[0.02] backdrop-blur-md border border-white/15 rounded-3xl p-5 md:p-6 text-center relative z-10 flex flex-col items-center shadow-[0_8px_32px_0_rgba(240,0,255,0.05)]">
              {/* Logo */}
              <div className="w-24 h-8 mb-4 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={brandLogo} alt="BREAKOUT.ID" className="w-full h-full object-contain" />
              </div>

              {/* Animated Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#f000ff] to-[#8a2be2] flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(240,0,255,0.2)]">
                <Construction className="w-7 h-7 text-white animate-pulse" />
              </div>

              <h4 className="text-lg md:text-xl font-black text-white leading-tight mb-1">
                {title || "Mohon Maaf"}
              </h4>
              <p className="text-[#00F0FF] font-black tracking-wider text-[10px] uppercase mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F0FF]"></span>
                {getIndonesianType(type)}
              </p>

              <div className="w-full h-[1px] bg-white/10 mb-4"></div>

              {/* Message */}
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3 w-full mb-4">
                <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Pesan dari Admin</div>
                <p className="text-white/95 text-xs font-medium leading-relaxed italic line-clamp-4">
                  "{message || "Tidak ada pesan khusus."}"
                </p>
              </div>

              {/* Timing Grid */}
              <div className="grid grid-cols-1 gap-2 w-full text-left">
                <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#f000ff] shrink-0" />
                  <div>
                    <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Waktu Sekarang</div>
                    <div className="text-[10px] font-bold text-white/90">{currentTime}</div>
                  </div>
                </div>

                {start && (
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#8a2be2] shrink-0" />
                    <div>
                      <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Mulai Sejak</div>
                      <div className="text-[10px] font-bold text-white/90 truncate">{formatDate(start)}</div>
                    </div>
                  </div>
                )}

                {end && (
                  <div className="bg-white/[0.03] border border-[#00F0FF]/10 rounded-lg p-2 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-[#00F0FF] shrink-0" />
                    <div>
                      <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Estimasi Selesai</div>
                      <div className="text-[10px] font-bold text-[#00F0FF] truncate">{formatDate(end)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
