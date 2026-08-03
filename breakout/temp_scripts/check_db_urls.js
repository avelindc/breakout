const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const releases = await prisma.release.findMany({ where: { coverArtworkUrl: { contains: 'supabase.co' } } });
  console.log('Releases:', releases.map(r => r.coverArtworkUrl));

  const tracks = await prisma.track.findMany({ where: { audioUrl: { contains: 'supabase.co' } } });
  console.log('Tracks:', tracks.map(t => t.audioUrl));

  const settings = await prisma.settings.findMany({ where: { value: { contains: 'supabase.co' } } });
  console.log('Settings:', settings.map(s => s.value));
}

run().then(() => prisma.$disconnect());
