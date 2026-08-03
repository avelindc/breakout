const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const releases = await prisma.release.findMany({ where: { coverArtworkUrl: { contains: 'supabase.co' } } });
  const tracks = await prisma.track.findMany({ where: { audioUrl: { contains: 'supabase.co' } } });
  const settings = await prisma.settings.findMany({ where: { value: { contains: 'supabase.co' } } });
  fs.writeFileSync('temp_scripts/urls.json', JSON.stringify({releases, tracks, settings}, null, 2), 'utf8');
}

run().then(() => prisma.$disconnect());
