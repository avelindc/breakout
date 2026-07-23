const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const latestRelease = await prisma.release.findFirst({
    orderBy: { createdAt: "desc" },
    include: { tracks: true }
  });
  console.log("Latest Release Cover URL:", latestRelease.coverArtworkUrl);
  if (latestRelease.tracks.length > 0) {
    console.log("Latest Release Audio URL:", latestRelease.tracks[0].audioUrl);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
