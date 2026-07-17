import Link from "next/link";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Music, PlayCircle, BarChart3, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#7000FF] to-[#00F0FF] flex items-center justify-center">
              <Music className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tighter">BREAKOUT.ID</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <Link href="#features" className="hover:text-white transition">Features</Link>
            <Link href="#analytics" className="hover:text-white transition">Analytics</Link>
            <Link href="#pricing" className="hover:text-white transition">Pricing</Link>
            <Link href="#artists" className="hover:text-white transition">Artists</Link>
            <Link href="#blog" className="hover:text-white transition">Blog</Link>
            <Link href="#contact" className="hover:text-white transition">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium hover:text-white transition text-gray-300">Login</Link>
            <Link href="/register" className="text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition">Start Free</Link>
          </div>
        </div>
      </nav>

      <AuroraBackground>
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/10 mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="text-sm font-medium text-gray-300">The New Era of Music Distribution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 animate-slide-up leading-tight">
            Distribute Your Music <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] via-[#0047FF] to-[#7000FF]">
              Worldwide
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Release your music to Spotify, Apple Music, TikTok, YouTube Music, Amazon Music, Deezer, Boomplay, Audiomack and 150+ streaming platforms worldwide.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Link href="/register" className="px-8 py-4 rounded-full bg-gradient-to-r from-[#7000FF] to-[#0047FF] text-white font-semibold text-lg hover:opacity-90 transition shadow-[0_0_30px_rgba(112,0,255,0.4)]">
              Start Distributing
            </Link>
            <Link href="#pricing" className="px-8 py-4 rounded-full glass border border-white/10 text-white font-semibold text-lg hover:bg-white/5 transition flex items-center gap-2">
              <PlayCircle className="w-5 h-5" /> View Pricing
            </Link>
          </div>
        </div>

        {/* Premium Dashboard Mockup */}
        <div className="max-w-6xl mx-auto px-6 w-full animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="relative rounded-2xl glass-card overflow-hidden aspect-[16/9] border border-white/10 flex flex-col">
            {/* Mockup Header */}
            <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-black/20">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
            </div>
            {/* Mockup Body */}
            <div className="flex-1 p-8 flex gap-8">
              <div className="w-64 border-r border-white/10 hidden md:flex flex-col gap-4">
                <div className="h-8 w-3/4 bg-white/5 rounded" />
                <div className="h-8 w-full bg-white/10 rounded" />
                <div className="h-8 w-2/3 bg-white/5 rounded" />
                <div className="h-8 w-4/5 bg-white/5 rounded" />
              </div>
              <div className="flex-1 flex flex-col gap-6">
                <div className="flex gap-6">
                  <div className="flex-1 h-32 rounded-xl bg-gradient-to-br from-[#7000FF]/20 to-transparent border border-[#7000FF]/30 p-6 flex flex-col justify-between">
                    <span className="text-gray-400 text-sm">Total Revenue</span>
                    <span className="text-3xl font-bold">Rp 12.450.000</span>
                  </div>
                  <div className="flex-1 h-32 rounded-xl bg-gradient-to-br from-[#00F0FF]/20 to-transparent border border-[#00F0FF]/30 p-6 flex flex-col justify-between">
                    <span className="text-gray-400 text-sm">Total Streams</span>
                    <span className="text-3xl font-bold">1.2M</span>
                  </div>
                  <div className="flex-1 h-32 rounded-xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between">
                    <span className="text-gray-400 text-sm">Active Releases</span>
                    <span className="text-3xl font-bold">14</span>
                  </div>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-6">
                  <div className="h-full flex items-end gap-4">
                    <div className="w-full h-[30%] bg-blue-500/30 rounded-t" />
                    <div className="w-full h-[50%] bg-purple-500/30 rounded-t" />
                    <div className="w-full h-[80%] bg-cyan-500/30 rounded-t" />
                    <div className="w-full h-[60%] bg-blue-500/30 rounded-t" />
                    <div className="w-full h-[90%] bg-purple-500/30 rounded-t" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuroraBackground>
      
      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-[#09090B]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Everything you need to <span className="text-[#00F0FF]">succeed</span></h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">We provide world-class tools to manage your catalog, analyze your growth, and collect your royalties seamlessly.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#7000FF]/20 flex items-center justify-center text-[#7000FF]">
                <Music className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Fast Distribution</h3>
              <p className="text-gray-400">Your music is sent to over 150 platforms in a matter of hours. We ensure your releases are handled with the highest priority.</p>
            </div>
            <div className="glass-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00F0FF]/20 flex items-center justify-center text-[#00F0FF]">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Advanced Analytics</h3>
              <p className="text-gray-400">Track your streams, listeners, and revenue daily across all major platforms with our beautifully designed charts.</p>
            </div>
            <div className="glass-card p-8 flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Secure Royalties</h3>
              <p className="text-gray-400">We collect your earnings worldwide and provide a seamless withdrawal system straight to your bank account.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
