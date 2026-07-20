"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import { Play, X, Menu } from "lucide-react";

export function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: "easeOut" } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedCounter({ value, duration = 2 }: { value: number, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalSteps = 60 * duration;
      const step = end / totalSteps;
      let currentStep = 0;

      const timer = setInterval(() => {
        start += step;
        currentStep++;
        if (currentStep >= totalSteps) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 1000 / 60);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString("id-ID")}</span>;
}

export function Navbar({ cms }: { cms: any }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0F1A]/80 backdrop-blur-md border-b border-white/10 py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="Breakout Logo" className="h-10 w-auto" />
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
          <Link href="#releases" className="hover:text-white transition">Releases</Link>
          <Link href="#artists" className="hover:text-white transition">Artists</Link>
          <Link href="#videos" className="hover:text-white transition">Videos</Link>
          <Link href="#about" className="hover:text-white transition">About</Link>
        </div>
        
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium hover:text-white transition text-gray-300">Login</Link>
          <Link href={cms.hero.ctaLink} className="text-sm font-semibold bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]">{cms.hero.ctaText}</Link>
        </div>

        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#0B0F1A] border-b border-white/10 flex flex-col p-6 gap-4">
          <Link href="#releases" onClick={() => setMobileMenuOpen(false)}>Releases</Link>
          <Link href="#artists" onClick={() => setMobileMenuOpen(false)}>Artists</Link>
          <Link href="#videos" onClick={() => setMobileMenuOpen(false)}>Videos</Link>
          <Link href="#about" onClick={() => setMobileMenuOpen(false)}>About</Link>
          <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
          <Link href={cms.hero.ctaLink} onClick={() => setMobileMenuOpen(false)} className="text-[#00F0FF]">Start Distributing</Link>
        </div>
      )}
    </nav>
  );
}

export function PlayerModal({ 
  isOpen, 
  onClose, 
  url, 
  type 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  url: string, 
  type: "youtube" | "spotify" 
}) {
  if (!isOpen) return null;

  const getEmbedUrl = () => {
    if (type === "youtube") {
      try {
        const urlObj = new URL(url);
        let videoId = "";
        if (urlObj.hostname.includes("youtube.com")) videoId = urlObj.searchParams.get("v") || "";
        if (urlObj.hostname.includes("youtu.be")) videoId = urlObj.pathname.slice(1);
        return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      } catch (e) {
        return url;
      }
    }
    if (type === "spotify") {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname;
        return `https://open.spotify.com/embed${path}?utm_source=generator`;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl bg-[#111] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(112,0,255,0.2)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition backdrop-blur">
          <X className="w-5 h-5" />
        </button>
        <div className="w-full aspect-video">
          <iframe 
            src={getEmbedUrl()} 
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          />
        </div>
      </motion.div>
    </div>
  );
}

export function FeaturedReleaseCard({ release }: { release: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="glass-card p-4 rounded-3xl group hover:-translate-y-2 transition-all duration-300">
        <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
          <img src={release.coverUrl} alt={release.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition shadow-[0_0_30px_rgba(255,255,255,0.5)]"
            >
              <Play className="w-6 h-6 ml-1" />
            </button>
          </div>
        </div>
        <div className="px-2">
          <h3 className="text-xl font-bold text-white mb-1 truncate">{release.title}</h3>
          <p className="text-gray-400 text-sm">{release.artist}</p>
        </div>
      </div>
      <PlayerModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        url={release.playerUrl} 
        type={release.playerType} 
      />
    </>
  );
}
