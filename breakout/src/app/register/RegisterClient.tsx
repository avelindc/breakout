"use client";

import { useState, useEffect } from "react";
import { registerAction } from "@/app/actions/auth";
import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function RegisterClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleInitialSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const ktp = formData.get("ktp") as File;
    const email = formData.get("email") as string;
    
    if (password !== confirmPassword) {
      setError("Password dan Konfirmasi Password tidak cocok.");
      setLoading(false);
      return;
    }

    if (ktp && ktp.size > 4 * 1024 * 1024) {
      setError("Ukuran foto KTP maksimal 4MB.");
      setLoading(false);
      return;
    }

    const res = await registerAction(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push(`/register/success?name=${encodeURIComponent(formData.get("name") as string)}&email=${encodeURIComponent(formData.get("email") as string)}&whatsapp=${encodeURIComponent(formData.get("whatsapp") as string)}`);
      router.refresh();
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <AuroraBackground>
        <div className="w-full max-w-md glass-card p-8 rounded-2xl animate-fade-in relative z-10 my-10">
          
          <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 mb-4 relative">
                  <Image src="/logo.png" alt="Break Out Logo" fill className="object-contain" priority />
                </div>
                <h1 className="text-2xl font-bold">Create Account</h1>
                <p className="text-gray-400 text-sm mt-2">Start distributing your music</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleInitialSubmit} className="flex flex-col gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Nama Lengkap (sesuai KTP)</label>
                  <input 
                    name="name" 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500" 
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500" 
                    placeholder="you@example.com"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">NIK (Nomor Induk Kependudukan)</label>
                  <input 
                    name="nik" 
                    type="text" 
                    required
                    minLength={16}
                    maxLength={16}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition text-white placeholder-gray-500" 
                    placeholder="16 Digit NIK"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Alamat Lengkap (Sesuai KTP)</label>
                  <textarea 
                    name="address" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500 resize-none h-24" 
                    placeholder="Jl. Contoh No. 123..."
                  ></textarea>
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Nomor WhatsApp</label>
                  <input 
                    name="whatsapp" 
                    type="tel" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition text-white placeholder-gray-500" 
                    placeholder="081234567890"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Link YouTube Artis</label>
                  <input 
                    name="youtubeUrl" 
                    type="url" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500" 
                    placeholder="https://youtube.com/@artist"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Password</label>
                  <input 
                    name="password" 
                    type="password" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500" 
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Konfirmasi Password</label>
                  <input 
                    name="confirmPassword" 
                    type="password" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition text-white placeholder-gray-500" 
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-300">Upload Foto KTP</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      name="ktp" 
                      accept="image/jpeg, image/png, application/pdf"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 outline-none focus:border-[#00F0FF] transition text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#00F0FF]/10 file:text-[#00F0FF] hover:file:bg-[#00F0FF]/20"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format JPG, PNG, atau PDF. Maksimal 4MB.</p>
                </div>

                <div className="flex items-start gap-3 mt-2">
                  <div className="flex items-center h-5">
                    <input 
                      id="consent" 
                      name="consent" 
                      type="checkbox" 
                      required 
                      className="w-4 h-4 rounded border-gray-600 text-[#00F0FF] bg-white/5 focus:ring-[#00F0FF] focus:ring-offset-gray-900" 
                    />
                  </div>
                  <label htmlFor="consent" className="text-sm text-gray-300 leading-tight cursor-pointer">
                    Saya menyatakan bahwa seluruh data yang saya kirim adalah benar dan sesuai identitas asli saya.
                  </label>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="mt-4 w-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] hover:opacity-90 transition text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-[#7000FF]/25"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Daftar"}
                </button>
              </form>

              <p className="mt-8 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-[#00F0FF] hover:underline">
                  Log in
                </Link>
              </p>

        </div>
      </AuroraBackground>
    </main>
  );
}
