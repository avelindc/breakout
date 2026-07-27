const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const releases = await prisma.release.findMany({
    orderBy: { createdAt: 'asc' },
    take: 5
  });
  
  console.log("=== OLD RELEASES ===");
  for (const r of releases) {
    console.log(`\nID: ${r.id}, Title: ${r.title}`);
    console.log(`URL: ${r.coverArtworkUrl}`);
    if (r.coverArtworkUrl) {
      try {
        const res = await fetch(r.coverArtworkUrl, { method: 'HEAD' });
        console.log(`Status: ${res.status}`);
      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }
  }
}
run().finally(() => prisma.$disconnect());
