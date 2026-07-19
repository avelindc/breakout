const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const releases = await prisma.release.findMany({
    include: { tracks: true }
  });

  const emptyReleases = releases.filter(r => !r.tracks || r.tracks.length === 0);
  
  if (emptyReleases.length > 0) {
    const ids = emptyReleases.map(r => r.id);
    const result = await prisma.release.deleteMany({
      where: { id: { in: ids } }
    });
    console.log("Berhasil menghapus", result.count, "release yang memiliki 0 track.");
  } else {
    console.log("TIDAK ADA release dengan 0 track. Semua aman.");
  }

  const missingAudio = releases.filter(r => r.tracks && r.tracks.some(t => !t.audioUrl || t.audioUrl === ""));
  if (missingAudio.length > 0) {
    const ids = missingAudio.map(r => r.id);
    const result = await prisma.release.deleteMany({
      where: { id: { in: ids } }
    });
    console.log("Berhasil menghapus", result.count, "release yang track-nya rusak (tanpa link audioUrl).");
  } else {
    console.log("TIDAK ADA release yang track-nya rusak.");
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
