const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const rels = await prisma.release.findMany();
  console.log('Releases URLs:');
  console.log(rels.map(x => x.coverArtworkUrl).slice(0, 5));
}
run().finally(() => prisma.$disconnect());
