"use client";

import { useState, useEffect, useRef } from "react";
import { registerAction, sendOtpAction } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Music, Loader2, ArrowLeft, Mail } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for OTP
  const [savedFormData, setSavedFormData] = useState<FormData | null>(null);
  const [emailForOtp, setEmailForOtp] = useState<string>("");
  const [otpValue, setOtpValue] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

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

    // Attempt to send OTP
    const res = await sendOtpAction(email);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      // Success sending OTP, move to step 2
      setSavedFormData(formData);
      setEmailForOtp(email);
      setStep(2);
      setResendCooldown(60); // 60 seconds cooldown
      setLoading(false);
      setError(null);
    }
  }

  async function handleVerifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!savedFormData) {
      setError("Data pendaftaran hilang. Silakan muat ulang halaman.");
      setLoading(false);
      return;
    }
    
    if (otpValue.length !== 6) {
      setError("OTP harus 6 digit.");
      setLoading(false);
      return;
    }

    // Append OTP to the existing FormData
    savedFormData.set("otp", otpValue);

    const res = await registerAction(savedFormData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      const name = savedFormData.get("name") as string;
      const email = savedFormData.get("email") as string;
      const whatsapp = savedFormData.get("whatsapp") as string;
      router.push(`/register/success?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&whatsapp=${encodeURIComponent(whatsapp)}`);
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    
    setError(null);
    setLoading(true);
    
    const res = await sendOtpAction(emailForOtp);
    if (res?.error) {
      setError(res.error);
    } else {
      setError("Kode OTP baru telah dikirim.");
      setResendCooldown(60);
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6">
      <AuroraBackground>
        <div className="w-full max-w-md glass-card p-8 rounded-2xl animate-fade-in relative z-10 my-10">
          
          {step === 1 ? (
            <>
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
            </>
          ) : (
            <>
              <button 
                onClick={() => setStep(1)} 
                className="absolute top-6 left-6 text-gray-400 hover:text-white transition flex items-center gap-1 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Kembali
              </button>

              <div className="flex flex-col items-center mb-8 mt-6">
                <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 flex items-center justify-center mb-4 border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                  <Mail className="text-[#00F0FF] w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold">Verifikasi Email</h1>
                <p className="text-gray-300 text-sm mt-3 text-center">
                  Kode OTP 6-digit telah dikirim ke:<br/>
                  <span className="font-semibold text-white">{emailForOtp}</span>
                </p>
              </div>

              {error && (
                <div className={`mb-6 p-3 ${error.includes("baru") ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} border rounded-lg text-sm text-center`}>
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="flex flex-col gap-6">
                <div className="space-y-1 flex flex-col items-center">
                  <label className="text-sm font-medium text-gray-300 mb-2">Input 6 digit OTP</label>
                  <input 
                    name="otp" 
                    type="text" 
                    required
                    maxLength={6}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full max-w-[200px] text-center text-2xl tracking-[0.5em] bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-600" 
                    placeholder="000000"
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    type="submit" 
                    disabled={loading || otpValue.length !== 6}
                    className="w-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] hover:opacity-90 transition text-white font-semibold py-3 rounded-lg flex justify-center items-center gap-2 shadow-lg shadow-[#7000FF]/25 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verifikasi"}
                  </button>

                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    disabled={loading || resendCooldown > 0}
                    className="w-full bg-transparent hover:bg-white/5 border border-white/10 transition text-gray-300 text-sm font-medium py-3 rounded-lg flex justify-center items-center gap-2 disabled:opacity-50"
                  >
                    {resendCooldown > 0 
                      ? `Kirim Ulang OTP (${resendCooldown}s)` 
                      : "Kirim Ulang OTP"
                    }
                  </button>
                </div>
              </form>
            </>
          )}

        </div>
      </AuroraBackground>
    </main>
  );
}
