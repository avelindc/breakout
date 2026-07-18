import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.breakoutmusic.online"),
  title: {
    default: "BREAKOUT.ID - Premium Music Distribution",
    template: "%s | BREAKOUT.ID"
  },
  description: "Distribute your music worldwide to Spotify, Apple Music, TikTok, and 150+ platforms.",
  openGraph: {
    title: "BREAKOUT.ID - Premium Music Distribution",
    description: "Distribute your music worldwide to Spotify, Apple Music, TikTok, and 150+ platforms.",
    url: "https://www.breakoutmusic.online",
    siteName: "BREAKOUT.ID",
    locale: "id_ID",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        {/* Global Watermark */}
        <div className="fixed bottom-4 right-4 z-[99999] pointer-events-none select-none bg-black/50 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.5)] flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <p className="text-[10px] md:text-xs font-mono font-bold tracking-widest text-white/70">
            Dev // Copyright @Avelindc
          </p>
        </div>
      </body>
    </html>
  );
}
