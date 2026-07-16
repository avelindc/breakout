import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.release.updateMany({
    where: { coverArtworkUrl: { contains: "placehold.co" } },
    data: { coverArtworkUrl: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=500&auto=format&fit=crop" }
  });
  console.log(`Updated ${count.count} records`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
