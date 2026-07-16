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
    const res = await registerAction(formData);

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      router.push("/login?registered=true");
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
              <label className="text-sm font-medium text-gray-300">Full Name</label>
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
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <input 
                name="email" 
                type="email" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#00F0FF] transition text-white placeholder-gray-500" 
                placeholder="you@example.com"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <input 
                name="password" 
                type="password" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-[#7000FF] transition text-white placeholder-gray-500" 
                placeholder="••••••••"
                minLength={8}
              />
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
