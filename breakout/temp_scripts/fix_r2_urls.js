const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const NEW_URL = "https://releases.breakoutmusic.online";
const BAD_URLS = [
  "https://releases.c1aaf27f910711776d0d2b338cc1ce46.r2.cloudflarestorage.com",
  "https://pub-7147b1bf75b74798aefe6ba7125f9a7c.r2.dev",
  "https://pub-8d96b346473c4f9ea93e32fa9e53b927.r2.dev"
];

function fixUrl(url) {
  if (!url) return url;
  let fixedUrl = url;
  for (const bad of BAD_URLS) {
    if (fixedUrl.includes(bad)) {
      fixedUrl = fixedUrl.replace(bad, NEW_URL);
    }
  }
  return fixedUrl;
}

async function run() {
  console.log(`Replacing all bad URLs with ${NEW_URL} ...`);
  
  const models = ['release', 'track', 'user', 'artist', 'settings', 'contract', 'message', 'catalogSong'];
  
  for (const model of models) {
    const items = await prisma[model].findMany();
    for (const item of items) {
      let data = {};
      
      if (model === 'release') {
        const fixed = fixUrl(item.coverArtworkUrl); if (fixed !== item.coverArtworkUrl) data.coverArtworkUrl = fixed;
      }
      else if (model === 'track') {
        const fixed = fixUrl(item.audioUrl); if (fixed !== item.audioUrl) data.audioUrl = fixed;
      }
      else if (model === 'user') {
        const fi = fixUrl(item.image); if (fi !== item.image) data.image = fi;
        const fk = fixUrl(item.ktpUrl); if (fk !== item.ktpUrl) data.ktpUrl = fk;
      }
      else if (model === 'artist') {
        const fixed = fixUrl(item.avatarUrl); if (fixed !== item.avatarUrl) data.avatarUrl = fixed;
      }
      else if (model === 'settings') {
        const fixed = fixUrl(item.value); if (fixed !== item.value) data.value = fixed;
      }
      else if (model === 'contract') {
        const fp = fixUrl(item.pdfUrl); if (fp !== item.pdfUrl) data.pdfUrl = fp;
        const fs = fixUrl(item.signatureUrl); if (fs !== item.signatureUrl) data.signatureUrl = fs;
      }
      else if (model === 'message') {
        const fixed = fixUrl(item.attachment); if (fixed !== item.attachment) data.attachment = fixed;
      }
      else if (model === 'catalogSong') {
        const fc = fixUrl(item.coverUrl); if (fc !== item.coverUrl) data.coverUrl = fc;
        const fa = fixUrl(item.audioUrl); if (fa !== item.audioUrl) data.audioUrl = fa;
      }

      if (Object.keys(data).length > 0) {
        await prisma[model].update({ where: { id: item.id }, data });
      }
    }
  }

  console.log("All bad URLs successfully updated to Custom Domain!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
