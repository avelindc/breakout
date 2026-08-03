import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const setting = await prisma.settings.findUnique({ where: { key: "LANDING_PAGE_CMS" } });
  
  if (!setting) {
    console.log("No CMS data found.");
    return;
  }

  const allUrls = setting.value.match(/https?:\/\/[^"\\]+/g) || [];
  const supabaseUrls = allUrls.filter(u => u.includes("supabase.co"));
  
  console.log(`Total URLs in CMS: ${allUrls.length}`);
  console.log(`Supabase URLs found: ${supabaseUrls.length}`);
  
  if (supabaseUrls.length > 0) {
    supabaseUrls.forEach(u => console.log("  SUPABASE:", u));
  } else {
    console.log("\nAll image URLs in CMS:");
    const imageUrls = allUrls.filter(u => 
      u.includes("http") && (u.includes("image") || u.includes("photo") || u.includes("avatar") || u.includes("logo") || u.includes("cover") || u.includes("background") || u.includes("thumbnail") || u.includes("assets") || u.includes("breakoutmusic") || u.includes("jpg") || u.includes("jpeg") || u.includes("png") || u.includes("webp"))
    );
    imageUrls.forEach(u => console.log("  IMAGE:", u));
  }
}

main().finally(() => prisma.$disconnect());
