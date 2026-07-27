const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const OLD_URL = "https://releases.c1aaf27f910711776d0d2b338cc1ce46.r2.cloudflarestorage.com";
const NEW_URL = "https://pub-7147b1bf75b74798aefe6ba7125f9a7c.r2.dev";

async function run() {
  console.log(`Replacing ${OLD_URL} with ${NEW_URL} ...`);
  
  // 1. Release
  const releases = await prisma.release.findMany();
  for (const r of releases) {
    if (r.coverArtworkUrl && r.coverArtworkUrl.includes(OLD_URL)) {
      await prisma.release.update({
        where: { id: r.id },
        data: { coverArtworkUrl: r.coverArtworkUrl.replace(OLD_URL, NEW_URL) }
      });
    }
  }

  // 2. Track
  const tracks = await prisma.track.findMany();
  for (const t of tracks) {
    if (t.audioUrl && t.audioUrl.includes(OLD_URL)) {
      await prisma.track.update({
        where: { id: t.id },
        data: { audioUrl: t.audioUrl.replace(OLD_URL, NEW_URL) }
      });
    }
  }

  // 3. User
  const users = await prisma.user.findMany();
  for (const u of users) {
    let data = {};
    if (u.image && u.image.includes(OLD_URL)) data.image = u.image.replace(OLD_URL, NEW_URL);
    if (u.ktpUrl && u.ktpUrl.includes(OLD_URL)) data.ktpUrl = u.ktpUrl.replace(OLD_URL, NEW_URL);
    if (Object.keys(data).length > 0) {
      await prisma.user.update({ where: { id: u.id }, data });
    }
  }

  // 4. Artist
  const artists = await prisma.artist.findMany();
  for (const a of artists) {
    if (a.avatarUrl && a.avatarUrl.includes(OLD_URL)) {
      await prisma.artist.update({
        where: { id: a.id },
        data: { avatarUrl: a.avatarUrl.replace(OLD_URL, NEW_URL) }
      });
    }
  }

  // 5. Settings
  const settings = await prisma.settings.findMany();
  for (const s of settings) {
    if (s.value && s.value.includes(OLD_URL)) {
      await prisma.settings.update({
        where: { id: s.id },
        data: { value: s.value.replace(OLD_URL, NEW_URL) }
      });
    }
  }

  // 6. Contract
  const contracts = await prisma.contract.findMany();
  for (const c of contracts) {
    let data = {};
    if (c.pdfUrl && c.pdfUrl.includes(OLD_URL)) data.pdfUrl = c.pdfUrl.replace(OLD_URL, NEW_URL);
    if (c.signatureUrl && c.signatureUrl.includes(OLD_URL)) data.signatureUrl = c.signatureUrl.replace(OLD_URL, NEW_URL);
    if (Object.keys(data).length > 0) {
      await prisma.contract.update({ where: { id: c.id }, data });
    }
  }

  // 7. Message
  const messages = await prisma.message.findMany();
  for (const m of messages) {
    if (m.attachment && m.attachment.includes(OLD_URL)) {
      await prisma.message.update({
        where: { id: m.id },
        data: { attachment: m.attachment.replace(OLD_URL, NEW_URL) }
      });
    }
  }

  // 8. CatalogSong
  const catalogs = await prisma.catalogSong.findMany();
  for (const c of catalogs) {
    let data = {};
    if (c.coverUrl && c.coverUrl.includes(OLD_URL)) data.coverUrl = c.coverUrl.replace(OLD_URL, NEW_URL);
    if (c.audioUrl && c.audioUrl.includes(OLD_URL)) data.audioUrl = c.audioUrl.replace(OLD_URL, NEW_URL);
    if (Object.keys(data).length > 0) {
      await prisma.catalogSong.update({ where: { id: c.id }, data });
    }
  }

  console.log("All URLs successfully updated to public R2 Dev URLs!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
