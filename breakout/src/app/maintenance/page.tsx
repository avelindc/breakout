import { PrismaClient } from "@prisma/client";
import { Construction, Calendar, Clock, AlertCircle } from "lucide-react";
import { MaintenanceClock } from "./MaintenanceClock";

export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

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

function getYouTubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : "";
}

export default async function MaintenancePage() {
  const activeSetting = await prisma.settings.findUnique({ where: { key: "maintenance_active" } });
  const titleSetting = await prisma.settings.findUnique({ where: { key: "maintenance_title" } });
  const messageSetting = await prisma.settings.findUnique({ where: { key: "maintenance_message" } });
  const startSetting = await prisma.settings.findUnique({ where: { key: "maintenance_start" } });
  const endSetting = await prisma.settings.findUnique({ where: { key: "maintenance_end" } });
  const typeSetting = await prisma.settings.findUnique({ where: { key: "maintenance_type" } });
  const brandSetting = await prisma.settings.findUnique({ where: { key: "brand_logo" } });
  
  const mLogoSetting = await prisma.settings.findUnique({ where: { key: "maintenance_logo_url" } });
  const bgTypeSetting = await prisma.settings.findUnique({ where: { key: "maintenance_bg_type" } });
  const bgVideoSetting = await prisma.settings.findUnique({ where: { key: "maintenance_bg_video" } });

  const title = titleSetting?.value || "Mohon Maaf";
  const message = messageSetting?.value || "Maaf, hari ini operasional BREAKOUT.ID sedang libur. Silakan kembali lagi sesuai jadwal yang telah ditentukan.";
  const startVal = startSetting?.value;
  const endVal = endSetting?.value;
  const maintenanceType = typeSetting?.value || "system";
  const brandLogo = brandSetting?.value || "/logo.png";
  
  const maintenanceLogo = mLogoSetting?.value || brandLogo;
  const bgType = bgTypeSetting?.value || "gradient";
  const bgVideo = bgVideoSetting?.value || "";

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }) + " WIB";
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Types */}
      {bgType === "gradient" && (
        <>
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#f000ff]/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[6000ms]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8a2be2]/10 rounded-full blur-[120px] pointer-events-none animate-pulse duration-[8000ms]"></div>
        </>
      )}

      {bgType === "solid" && (
        <div className="absolute inset-0 bg-black pointer-events-none z-0"></div>
      )}

      {bgType === "video" && bgVideo && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10"></div>
          {bgVideo.includes("youtube.com") || bgVideo.includes("youtu.be") ? (
            <iframe
              src={`https://www.youtube.com/embed/${getYouTubeId(bgVideo)}?autoplay=1&mute=1&loop=1&playlist=${getYouTubeId(bgVideo)}&controls=0&showinfo=0&rel=0&iv_load_policy=3&playsinline=1`}
              className="absolute w-[300%] h-[300%] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover aspect-video pointer-events-none border-none opacity-85"
              allow="autoplay; encrypted-media"
            ></iframe>
          ) : (
            <video
              src={bgVideo}
              autoPlay
              muted
              loop
              playsInline
              className="absolute w-full h-full top-0 left-0 object-cover opacity-90"
            ></video>
          )}
        </div>
      )}

      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-md border border-white/5 rounded-[2.5rem] p-8 md:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center relative z-10 flex flex-col items-center">
        {/* Logo */}
        <div className="w-40 h-16 mb-8 relative flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={maintenanceLogo} alt="BREAKOUT.ID" className="max-w-full max-h-full object-contain" />
        </div>

        {/* Animated Icon */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#f000ff]/70 to-[#8a2be2]/70 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(240,0,255,0.2)] relative group">
          <div className="absolute inset-0 bg-white/10 rounded-3xl animate-ping opacity-25"></div>
          <Construction className="w-12 h-12 text-white animate-pulse" />
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent mb-2">
          {title}
        </h1>
        <p className="text-[#00F0FF] font-bold tracking-wider text-sm uppercase mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse"></span>
          {getIndonesianType(maintenanceType)}
        </p>

        <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8"></div>

        {/* Message Container */}
        <div className="bg-black/30 border border-white/5 rounded-2xl p-6 md:p-8 w-full max-w-lg mb-8 shadow-inner">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-widest mb-3">Pesan dari Admin</h2>
          <p className="text-white/90 font-medium text-base md:text-lg leading-relaxed italic">
            "{message}"
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mb-8 text-left">
          <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-[#f000ff] shrink-0" />
            <div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Waktu Sekarang</div>
              <MaintenanceClock />
            </div>
          </div>

          {startVal && (
            <div className="bg-black/20 border border-white/5 rounded-xl p-4 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#8a2be2] shrink-0" />
              <div>
                <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Mulai Sejak</div>
                <div className="text-sm font-bold text-white/90 mt-0.5">{formatDate(startVal)}</div>
              </div>
            </div>
          )}

          {endVal && (
            <div className="col-span-full bg-black/30 border border-[#00F0FF]/10 rounded-xl p-4 flex items-center gap-3 shadow-[0_0_15px_rgba(0,240,255,0.02)]">
              <AlertCircle className="w-5 h-5 text-[#00F0FF] shrink-0 animate-bounce" />
              <div>
                <div className="text-xs text-white/40 font-medium uppercase tracking-wider">Estimasi Selesai</div>
                <div className="text-sm font-bold text-[#00F0FF] mt-0.5">{formatDate(endVal)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="text-xs text-white/30 font-medium tracking-wide">
          © {new Date().getFullYear()} BREAKOUT.ID. All rights reserved.
        </div>
      </div>
    </main>
  );
}
