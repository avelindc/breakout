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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
