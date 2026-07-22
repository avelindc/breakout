const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const royalties = await prisma.royalty.findMany();
  console.log(JSON.stringify(royalties, null, 2));
}

main().finally(() => prisma.$disconnect());
