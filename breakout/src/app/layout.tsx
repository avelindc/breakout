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
        <div className="fixed bottom-2 right-3 z-[99999] pointer-events-none select-none flex items-center gap-1">
          <div className="w-1 h-1 bg-green-500/60 rounded-full animate-pulse"></div>
          <p className="text-[8px] font-mono font-medium tracking-wider text-gray-400/60">
            Dev // Copyright @Avelindc
          </p>
        </div>
      </body>
    </html>
  );
}
