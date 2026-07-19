"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

const CMS_SETTING_KEY = "LANDING_PAGE_CMS";

export type CMSData = {
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    backgroundUrl: string;
  };
  about: {
    title: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
  };
  features: {
    id: string;
    title: string;
    description: string;
    icon: string;
  }[];
  pricing: {
    id: string;
    name: string;
    price: string;
    period: string;
    features: string[];
    isPopular: boolean;
    ctaText: string;
    ctaLink: string;
  }[];
  faq: {
    id: string;
    question: string;
    answer: string;
  }[];
  testimonials: {
    id: string;
    name: string;
    role: string;
    content: string;
    avatarUrl: string;
  }[];
  partners: {
    id: string;
    name: string;
    logoUrl: string;
  }[];
  contact: {
    email: string;
    whatsapp: string;
    address: string;
    isActive: boolean;
  };
  footer: {
    aboutText: string;
    copyright: string;
  };
};

const defaultCMSData: CMSData = {
  seo: {
    title: "Breakout Music Distribution",
    description: "Distribute your music worldwide to 150+ platforms.",
    keywords: "music, distribution, spotify, apple music, breakout",
  },
  hero: {
    badge: "The New Era of Music Distribution",
    title1: "Distribute Your Music",
    title2: "Worldwide",
    subtitle: "Release your music to Spotify, Apple Music, TikTok, YouTube Music, Amazon Music, Deezer, Boomplay, Audiomack and 150+ streaming platforms worldwide.",
    ctaText: "Start Distributing",
    ctaLink: "/register",
    secondaryCtaText: "View Pricing",
    secondaryCtaLink: "#pricing",
    backgroundUrl: "",
  },
  about: {
    title: "Tentang Breakout",
    description: "Breakout adalah agregator distribusi musik digital terbaik untuk musisi independen. Kami menyalurkan karya Anda ke seluruh dunia tanpa biaya tersembunyi.",
    imageUrl: "",
    isActive: true,
  },
  features: [
    {
      id: "1",
      title: "Fast Distribution",
      description: "Your music is sent to over 150 platforms in a matter of hours. We ensure your releases are handled with the highest priority.",
      icon: "Music"
    },
    {
      id: "2",
      title: "Advanced Analytics",
      description: "Track your streams, listeners, and revenue daily across all major platforms with our beautifully designed charts.",
      icon: "BarChart3"
    },
    {
      id: "3",
      title: "Secure Royalties",
      description: "We collect your earnings worldwide and provide a seamless withdrawal system straight to your bank account.",
      icon: "ShieldCheck"
    }
  ],
  pricing: [
    {
      id: "1",
      name: "Basic Plan",
      price: "Rp 0",
      period: "/tahun",
      features: ["Distribusi ke 150+ platform", "Royalti 80%", "Support Basic"],
      isPopular: false,
      ctaText: "Daftar Gratis",
      ctaLink: "/register"
    }
  ],
  faq: [
    { id: "1", question: "Berapa lama proses rilis?", answer: "Biasanya membutuhkan waktu 1-3 hari kerja untuk masuk ke Spotify dan Apple Music." }
  ],
  testimonials: [
    { id: "1", name: "John Doe", role: "Indie Artist", content: "Breakout sangat membantu karir musik saya!", avatarUrl: "" }
  ],
  partners: [],
  contact: {
    email: "support@breakoutmusic.online",
    whatsapp: "+6281234567890",
    address: "Jakarta, Indonesia",
    isActive: true,
  },
  footer: {
    aboutText: "Breakout Music Distribution. Empowering independent artists worldwide.",
    copyright: "© 2026 Breakout. All rights reserved."
  }
};

export async function getLandingPageCMS(): Promise<CMSData> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key: CMS_SETTING_KEY }
    });

    if (!setting) {
      return defaultCMSData;
    }

    // Merge DB data with default data to ensure missing fields are populated
    const parsedData = JSON.parse(setting.value);
    return { ...defaultCMSData, ...parsedData };
  } catch (error) {
    console.error("Failed to parse CMS Data:", error);
    return defaultCMSData;
  }
}

export async function saveLandingPageCMS(dataJson: string) {
  try {
    // Validate JSON
    const data = JSON.parse(dataJson);
    
    await prisma.settings.upsert({
      where: { key: CMS_SETTING_KEY },
      update: { value: dataJson },
      create: { 
        key: CMS_SETTING_KEY, 
        value: dataJson, 
        description: "Landing Page CMS Content" 
      }
    });

    // Revalidate paths so the landing page updates instantly without redeploy
    revalidatePath("/");
    revalidatePath("/admin/website-cms");

    return { success: true };
  } catch (error: any) {
    console.error("Save CMS Error:", error);
    return { error: error.stack || error.message || String(error) };
  }
}
