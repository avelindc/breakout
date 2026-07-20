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
  aboutLabel: {
    title: string;
    description: string;
    vision: string;
    mission: string;
    imageUrl: string;
    isActive: boolean;
  };
  featuredReleases: {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    releaseDate: string;
    playerType: "youtube" | "spotify";
    playerUrl: string;
    order: number;
  }[];
  featuredArtists: {
    id: string;
    name: string;
    photo: string;
    genre: string;
    bio: string;
    instagram: string;
    spotify: string;
    youtube: string;
    order: number;
  }[];
  musicVideos: {
    id: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
    youtubeUrl: string;
    order: number;
  }[];
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
  faqSection: {
    badge: string;
    title: string;
    subtitle: string;
    isActive: boolean;
  };
  faqGroups: {
    id: string;
    title: string;
    colorClass: "orange" | "green" | "blue" | "purple";
    order: number;
    questions: {
      id: string;
      question: string;
      answer: string;
    }[];
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
  socialMedia: {
    instagram: string;
    tiktok: string;
    youtube: string;
    spotify: string;
    whatsapp: string;
    email: string;
  };
  stats: {
    totalArtists: number | null;
    totalReleases: number | null;
    totalStreams: number | null;
    autoFromDb: boolean;
  };
  design: {
    backgroundType: "aurora" | "color" | "image" | "video";
    backgroundColor: string;
    backgroundImage: string;
    backgroundVideo: string;
  };
};

const defaultCMSData: CMSData = {
  seo: {
    title: "Breakout Music Distribution",
    description: "Distribute your music worldwide to 150+ platforms.",
    keywords: "music, distribution, spotify, apple music, breakout",
  },
  design: {
    backgroundType: "aurora",
    backgroundColor: "#0B0F1A",
    backgroundImage: "",
    backgroundVideo: "",
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
  aboutLabel: {
    title: "About Breakout Music Record",
    description: "We are more than just a label. We are a movement dedicated to pushing the boundaries of sound and giving independent artists a global stage.",
    vision: "To be the leading platform for independent artists globally, breaking barriers and redefining the music industry.",
    mission: "Providing top-tier distribution, marketing, and support to artists so they can focus on what they do best: creating music.",
    imageUrl: "",
    isActive: true,
  },
  featuredReleases: [],
  featuredArtists: [],
  musicVideos: [],
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
  faqSection: {
    badge: "FAQ Creates",
    title: "Pertanyaan yang sering ditanyakan",
    subtitle: "Jawaban singkat tentang akun Creates, layanan Cover to Master, dan distribusi musik digital.",
    isActive: true,
  },
  faqGroups: [
    {
      id: "1",
      title: "FAQ Umum",
      colorClass: "orange",
      order: 1,
      questions: [
        { id: "1-1", question: "Apa itu Creates?", answer: "Platform distribusi musik indie." },
        { id: "1-2", question: "Apakah daftar di Creates berbayar?", answer: "Gratis untuk pendaftaran awal." },
        { id: "1-3", question: "Bagaimana cara menggunakan layanan Creates?", answer: "Buat akun, upload rilis, dan distribusikan." },
      ]
    },
    {
      id: "2",
      title: "FAQ CTM",
      colorClass: "green",
      order: 2,
      questions: [
        { id: "2-1", question: "Apa itu CTM?", answer: "Cover to Master adalah layanan legalisasi cover lagu." },
        { id: "2-2", question: "Kenapa cover saya kena copyright claim?", answer: "Karena belum ada lisensi resmi." },
      ]
    },
    {
      id: "3",
      title: "FAQ DMD",
      colorClass: "blue",
      order: 3,
      questions: [
        { id: "3-1", question: "Apa itu DMD?", answer: "Digital Music Distribution." },
        { id: "3-2", question: "Apakah karya original saya terlindungi?", answer: "Ya, kami menjaga hak cipta kreator." },
      ]
    }
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
  },
  socialMedia: {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/",
    youtube: "https://youtube.com/",
    spotify: "https://spotify.com/",
    whatsapp: "+6281234567890",
    email: "support@breakoutmusic.online",
  },
  stats: {
    totalArtists: null,
    totalReleases: null,
    totalStreams: null,
    autoFromDb: true,
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
    
    // Perform manual deep merge for known top-level objects to prevent missing nested fields
    return {
      ...defaultCMSData,
      ...parsedData,
      seo: { ...defaultCMSData.seo, ...(parsedData.seo || {}) },
      design: { ...defaultCMSData.design, ...(parsedData.design || {}) },
      hero: { ...defaultCMSData.hero, ...(parsedData.hero || {}) },
      about: { ...defaultCMSData.about, ...(parsedData.about || {}) },
      aboutLabel: { ...defaultCMSData.aboutLabel, ...(parsedData.aboutLabel || {}) },
      contact: { ...defaultCMSData.contact, ...(parsedData.contact || {}) },
      footer: { ...defaultCMSData.footer, ...(parsedData.footer || {}) },
      socialMedia: { ...defaultCMSData.socialMedia, ...(parsedData.socialMedia || {}) },
      stats: { ...defaultCMSData.stats, ...(parsedData.stats || {}) },
      faqSection: { ...defaultCMSData.faqSection, ...(parsedData.faqSection || {}) },
      faqGroups: parsedData.faqGroups || defaultCMSData.faqGroups,
      // Arrays are replaced entirely if they exist in DB, otherwise use default
      features: parsedData.features || defaultCMSData.features,
      pricing: parsedData.pricing || defaultCMSData.pricing,
      testimonials: parsedData.testimonials || defaultCMSData.testimonials,
      partners: parsedData.partners || defaultCMSData.partners,
      featuredReleases: parsedData.featuredReleases || defaultCMSData.featuredReleases,
      featuredArtists: parsedData.featuredArtists || defaultCMSData.featuredArtists,
      musicVideos: parsedData.musicVideos || defaultCMSData.musicVideos,
    };
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
