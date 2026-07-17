"use client";

import { useState } from "react";
import { registerAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Music, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;
    const ktp = formData.get("ktp") as File;
    
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
      const name = formData.get("name") as string;
      const email = formData.get("email") as string;
      const whatsapp = formData.get("whatsapp") as string;
      router.push(`/register/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(whatsapp)}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <AuroraBackground>
        <div className="w-full max-w-md glass-card p-8 rounded-2xl animate-fade-in relative z-10 my-10">
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7000FF] to-[#00F0FF] flex items-center justify-center mb-4">
              <Music className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-gray-400 text-sm mt-2">Start distributing your music</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <label className="text-sm font-medium text-gray-300">Artist / Stage Name</label>
              <input 
                name="stageName" 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition text-white placeholder-gray-500" 
                placeholder="DJ Awesome"
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
              className="mt-4 w-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] hover:opacity-90 transition text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
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
