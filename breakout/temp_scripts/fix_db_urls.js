const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("Updating old releases with .r2.dev to new domain...");
  
  const releases = await prisma.release.findMany();
  let updatedReleases = 0;
  
  for (const rel of releases) {
    if (rel.coverArtworkUrl && rel.coverArtworkUrl.includes(".r2.dev")) {
      const newCover = rel.coverArtworkUrl.replace(/https:\/\/[^\/]+\.r2\.dev/, "https://releases.breakoutmusic.online");
      
      await prisma.release.update({
        where: { id: rel.id },
        data: { coverArtworkUrl: newCover }
      });
      updatedReleases++;
    }
  }
  
  console.log(`Updated ${updatedReleases} releases cover URLs.`);
  
  const tracks = await prisma.track.findMany();
  let updatedTracks = 0;
  
  for (const track of tracks) {
    if (track.audioUrl && track.audioUrl.includes(".r2.dev")) {
      const newAudio = track.audioUrl.replace(/https:\/\/[^\/]+\.r2\.dev/, "https://releases.breakoutmusic.online");
      
      await prisma.track.update({
        where: { id: track.id },
        data: { audioUrl: newAudio }
      });
      updatedTracks++;
    }
  }
  
  console.log(`Updated ${updatedTracks} tracks audio URLs.`);
}

run().catch(console.error).finally(() => prisma.$disconnect());
