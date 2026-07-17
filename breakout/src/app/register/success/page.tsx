"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { AuroraBackground } from "@/components/AuroraBackground";

import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Artist";
  const email = searchParams.get("email") || "Email";
  const whatsapp = searchParams.get("whatsapp") || "-";

  const adminNumber = "6281330923740";
  const message = `Halo Admin BREAKOUT,

Saya telah berhasil membuat akun di BREAKOUT MUSIC.

Nama:
${name}

Email:
${email}

Nomor WhatsApp:
${whatsapp}

Saya juga telah mengupload identitas sesuai KTP.

Mohon dilakukan proses verifikasi akun saya.

Terima kasih.`;

  const whatsappUrl = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="w-full max-w-lg glass-card p-10 rounded-3xl animate-fade-in relative z-10 my-10 border border-green-500/20 shadow-2xl shadow-green-500/10">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-green-500/20">
          <CheckCircle2 className="text-white w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-3">🎉 Pendaftaran Berhasil</h1>
        <p className="text-gray-300 text-base leading-relaxed">
          Akun Anda telah berhasil dibuat.<br />
          Silakan minta persetujuan kepada Admin BREAKOUT agar akun Anda dapat diaktifkan.
        </p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
        <div className="space-y-4 text-sm text-gray-300">
          <div className="flex justify-between border-b border-white/10 pb-3">
            <span className="text-gray-500">Nama</span>
            <span className="font-medium text-white">{name}</span>
          </div>
          <div className="flex justify-between pb-1">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-white">{email}</span>
          </div>
        </div>
      </div>

      <a 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full bg-[#25D366] hover:bg-[#1DA851] transition-all duration-300 text-white font-bold py-4 px-6 rounded-xl flex justify-center items-center gap-3 shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 hover:-translate-y-1"
      >
        <span>💬 Hubungi Admin untuk Verifikasi</span>
      </a>

      <div className="mt-8 flex justify-center">
        <Link href="/login" className="text-gray-400 hover:text-white transition flex items-center gap-2 text-sm font-medium">
          Ke halaman login <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <AuroraBackground>
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </AuroraBackground>
    </main>
  );
}
